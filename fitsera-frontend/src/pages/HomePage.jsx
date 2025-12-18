import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import PromotionalBanner from '../components/PromotionalBanner';
import OccasionSection from '../components/OccasionSection';
import ProductCarousel from '../components/ProductCarousel';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="App">
      <Header />
      <Hero />
      <PromotionalBanner />
      <OccasionSection />
      <ProductCarousel />
      
      {/* See All Brands Section */}
      <section className="py-12 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Discover Our Brands
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Explore our curated collection of premium Australian and international fashion brands
            </p>
            <button
              onClick={() => navigate('/brands')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              <span>Browse All Brands</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <Footer />
    </div>
  );
}

export default HomePage;


