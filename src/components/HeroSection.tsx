/**
 * In-app greeting hero (replaces the giant brand wordmark inside the app).
 * Marketing landing still gets a bigger hero in MarketingHero.tsx.
 */
const HeroSection = () => {
  return (
    <section className="pt-2 pb-6">
      <div className="space-y-1.5">
        <p className="text-caption font-medium uppercase tracking-wider text-muted-foreground">
          Today
        </p>
        <h1 className="text-title-1 text-balance">
          What do you want to learn from today?
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
