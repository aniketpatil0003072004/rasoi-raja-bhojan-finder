
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat, Search } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl opacity-70" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-3xl opacity-70" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2 animate-fade-in">
              <ChefHat className="w-4 h-4 mr-2" />
              <span>#1 Mess Finder in Your City</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              Discover the Best <br />
              <span className="text-gradient">Home-Style Food</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Stop compromising on food quality. Find affordable, hygienic, and delicious mess services near you. Your daily meal problem, solved.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <Link to="/messes">
                  Find Food Now
                  <Search className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-accent/50 transition-all duration-300"
              >
                <Link to="/add-mess">List Your Mess</Link>
              </Button>
            </div>

            <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Verified Kitchens</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Hygiene Checked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Best Prices</span>
              </div>
            </div>
          </div>

          {/* Image Content */}
          <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 dark:border-black/50 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Delicious Indian Thali"
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
              />

              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 glass px-4 py-3 rounded-xl flex items-center gap-3 animate-bounce-slow">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Daily Meals</p>
                  <p className="text-sm font-bold text-foreground">Starting @ ₹2000/mo</p>
                </div>
              </div>
            </div>

            {/* Decorative Elements behind image */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl -z-10" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroSection;
