
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-red-900/30">
      <div className="container mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to <span className="text-primary">Rasoi Raja</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Your one-stop platform to discover affordable, home-style mess services in your city. Say goodbye to food hunting, hello to delicious convenience!
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-lg hover:shadow-primary/30 transition-shadow">
            <Link to="/messes">
              Find a Mess Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6">
            List Your Mess
          </Button>
        </div>
         <div className="mt-16">
            <img 
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=1200&q=80" 
              alt="Delicious meals" 
              className="rounded-xl shadow-2xl mx-auto max-w-3xl w-full"
            />
          </div>
      </div>
    </div>
  );
};

export default HeroSection;

