package com.fitsera.service;

import com.fitsera.dto.ChatMessage;
import com.fitsera.dto.ChatRequest;
import com.fitsera.dto.ChatResponse;
import com.fitsera.model.Product;
import com.fitsera.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ProductRepository productRepository;

    @Value("${openai.api.key:#{null}}")
    private String openaiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, List<ChatMessage>> conversations = new HashMap<>();

    public ChatResponse processMessage(ChatRequest request) {
        String conversationId = request.getConversationId() != null 
            ? request.getConversationId() 
            : UUID.randomUUID().toString();

        // Get or create conversation history
        List<ChatMessage> history = conversations.computeIfAbsent(conversationId, k -> new ArrayList<>());
        
        // Add user message to history
        history.add(new ChatMessage("user", request.getMessage()));

        // Generate response
        String response;
        if (openaiApiKey != null && !openaiApiKey.isEmpty()) {
            response = generateOpenAIResponse(request.getMessage(), history);
        } else {
            response = generateRuleBasedResponse(request.getMessage(), request.getUserId());
        }

        // Add assistant response to history
        history.add(new ChatMessage("assistant", response));

        // Keep only last 10 messages to avoid memory issues
        if (history.size() > 10) {
            history.subList(0, history.size() - 10).clear();
        }

        return ChatResponse.builder()
                .response(response)
                .conversationId(conversationId)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    @SuppressWarnings("unchecked")
    private String generateOpenAIResponse(String message, List<ChatMessage> history) {
        try {
            String url = "https://api.openai.com/v1/chat/completions";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            // Build system message with context
            String systemMessage = buildSystemMessage();

            // Prepare messages for OpenAI
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemMessage));
            
            // Add conversation history
            for (ChatMessage msg : history) {
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }

            Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo",
                "messages", messages,
                "max_tokens", 500,
                "temperature", 0.7
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, 
                (Class<Map<String, Object>>)(Class<?>)Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> body = response.getBody();
                if (body != null) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                    if (choices != null && !choices.isEmpty()) {
                        Map<String, Object> choice = choices.get(0);
                        Map<String, String> messageMap = (Map<String, String>) choice.get("message");
                        return messageMap.get("content");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error calling OpenAI API: " + e.getMessage());
        }
        
        // Fallback to rule-based if OpenAI fails
        return generateRuleBasedResponse(message, null);
    }

    private String generateRuleBasedResponse(String message, UUID userId) {
        String lowerMessage = message.toLowerCase();

        // Product recommendations
        if (lowerMessage.contains("recommend") || lowerMessage.contains("suggestion") || 
            lowerMessage.contains("looking for") || lowerMessage.contains("show me")) {
            return generateProductRecommendations(lowerMessage);
        }

        // Order tracking
        if (lowerMessage.contains("order") && (lowerMessage.contains("track") || 
            lowerMessage.contains("status") || lowerMessage.contains("where is"))) {
            return "To track your order, please visit the 'My Orders' page in your profile. " +
                   "You can view real-time status updates and estimated delivery times there.";
        }

        // Pricing and rental info
        if (lowerMessage.contains("price") || lowerMessage.contains("cost") || 
            lowerMessage.contains("rent") || lowerMessage.contains("how much")) {
            return "Our rental prices vary by item. Most dresses range from $20-$50 per day. " +
                   "Designer pieces may be priced higher. You can see the exact price on each product page. " +
                   "We also offer weekly rental options at discounted rates!";
        }

        // Returns and exchanges
        if (lowerMessage.contains("return") || lowerMessage.contains("exchange")) {
            return "We offer hassle-free returns! You can initiate a return from your Orders page. " +
                   "Items must be returned within 2 days after your rental period ends. " +
                   "Our prepaid return labels make it easy - just drop it off at any courier location.";
        }

        // Sizing
        if (lowerMessage.contains("size") || lowerMessage.contains("fit")) {
            return "Each product page includes detailed size charts and measurements. " +
                   "We recommend checking the size guide carefully. If you're between sizes, " +
                   "we suggest ordering the larger size. You can also read reviews from other customers about fit!";
        }

        // Occasions
        if (lowerMessage.contains("wedding") || lowerMessage.contains("party") || 
            lowerMessage.contains("event") || lowerMessage.contains("occasion")) {
            return generateOccasionRecommendations(lowerMessage);
        }

        // Brands
        if (lowerMessage.contains("brand")) {
            return "We carry a wide selection of premium brands including designer labels. " +
                   "Browse our 'Brands' page to see our full collection organized by designer. " +
                   "Popular brands include evening wear designers, contemporary labels, and luxury fashion houses.";
        }

        // Delivery
        if (lowerMessage.contains("deliver") || lowerMessage.contains("shipping")) {
            return "We offer fast delivery across most locations! Standard delivery takes 2-3 business days. " +
                   "Express delivery (1-2 days) is also available at checkout. " +
                   "All deliveries are tracked and insured.";
        }

        // Account/signup
        if (lowerMessage.contains("account") || lowerMessage.contains("sign up") || 
            lowerMessage.contains("register")) {
            return "Creating an account is quick and easy! Click 'Sign Up' in the top right corner. " +
                   "You'll need an email address and can set up your preferences. " +
                   "Members get exclusive benefits like early access to new arrivals!";
        }

        // General greeting
        if (lowerMessage.contains("hello") || lowerMessage.contains("hi") || 
            lowerMessage.contains("hey")) {
            return "Hello! 👋 Welcome to Fitsera, your premium fashion rental service. " +
                   "I'm here to help you find the perfect outfit! " +
                   "I can assist with product recommendations, orders, pricing, sizing, and more. " +
                   "What would you like to know?";
        }

        // Help
        if (lowerMessage.contains("help")) {
            return "I'd be happy to help! I can assist you with:\n" +
                   "• Product recommendations\n" +
                   "• Order tracking and status\n" +
                   "• Pricing and rental information\n" +
                   "• Returns and exchanges\n" +
                   "• Sizing and fit guidance\n" +
                   "• Delivery information\n" +
                   "What would you like to know more about?";
        }

        // Default response
        return "I'm here to help you with your Fitsera experience! " +
               "I can assist with finding the perfect outfit, tracking orders, answering questions about rentals, " +
               "and more. What would you like to know?";
    }

    private String generateProductRecommendations(String message) {
        List<Product> products = productRepository.findAll();
        
        if (products.isEmpty()) {
            return "We're currently updating our collection. Please check back soon for our latest arrivals!";
        }

        // Filter based on message content
        List<Product> filtered = products.stream()
            .filter(p -> p.getAvailable() != null && p.getAvailable())
            .limit(3)
            .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            return "I don't have specific recommendations right now, but please browse our collection page to see all available items!";
        }

        StringBuilder response = new StringBuilder("Here are some great options for you:\n\n");
        for (Product product : filtered) {
            response.append("• ").append(product.getName() != null ? product.getName() : product.getTitle())
                    .append(" - $").append(product.getPrice())
                    .append(" per day\n");
        }
        response.append("\nWould you like to know more about any of these?");

        return response.toString();
    }

    private String generateOccasionRecommendations(String message) {
        String lowerMessage = message.toLowerCase();
        
        if (lowerMessage.contains("wedding")) {
            return "For weddings, I recommend browsing our elegant evening gowns and cocktail dresses. " +
                   "Popular choices include floor-length gowns in soft pastels or jewel tones. " +
                   "Check out our 'Weddings' occasion category for curated selections!";
        } else if (lowerMessage.contains("party") || lowerMessage.contains("cocktail")) {
            return "For parties, our cocktail dresses and statement pieces are perfect! " +
                   "Look for bold colors, sequins, or unique silhouettes. " +
                   "Visit our 'Party' collection for trendy options.";
        } else if (lowerMessage.contains("formal") || lowerMessage.contains("gala")) {
            return "For formal events, we have stunning designer gowns that will make you shine. " +
                   "Consider classic black, elegant metallics, or rich jewel tones. " +
                   "Browse our 'Formal' section for red-carpet worthy pieces.";
        } else {
            return "We have outfits for every occasion! Browse by event type on our Occasions page: " +
                   "Weddings, Parties, Formal Events, Date Nights, and more. " +
                   "What specific event are you shopping for?";
        }
    }

    private String buildSystemMessage() {
        return "You are a helpful AI assistant for Fitsera, a premium fashion rental service. " +
               "Your role is to help customers find the perfect outfits, answer questions about rentals, " +
               "track orders, and provide styling advice. Be friendly, professional, and enthusiastic about fashion. " +
               "Keep responses concise but helpful. When recommending products, highlight style, occasion, and value.";
    }

    public void clearConversation(String conversationId) {
        conversations.remove(conversationId);
    }
}

