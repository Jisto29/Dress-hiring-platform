import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';

const EnhancedChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
      setInputMessage('');
      setShowSuggestions(false);
    }
  };

  const handleQuickAction = (action) => {
    sendMessage(action);
    setShowSuggestions(false);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setIsOpen(false);
  };

  // Enhanced quick actions with categories
  const quickActionsCategories = {
    shopping: [
      { text: 'Show me wedding dresses', icon: '' },
      { text: 'Party outfit ideas', icon: '' },
      { text: 'Trending dresses', icon: '' },
      { text: 'Show me brands', icon: '' },
    ],
    account: [
      { text: 'Track my order', icon: '' },
      { text: 'What\'s in my cart?', icon: '' },
      { text: 'Show my wishlist', icon: '' },
      { text: 'Pricing information', icon: '' },
    ],
    help: [
      { text: 'Sizing help', icon: '' },
      { text: 'Return policy', icon: '' },
      { text: 'Delivery options', icon: '' },
      { text: 'General help', icon: '' },
    ],
  };

  const [activeCategory, setActiveCategory] = useState('shopping');

  return (
    <>
      {/* Floating Chat Button with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Open chat"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110">
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {messages.length === 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse font-bold">
                    AI
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </button>

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] h-[650px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slideUp">
          {/* Premium Header */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-[length:200%_100%] animate-gradient text-white p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="bg-white/30 backdrop-blur-md rounded-full p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">Fitsera AI Assistant</h3>
                <p className="text-xs text-white/90 flex items-center">
                  <span className="h-2 w-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Online • Instant replies
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={clearChat}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
                title="Clear chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-2xl opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome to Fitsera!
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your personal AI fashion assistant is ready to help you find the perfect outfit!
                </p>

                {/* Category Tabs */}
                <div className="w-full mb-4">
                  <div className="flex space-x-2 mb-3 justify-center">
                    {Object.keys(quickActionsCategories).map((category) => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          activeCategory === category
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    {quickActionsCategories[activeCategory].map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.text)}
                        className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all duration-200 text-sm text-gray-700 font-medium shadow-sm hover:shadow-md group"
                      >
                        {action.text}
                        <span className="float-right text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Or type your own question below
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mr-2">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                          : message.isError
                          ? 'bg-red-50 border-2 border-red-200 text-red-800'
                          : 'bg-white border-2 border-gray-200 text-gray-800 shadow-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Suggested Follow-up Actions */}
                {!isLoading && messages.length > 0 && showSuggestions && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleQuickAction('Show me more options')}
                      className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
                    >
                      Show more options
                    </button>
                    <button
                      onClick={() => handleQuickAction('Tell me about pricing')}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      Pricing info
                    </button>
                    <button
                      onClick={() => handleQuickAction('Help me choose')}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Help me choose
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-2">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full p-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 shadow-md">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t-2 border-gray-100 p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl p-3 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
            <p className="text-xs text-gray-500 text-center mt-2">
              Powered by AI - Always learning
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </>
  );
};

export default EnhancedChatBot;

