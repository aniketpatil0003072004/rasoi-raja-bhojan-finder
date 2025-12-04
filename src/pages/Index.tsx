
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, PackageCheck, Truck, ShieldCheck, Utensils, Wallet } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import MessCard from "@/components/MessCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Mess } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  const fetchFeaturedMesses = async (): Promise<Mess[]> => {
    const { data, error } = await supabase
      .from("messes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);
    if (error) throw new Error(error.message);
    return data || [];
  };

  const {
    data: featuredMesses,
    isLoading,
    error,
  } = useQuery<Mess[]>({
    queryKey: ["featuredMesses"],
    queryFn: fetchFeaturedMesses,
  });

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      {/* Featured Messes Section */}
      <section className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Featured <span className="text-primary">Kitchens</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Handpicked selections of popular and highly-rated messes to get you started on your healthy food journey.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border rounded-2xl overflow-hidden shadow-sm bg-card"
                >
                  <Skeleton className="w-full h-56" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full mt-4 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-destructive text-lg font-medium">
                Could not load featured messes.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : featuredMesses && featuredMesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredMesses.map((mess) => (
                <MessCard key={mess.id} mess={mess} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No featured messes available at the moment.
            </p>
          )}

          <div className="text-center mt-16">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg rounded-xl transition-all duration-300"
            >
              <Link to="/messes">View All Messes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features / Why Choose Us */}
      <section className="py-20 bg-secondary/5 dark:bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-primary">Rasoi Raja?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We connect you with the best local kitchens, ensuring quality, affordability, and reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-background rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-border/50">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Kitchens</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every mess listed on our platform undergoes a strict verification process for hygiene and food quality standards.
              </p>
            </div>

            <div className="p-8 bg-background rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-border/50">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Budget Friendly</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find meal plans that fit your student or professional budget without compromising on taste or quantity.
              </p>
            </div>

            <div className="p-8 bg-background rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-border/50">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Home-Style Taste</h3>
              <p className="text-muted-foreground leading-relaxed">
                Miss home food? Our listed messes specialize in authentic, home-cooked meals that taste just like mom's cooking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            How It <span className="text-primary">Works</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -z-10" />

            <div className="relative group">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-card border-4 border-primary/20 rounded-full flex items-center justify-center text-4xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 z-10">
                📍
              </div>
              <h3 className="text-xl font-bold mb-3">1. Discover</h3>
              <p className="text-muted-foreground">
                Browse messes near your location with detailed menus and pricing.
              </p>
            </div>

            <div className="relative group">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-card border-4 border-primary/20 rounded-full flex items-center justify-center text-4xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 z-10">
                ✅
              </div>
              <h3 className="text-xl font-bold mb-3">2. Subscribe</h3>
              <p className="text-muted-foreground">
                Choose a weekly or monthly plan that fits your needs and budget.
              </p>
            </div>

            <div className="relative group">
              <div className="w-24 h-24 mx-auto bg-white dark:bg-card border-4 border-primary/20 rounded-full flex items-center justify-center text-4xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 z-10">
                🍽️
              </div>
              <h3 className="text-xl font-bold mb-3">3. Enjoy</h3>
              <p className="text-muted-foreground">
                Get delicious, home-style meals delivered or pick them up.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
