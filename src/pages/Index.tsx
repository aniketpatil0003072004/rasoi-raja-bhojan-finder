
import HeroSection from "@/components/HeroSection";
import MessCard from "@/components/MessCard";
import { mockMesses } from "@/data/mockMesses";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const featuredMesses = mockMesses.slice(0, 3); // Show 3 featured messes

  return (
    <div>
      <HeroSection />
      
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary">Featured Messes</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Handpicked selections of popular and highly-rated messes to get you started.
          </p>
          {featuredMesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredMesses.map((mess) => (
                <MessCard key={mess.id} mess={mess} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No featured messes available at the moment.</p>
          )}
          {mockMesses.length > 3 && (
            <div className="text-center mt-12">
              <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link to="/messes">
                  View All Messes
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-orange-50 dark:bg-orange-900/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-primary">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-10 max-w-4xl mx-auto">
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="text-primary text-4xl mb-3">📍</div>
              <h3 className="text-xl font-semibold mb-2">1. Discover</h3>
              <p className="text-sm text-muted-foreground">Browse messes near your location with detailed menus and pricing.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="text-primary text-4xl mb-3">✅</div>
              <h3 className="text-xl font-semibold mb-2">2. Subscribe</h3>
              <p className="text-sm text-muted-foreground">Choose a weekly or monthly plan that fits your needs and budget.</p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md">
              <div className="text-primary text-4xl mb-3">🍽️</div>
              <h3 className="text-xl font-semibold mb-2">3. Enjoy</h3>
              <p className="text-sm text-muted-foreground">Get delicious, home-style meals delivered or pick them up.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

