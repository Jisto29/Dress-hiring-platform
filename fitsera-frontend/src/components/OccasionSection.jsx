import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function OccasionSection() {
  const [selectedOccasion, setSelectedOccasion] = useState('EVERYDAY');
  const navigate = useNavigate();
  const occasions = ['EVERYDAY', 'FORMAL', 'PARTY', 'WEDDING', 'MATERNITY', 'SPECIAL'];

  const handleOccasionClick = (occasion) => {
    setSelectedOccasion(occasion);
    navigate(`/category/rental/${occasion.toLowerCase()}`);
  };

  return (
    <section className="bg-beige py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 uppercase text-black">
          DRESS HIRE FOR ANY OCCASION
        </h2>
        <div className="flex flex-wrap justify-center gap-4 items-center">
          {occasions.map((occasion) => (
            <button
              key={occasion}
              onClick={() => handleOccasionClick(occasion)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedOccasion === occasion
                  ? 'bg-white text-black shadow-md'
                  : 'bg-beige text-black hover:bg-white'
              }`}
            >
              {occasion}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OccasionSection;

