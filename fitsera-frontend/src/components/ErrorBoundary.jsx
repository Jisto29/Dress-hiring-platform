import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-beige">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">There was an error loading the page.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-olive-dark text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


