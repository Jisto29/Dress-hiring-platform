function PromotionalBanner() {
  return (
    <section className="bg-orange-600 text-white py-4">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="font-bold uppercase">SHOP NOW</div>
        <div className="font-bold text-xl md:text-2xl uppercase text-center my-2">
          GET UP TO 50% DISCOUNT ON SELECTED CLOTHES
        </div>
        <div className="text-sm uppercase">T&C APPLY</div>
      </div>
    </section>
  );
}

export default PromotionalBanner;


