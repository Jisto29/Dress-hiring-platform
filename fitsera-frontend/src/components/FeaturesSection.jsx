function FeaturesSection() {
  const features = [
    {
      icon: '💎',
      title: 'Look Luxe, Spend Less',
      description: 'Access luxury fashion at affordable prices',
    },
    {
      icon: '👕',
      title: 'Zero Closet Clutter',
      description: 'Return after use, no storage needed',
    },
    {
      icon: '🛍️',
      title: 'Fresh Fits for Every Event',
      description: 'Always have something new for special occasions',
    },
    {
      icon: '🌍',
      title: 'Eco-Friendly Fashion',
      description: 'Sustainable clothing rental solution',
    },
    {
      icon: '📏',
      title: 'Size Inclusive & Maternity Friendly',
      description: 'Options for every body type',
    },
    {
      icon: '🛡️',
      title: 'Hygienic. Hassle-Free. Home Delivered.',
      description: 'Clean, sanitized, delivered to your door',
    },
  ];

  return (
    <section className="bg-beige py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-black">
          Why TopCare?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition"
            >
              <div className="text-6xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-black">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;


