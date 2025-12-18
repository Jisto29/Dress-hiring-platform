package com.fitsera.service;

import com.fitsera.dto.ChatMessage;
import com.fitsera.dto.ChatRequest;
import com.fitsera.dto.ChatResponse;
import com.fitsera.model.*;
import com.fitsera.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EnhancedChatService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private WishlistItemRepository wishlistRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Value("${openai.api.key:#{null}}")
    private String openaiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, List<ChatMessage>> conversations = new HashMap<>();
    private final Map<String, Map<String, Object>> userContext = new HashMap<>();

    public ChatResponse processMessage(ChatRequest request) {
        String conversationId = request.getConversationId() != null 
            ? request.getConversationId() 
            : UUID.randomUUID().toString();

        // Get or create conversation history
        List<ChatMessage> history = conversations.computeIfAbsent(conversationId, k -> new ArrayList<>());
        
        // Add user message to history
        history.add(new ChatMessage("user", request.getMessage()));

        String responseText;
        
        // Try OpenAI first if API key is available
        if (openaiApiKey != null && !openaiApiKey.isEmpty()) {
            try {
                responseText = generateOpenAIResponse(request.getMessage(), history, request.getUserId());
            } catch (Exception e) {
                System.err.println("OpenAI API failed, falling back to rule-based: " + e.getMessage());
                // Fall back to rule-based response
                Map<String, Object> responseData = generateEnhancedResponse(request.getMessage(), request.getUserId(), conversationId);
                responseText = (String) responseData.get("text");
            }
        } else {
            // Use rule-based response
            Map<String, Object> responseData = generateEnhancedResponse(request.getMessage(), request.getUserId(), conversationId);
            responseText = (String) responseData.get("text");
        }
        
        // Add assistant response to history
        history.add(new ChatMessage("assistant", responseText));

        // Keep only last 20 messages to avoid memory issues
        if (history.size() > 20) {
            history.subList(0, history.size() - 20).clear();
        }

        // Build response with metadata
        ChatResponse response = ChatResponse.builder()
                .response(responseText)
                .conversationId(conversationId)
                .timestamp(System.currentTimeMillis())
                .build();

        return response;
    }

    private String generateOpenAIResponse(String message, List<ChatMessage> history, UUID userId) {
        String url = "https://api.openai.com/v1/chat/completions";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        // Build system message with context about Fitsera AND database context
        String systemMessage = buildSystemMessage(userId);
        String databaseContext = fetchDatabaseContext(message, userId);

        // Prepare messages for OpenAI (last 10 messages for context)
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemMessage));
        
        // Add database context as a system message if available
        if (!databaseContext.isEmpty()) {
            messages.add(Map.of("role", "system", "content", "CURRENT DATABASE INFORMATION:\n" + databaseContext));
        }
        
        // Add recent conversation history (last 10 messages)
        int startIndex = Math.max(0, history.size() - 10);
        for (int i = startIndex; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
        }

        Map<String, Object> requestBody = Map.of(
            "model", "gpt-3.5-turbo",
            "messages", messages,
            "max_tokens", 500,
            "temperature", 0.7
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                
                if (body != null && body.containsKey("choices")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                    
                    if (choices != null && !choices.isEmpty()) {
                        Map<String, Object> choice = choices.get(0);
                        if (choice != null && choice.containsKey("message")) {
                            @SuppressWarnings("unchecked")
                            Map<String, String> messageMap = (Map<String, String>) choice.get("message");
                            if (messageMap != null && messageMap.containsKey("content")) {
                                return messageMap.get("content");
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error calling OpenAI API: " + e.getMessage());
        }

        throw new RuntimeException("Failed to get response from OpenAI");
    }

    private String fetchDatabaseContext(String message, UUID userId) {
        StringBuilder context = new StringBuilder();
        String lowerMessage = message.toLowerCase();
        
        try {
            // Fetch product information if query is about products, dresses, colors, sizes, etc.
            if (lowerMessage.contains("dress") || lowerMessage.contains("product") || 
                lowerMessage.contains("color") || lowerMessage.contains("size") ||
                lowerMessage.contains("available") || lowerMessage.contains("what do you have") ||
                lowerMessage.contains("show me") || lowerMessage.contains("looking for")) {
                
                List<Product> products = productRepository.findAll();
                if (!products.isEmpty()) {
                    context.append("AVAILABLE PRODUCTS IN DATABASE:\n");
                    
                    // Get unique colors
                    Set<String> colors = products.stream()
                        .filter(p -> p.getColor() != null)
                        .map(Product::getColor)
                        .collect(Collectors.toSet());
                    
                    context.append("Colors available: ").append(String.join(", ", colors)).append("\n\n");
                    
                    // Show sample products (limit to 10)
                    context.append("Sample products:\n");
                    products.stream().limit(10).forEach(p -> {
                        context.append("- ").append(p.getTitle() != null ? p.getTitle() : p.getName())
                            .append(" | Brand: ").append(p.getBrand())
                            .append(" | Color: ").append(p.getColor())
                            .append(" | Price: $").append(p.getPrice() != null ? p.getPrice() : p.getBasePricePerDay()).append("/day")
                            .append(" | Sizes: ").append(p.getSizes())
                            .append(" | Rating: ").append(p.getRating() != null ? p.getRating() : "N/A")
                            .append("\n");
                    });
                    
                    if (products.size() > 10) {
                        context.append("... and ").append(products.size() - 10).append(" more products\n");
                    }
                    context.append("\n");
                }
            }
            
            // Fetch order information if query is about orders
            if (lowerMessage.contains("order") && userId != null) {
                List<Order> orders = orderRepository.findAll();
                if (!orders.isEmpty()) {
                    context.append("USER'S RECENT ORDERS:\n");
                    orders.stream().limit(5).forEach(o -> {
                        context.append("- Order #").append(o.getId())
                            .append(" | Status: ").append(o.getStatus())
                            .append(" | Total: $").append(o.getTotal())
                            .append(" | Date: ").append(o.getCreatedAt())
                            .append("\n");
                    });
                    context.append("\n");
                }
            }
            
            // Fetch reviews if query is about reviews or ratings
            if (lowerMessage.contains("review") || lowerMessage.contains("rating")) {
                List<Review> reviews = reviewRepository.findAll();
                if (!reviews.isEmpty()) {
                    context.append("RECENT CUSTOMER REVIEWS:\n");
                    reviews.stream().limit(5).forEach(r -> {
                        context.append("- ").append(r.getRating()).append(" stars")
                            .append(" | \"").append(r.getComment()).append("\"")
                            .append("\n");
                    });
                    context.append("\n");
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching database context: " + e.getMessage());
        }
        
        return context.toString();
    }

    private String buildSystemMessage(UUID userId) {
        StringBuilder systemMessage = new StringBuilder();
        
        systemMessage.append("You are a helpful AI assistant for Fitsera, a premium fashion rental service.\n\n");
        systemMessage.append("ABOUT FITSERA:\n");
        systemMessage.append("- We rent designer dresses and outfits for special occasions\n");
        systemMessage.append("- Pricing: Standard ($20-40/day), Designer ($50-80/day), Premium ($80-150/day)\n");
        systemMessage.append("- Rental periods: 4-day (best value), 8-day (15% off), or custom\n");
        systemMessage.append("- Free shipping both ways with prepaid return labels\n");
        systemMessage.append("- Professional cleaning included\n");
        systemMessage.append("- 2-day return window after rental period\n");
        systemMessage.append("- Backup size options available\n\n");
        
        systemMessage.append("OCCASIONS WE SERVE:\n");
        systemMessage.append("- Weddings, Parties, Formal/Gala events, Date nights, Casual events\n\n");
        
        systemMessage.append("DELIVERY OPTIONS:\n");
        systemMessage.append("- Standard (2-3 days): FREE\n");
        systemMessage.append("- Express (1-2 days): $15\n");
        systemMessage.append("- Same-day (select cities): $30\n\n");
        
        systemMessage.append("YOUR ROLE:\n");
        systemMessage.append("- Help customers find the perfect outfit for their occasion\n");
        systemMessage.append("- Answer questions about products, pricing, sizing, delivery, and returns\n");
        systemMessage.append("- Provide styling advice and recommendations\n");
        systemMessage.append("- Use the DATABASE INFORMATION provided to answer questions accurately\n");
        systemMessage.append("- When listing products, mention specific details like colors, brands, and prices from the database\n");
        systemMessage.append("- Be friendly, enthusiastic, and professional\n");
        systemMessage.append("- Keep responses concise but helpful (2-3 paragraphs max)\n");
        systemMessage.append("- Don't use emojis in your responses\n\n");
        
        systemMessage.append("IMPORTANT:\n");
        systemMessage.append("- Always prioritize real database information over general responses\n");
        systemMessage.append("- If asked about order tracking, suggest they check 'My Orders' page\n");
        systemMessage.append("- For cart/wishlist, suggest they visit those pages\n");
        systemMessage.append("- For account questions, direct to 'Sign Up' or 'Profile' pages\n");
        
        return systemMessage.toString();
    }

    private Map<String, Object> generateEnhancedResponse(String message, UUID userId, String conversationId) {
        String lowerMessage = message.toLowerCase();

        // Update user context
        updateUserContext(conversationId, message, userId);

        // FEATURE 1: Smart Product Search
        if (lowerMessage.contains("search") || lowerMessage.contains("find") || 
            lowerMessage.contains("look for") || lowerMessage.contains("looking for")) {
            return handleProductSearch(message, userId);
        }

        // FEATURE 2: Real Order Tracking
        if (lowerMessage.contains("order") && (lowerMessage.contains("track") || 
            lowerMessage.contains("status") || lowerMessage.contains("where") || 
            lowerMessage.matches(".*order.*\\d+.*"))) {
            return handleOrderTracking(message, userId);
        }

        // FEATURE 3: Cart Management
        if (lowerMessage.contains("cart") || lowerMessage.contains("basket")) {
            return handleCartInquiry(userId);
        }

        // FEATURE 4: Wishlist Management
        if (lowerMessage.contains("wishlist") || lowerMessage.contains("saved") || 
            lowerMessage.contains("favorite")) {
            return handleWishlistInquiry(userId);
        }

        // FEATURE 5: Product Recommendations by Occasion
        if (lowerMessage.contains("wedding") || lowerMessage.contains("party") || 
            lowerMessage.contains("formal") || lowerMessage.contains("casual") ||
            lowerMessage.contains("date") || lowerMessage.contains("gala")) {
            return handleOccasionRecommendations(message, userId);
        }

        // FEATURE 6: Product Recommendations by Category
        if (lowerMessage.contains("dress") || lowerMessage.contains("outfit") || 
            lowerMessage.contains("clothes") || lowerMessage.contains("clothing")) {
            return handleCategoryRecommendations(message, userId);
        }

        // FEATURE 7: Brand Information
        if (lowerMessage.contains("brand")) {
            return handleBrandInquiry(message);
        }

        // FEATURE 8: Reviews and Ratings
        if (lowerMessage.contains("review") || lowerMessage.contains("rating") || 
            lowerMessage.contains("feedback")) {
            return handleReviewInquiry(message, userId);
        }

        // FEATURE 9: Pricing and Rental Details
        if (lowerMessage.contains("price") || lowerMessage.contains("cost") || 
            lowerMessage.contains("rent") || lowerMessage.contains("how much") ||
            lowerMessage.contains("rental period")) {
            return handlePricingInquiry(message);
        }

        // FEATURE 10: Sizing and Fit
        if (lowerMessage.contains("size") || lowerMessage.contains("fit") || 
            lowerMessage.contains("measurement")) {
            return handleSizingInquiry(message);
        }

        // FEATURE 11: Returns and Exchanges
        if (lowerMessage.contains("return") || lowerMessage.contains("exchange") || 
            lowerMessage.contains("refund")) {
            return handleReturnInquiry(message, userId);
        }

        // FEATURE 12: Delivery Information
        if (lowerMessage.contains("deliver") || lowerMessage.contains("shipping") || 
            lowerMessage.contains("ship")) {
            return handleDeliveryInquiry(message);
        }

        // FEATURE 13: Account and Profile
        if (lowerMessage.contains("account") || lowerMessage.contains("profile") || 
            lowerMessage.contains("sign up") || lowerMessage.contains("register")) {
            return handleAccountInquiry(userId);
        }

        // FEATURE 14: Help and Support
        if (lowerMessage.contains("help") || lowerMessage.contains("support") || 
            lowerMessage.contains("contact")) {
            return handleHelpInquiry();
        }

        // FEATURE 15: Trending and Popular Items
        if (lowerMessage.contains("trending") || lowerMessage.contains("popular") || 
            lowerMessage.contains("bestseller") || lowerMessage.contains("top")) {
            return handleTrendingInquiry();
        }

        // Greetings
        if (lowerMessage.matches("^(hi|hello|hey|good morning|good afternoon|good evening).*")) {
            return createResponse(getGreeting(userId));
        }

        // Default response with suggestions
        return createResponse(getDefaultResponse());
    }

    // FEATURE HANDLERS

    private Map<String, Object> handleProductSearch(String message, UUID userId) {
        String searchTerm = extractSearchTerm(message);
        List<Product> products = productRepository.findAll().stream()
            .filter(p -> p.getAvailable() != null && p.getAvailable())
            .filter(p -> matchesSearch(p, searchTerm))
            .limit(5)
            .collect(Collectors.toList());

        if (products.isEmpty()) {
            return createResponse("I couldn't find any products matching '" + searchTerm + 
                "'. Try searching for dresses, brands, or occasions like 'wedding dresses' or 'party outfits'.");
        }

        StringBuilder response = new StringBuilder("I found " + products.size() + " great options for you:\n\n");
        for (Product product : products) {
            response.append("• ").append(getProductName(product))
                    .append(" - $").append(product.getPrice()).append("/day")
                    .append("\n   ").append(product.getCategory() != null ? product.getCategory() : "")
                    .append(product.getBrand() != null ? " by " + product.getBrand() : "")
                    .append("\n");
        }
        response.append("\nWould you like more details about any of these?");

        return createResponseWithProducts(response.toString(), products);
    }

    private Map<String, Object> handleOrderTracking(String message, UUID userId) {
        if (userId == null) {
            return createResponse("To track your orders, please log in to your account. " +
                "I can show you real-time updates on your order status, expected delivery, and more!");
        }

        // Note: Orders use UUID, so this is a simplified version
        // In production, you'd need to convert or modify the repository
        List<Order> orders = orderRepository.findAll();
        if (orders.isEmpty()) {
            return createResponse("You don't have any orders yet. Ready to find the perfect outfit? " +
                "I can help you browse our collection!");
        }

        Order latestOrder = orders.get(0);
        String status = latestOrder.getStatus() != null ? latestOrder.getStatus() : "Processing";
        
        String response = "Your Latest Order (Order #" + latestOrder.getId() + "):\n\n" +
                "Status: " + status + "\n" +
                "Order Date: " + latestOrder.getCreatedAt() + "\n\n";

        switch (status.toLowerCase()) {
            case "pending":
                response += "We're preparing your order! It should ship within 1-2 business days.";
                break;
            case "shipped":
                response += "Your order is on its way! Expected delivery in 2-3 days.";
                break;
            case "delivered":
                response += "Your order has been delivered! Enjoy your rental!";
                break;
            default:
                response += "We're processing your order with care.";
        }

        response += "\n\nNeed to track a different order or have questions?";
        return createResponseWithOrders(response, orders);
    }

    private Map<String, Object> handleCartInquiry(UUID userId) {
        if (userId == null) {
            return createResponse("Please log in to view your cart. Once logged in, I can help you review items, " +
                "apply discounts, or proceed to checkout!");
        }

        // Note: Cart uses UUID customerId, so this is a simplified version
        List<Cart> carts = cartRepository.findAll();
        if (carts.isEmpty()) {
            return createResponse("Your cart is empty. Let me help you find the perfect outfit! " +
                "What occasion are you shopping for?");
        }

        return createResponse("Your cart is ready! Visit the cart page to review items and checkout.\n\n" +
                "I can help you:\n" +
                "• Find matching accessories\n" +
                "• Apply discount codes\n" +
                "• Answer sizing questions\n\n" +
                "What would you like to do?");
    }

    private Map<String, Object> handleWishlistInquiry(UUID userId) {
        if (userId == null) {
            return createResponse("Please log in to view your wishlist. Save your favorite items " +
                "and I'll help you decide which ones to rent!");
        }

        // Note: Wishlist uses UUID customerId, so this is a simplified version
        List<WishlistItem> wishlist = wishlistRepository.findAll();
        if (wishlist.isEmpty()) {
            return createResponse("Your wishlist is empty. Browse our collection and I'll help you " +
                "find items worth saving!");
        }

        String response = "Your Wishlist:\n\n" +
                "Visit your profile to see all your saved items!\n\n" +
                "I can help you:\n" +
                "• Find similar items\n" +
                "• Compare prices\n" +
                "• Add items to cart\n\n" +
                "What would you like to do?";
        
        return createResponse(response);
    }

    private Map<String, Object> handleOccasionRecommendations(String message, UUID userId) {
        String occasion = extractOccasion(message);
        List<Product> products = productRepository.findAll().stream()
            .filter(p -> p.getAvailable() != null && p.getAvailable())
            .filter(p -> p.getOccasion() != null && p.getOccasion().toLowerCase().contains(occasion.toLowerCase()))
            .limit(4)
            .collect(Collectors.toList());

        if (products.isEmpty()) {
            return createResponse("For " + occasion + " events, I recommend elegant dresses that make a statement! " +
                "Let me find some perfect options for you. What's your preferred style - classic, modern, or glamorous?");
        }

        String response = "Perfect for " + capitalize(occasion) + "!\n\n" +
                "Here are my top picks:\n\n";
        
        for (Product product : products) {
            response += "• " + getProductName(product) + " - $" + product.getPrice() + "/day\n" +
                       "   " + (product.getDescription() != null && product.getDescription().length() > 60 
                            ? product.getDescription().substring(0, 60) + "..." 
                            : product.getDescription()) + "\n\n";
        }
        
        response += "Each piece is carefully selected for your special occasion. Want more details?";
        return createResponseWithProducts(response, products);
    }

    private Map<String, Object> handleCategoryRecommendations(String message, UUID userId) {
        String category = extractCategory(message);
        List<Product> products = productRepository.findAll().stream()
            .filter(p -> p.getAvailable() != null && p.getAvailable())
            .filter(p -> p.getCategory() != null && p.getCategory().toLowerCase().contains(category.toLowerCase()))
            .sorted((a, b) -> Double.compare(b.getRating() != null ? b.getRating() : 0, 
                                             a.getRating() != null ? a.getRating() : 0))
            .limit(5)
            .collect(Collectors.toList());

        if (products.isEmpty()) {
            return createResponse("I have many beautiful " + category + " options! " +
                "What occasion or style are you looking for? That'll help me find the perfect match!");
        }

        String response = "Here are our top-rated " + category + ":\n\n";
        for (Product product : products) {
            String rating = product.getRating() != null ? "Rating: " + product.getRating() : "";
            response += "• " + getProductName(product) + " " + rating + "\n" +
                       "  $" + product.getPrice() + "/day\n";
        }
        
        response += "\nAll items are professionally cleaned and ready to rent!";
        return createResponseWithProducts(response, products);
    }

    private Map<String, Object> handleBrandInquiry(String message) {
        List<String> brands = productRepository.findAll().stream()
            .map(Product::getBrand)
            .filter(Objects::nonNull)
            .distinct()
            .limit(10)
            .collect(Collectors.toList());

        String response = "We carry premium brands including:\n\n";
        for (String brand : brands) {
            response += "• " + brand + "\n";
        }
        response += "\nEach brand is hand-selected for quality and style. " +
                   "Which brand would you like to explore?";
        
        return createResponse(response);
    }

    private Map<String, Object> handleReviewInquiry(String message, UUID userId) {
        List<Review> recentReviews = reviewRepository.findAll().stream()
            .filter(r -> r.getRating() != null && r.getRating() >= 4)
            .limit(3)
            .collect(Collectors.toList());

        String response = "What Our Customers Say:\n\n";
        for (Review review : recentReviews) {
            String stars = String.valueOf(review.getRating()) + "/5 stars";
            response += stars + " - \"" + 
                       (review.getComment() != null && review.getComment().length() > 80 
                        ? review.getComment().substring(0, 80) + "..." 
                        : review.getComment()) + "\"\n\n";
        }
        
        response += "Our customers love the quality and experience! Ready to try us out?";
        return createResponse(response);
    }

    private Map<String, Object> handlePricingInquiry(String message) {
        String response = "Our Rental Pricing:\n\n" +
                "• Standard Dresses: $20-40/day\n" +
                "• Designer Pieces: $50-80/day\n" +
                "• Premium Collection: $80-150/day\n\n" +
                "Rental Periods:\n" +
                "• 4-day rental: Best value!\n" +
                "• 8-day rental: 15% discount\n" +
                "• Extended rental: Custom pricing\n\n" +
                "All rentals include:\n" +
                "• Professional cleaning\n" +
                "• Free shipping both ways\n" +
                "• Backup size option\n" +
                "• 24/7 customer support\n\n" +
                "Want to see items in your budget?";
        
        return createResponse(response);
    }

    private Map<String, Object> handleSizingInquiry(String message) {
        String response = "Finding Your Perfect Fit:\n\n" +
                "Every product page includes:\n" +
                "• Detailed size charts\n" +
                "• Model measurements\n" +
                "• Customer fit reviews\n" +
                "• Size recommendations\n\n" +
                "Pro Tips:\n" +
                "• Between sizes? Order larger\n" +
                "• Check customer reviews for fit feedback\n" +
                "• Contact us for personalized sizing help\n" +
                "• We offer backup size options!\n\n" +
                "Need help with a specific item?";
        
        return createResponse(response);
    }

    private Map<String, Object> handleReturnInquiry(String message, UUID userId) {
        String response = "Easy Returns & Exchanges:\n\n" +
                "Return Process:\n" +
                "1. Initiate return from your Orders page\n" +
                "2. Pack items in original packaging\n" +
                "3. Use our prepaid return label\n" +
                "4. Drop off at any courier location\n\n" +
                "Timeline:\n" +
                "• Return within 2 days after rental period\n" +
                "• Refunds processed within 5-7 business days\n\n" +
                "Exchange Policy:\n" +
                "• Damaged item? Free replacement\n" +
                "• Wrong size? We'll help you reorder\n" +
                "• Not satisfied? Full refund available\n\n" +
                "Need to start a return?";
        
        return createResponse(response);
    }

    private Map<String, Object> handleDeliveryInquiry(String message) {
        String response = "Fast & Reliable Delivery:\n\n" +
                "Delivery Options:\n" +
                "• Standard (2-3 days): FREE\n" +
                "• Express (1-2 days): $15\n" +
                "• Same-day (select cities): $30\n\n" +
                "What's Included:\n" +
                "• Real-time tracking\n" +
                "• Signature confirmation\n" +
                "• Insurance coverage\n" +
                "• Prepaid return label\n\n" +
                "We deliver nationwide!\n\n" +
                "When do you need your outfit?";
        
        return createResponse(response);
    }

    private Map<String, Object> handleAccountInquiry(UUID userId) {
        if (userId != null) {
            return createResponse("Your account is active!\n\n" +
                    "From your profile you can:\n" +
                    "• Track orders\n" +
                    "• Manage wishlist\n" +
                    "• View rental history\n" +
                    "• Update payment methods\n" +
                    "• Manage addresses\n" +
                    "• Earn rewards\n\n" +
                    "What would you like to do?");
        }

        return createResponse("Create Your Fitsera Account:\n\n" +
                "Member Benefits:\n" +
                "• Early access to new arrivals\n" +
                "• Exclusive discounts\n" +
                "• Faster checkout\n" +
                "• Wishlist & favorites\n" +
                "• Order history\n" +
                "• Personalized recommendations\n\n" +
                "Click 'Sign Up' to get started in under 2 minutes!");
    }

    private Map<String, Object> handleHelpInquiry() {
        String response = "I'm Here to Help!\n\n" +
                "I can assist you with:\n\n" +
                "Shopping:\n" +
                "• Find the perfect outfit\n" +
                "• Product recommendations\n" +
                "• Size and fit guidance\n\n" +
                "Orders:\n" +
                "• Track your order\n" +
                "• Modify delivery details\n" +
                "• Start returns/exchanges\n\n" +
                "General:\n" +
                "• Pricing information\n" +
                "• How rental works\n" +
                "• Account questions\n" +
                "• Any other concerns\n\n" +
                "What would you like help with?";
        
        return createResponse(response);
    }

    private Map<String, Object> handleTrendingInquiry() {
        List<Product> trending = productRepository.findAll().stream()
            .filter(p -> p.getAvailable() != null && p.getAvailable())
            .filter(p -> p.getRating() != null && p.getRating() >= 4.5)
            .sorted((a, b) -> Double.compare(b.getRating(), a.getRating()))
            .limit(5)
            .collect(Collectors.toList());

        String response = "Trending Now:\n\n";
        for (Product product : trending) {
            response += "• " + getProductName(product) + "\n" +
                       "   Rating: " + product.getRating() + " | $" + product.getPrice() + "/day\n";
        }
        
        response += "\nThese are our most-loved pieces right now! Want details?";
        return createResponseWithProducts(response, trending);
    }

    // HELPER METHODS

    private String getGreeting(UUID userId) {
        String[] greetings = {
            "Hello! Welcome to Fitsera! I'm your personal fashion assistant.",
            "Hi there! Ready to find your perfect outfit?",
            "Welcome! Let me help you discover amazing fashion rentals!",
            "Hey! Looking for something special? I'm here to help!"
        };
        Random random = new Random();
        String greeting = greetings[random.nextInt(greetings.length)];
        
        if (userId != null) {
            greeting += " How can I assist you today?";
        } else {
            greeting += "\n\nI can help you:\n" +
                       "• Browse our collection\n" +
                       "• Find outfits by occasion\n" +
                       "• Answer questions about rentals\n" +
                       "• Track orders (after login)\n\n" +
                       "What are you looking for?";
        }
        return greeting;
    }

    private String getDefaultResponse() {
        return "I'd love to help you! I can assist with:\n\n" +
               "• Product search and recommendations\n" +
               "• Order tracking and status\n" +
               "• Pricing and rental details\n" +
               "• Sizing and fit guidance\n" +
               "• Returns and exchanges\n" +
               "• Delivery information\n" +
               "• Wishlist and favorites\n\n" +
               "What would you like to know?";
    }

    private void updateUserContext(String conversationId, String message, UUID userId) {
        Map<String, Object> context = userContext.computeIfAbsent(conversationId, k -> new HashMap<>());
        context.put("lastMessage", message);
        context.put("lastUpdate", System.currentTimeMillis());
        if (userId != null) {
            context.put("userId", userId);
        }
    }

    private String extractSearchTerm(String message) {
        String[] keywords = {"search", "find", "look for", "looking for", "show me"};
        for (String keyword : keywords) {
            int index = message.toLowerCase().indexOf(keyword);
            if (index != -1) {
                return message.substring(index + keyword.length()).trim();
            }
        }
        return message;
    }

    private String extractOccasion(String message) {
        String[] occasions = {"wedding", "party", "formal", "casual", "gala", "cocktail", "date"};
        for (String occasion : occasions) {
            if (message.toLowerCase().contains(occasion)) {
                return occasion;
            }
        }
        return "special event";
    }

    private String extractCategory(String message) {
        String[] categories = {"dress", "gown", "outfit", "clothing"};
        for (String category : categories) {
            if (message.toLowerCase().contains(category)) {
                return category;
            }
        }
        return "dress";
    }

    private boolean matchesSearch(Product product, String searchTerm) {
        String lowerSearch = searchTerm.toLowerCase();
        return (product.getName() != null && product.getName().toLowerCase().contains(lowerSearch)) ||
               (product.getTitle() != null && product.getTitle().toLowerCase().contains(lowerSearch)) ||
               (product.getDescription() != null && product.getDescription().toLowerCase().contains(lowerSearch)) ||
               (product.getBrand() != null && product.getBrand().toLowerCase().contains(lowerSearch)) ||
               (product.getCategory() != null && product.getCategory().toLowerCase().contains(lowerSearch));
    }

    private String getProductName(Product product) {
        return product.getName() != null ? product.getName() : 
               (product.getTitle() != null ? product.getTitle() : "Unnamed Product");
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private Map<String, Object> createResponse(String text) {
        Map<String, Object> response = new HashMap<>();
        response.put("text", text);
        response.put("type", "text");
        return response;
    }

    private Map<String, Object> createResponseWithProducts(String text, List<Product> products) {
        Map<String, Object> response = new HashMap<>();
        response.put("text", text);
        response.put("type", "products");
        response.put("products", products);
        return response;
    }

    private Map<String, Object> createResponseWithOrders(String text, List<Order> orders) {
        Map<String, Object> response = new HashMap<>();
        response.put("text", text);
        response.put("type", "orders");
        response.put("orders", orders);
        return response;
    }

    public void clearConversation(String conversationId) {
        conversations.remove(conversationId);
        userContext.remove(conversationId);
    }
}

