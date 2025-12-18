import { useNavigate } from 'react-router-dom';

function Hero() {
  const navigate = useNavigate();

  return (
    <section 
      className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-purple-800 via-pink-600 to-blue-700"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      <div className="relative z-10 text-center px-4">
        <h2 className="text-5xl md:text-7xl font-bold text-white uppercase mb-4">
          LUXURY LOOKS. ZERO COMMITMENT
        </h2>
        <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto">
          Hire or buy designer dresses & clothing for a fraction of the retail price
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/category/rental')}
            className="bg-beige hover:bg-opacity-90 text-black px-8 py-4 rounded-lg font-bold text-lg transition uppercase"
          >
            ONE-TIME RENTAL
          </button>
          <button 
            onClick={() => navigate('/category/membership')}
            className="bg-beige hover:bg-opacity-90 text-black px-8 py-4 rounded-lg font-bold text-lg transition uppercase"
          >
            MEMBERSHIP
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;

