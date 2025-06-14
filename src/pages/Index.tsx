
import HeroSection from "@/components/HeroSection";
import MessCard from "@/components/MessCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mess, Profile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Home, PackageCheck, Truck } from "lucide-react";

const Index = () => {
  const fetchFeaturedMesses = async (): Promise<Mess[]> => {
    const { data, error } = await supabase.from("messes").select("*").order('created_at', { ascending: false }).limit(3);
    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: featuredMesses, isLoading, error } = useQuery<Mess[]>({
    queryKey: ["featuredMesses"],
    queryFn: fetchFeaturedMesses,
  });

  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        setProfileLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
            setProfile(null);
          } else {
            setProfile(data);
          }
        } catch (e) {
          console.error("Exception fetching profile:", e);
          setProfile(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);


  return (
    <div>
      <HeroSection profile={profile} />

      {(profileLoading || !profile || profile.role !== 'delivery_personnel') && (
        <>
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4 text-primary">Featured Messes</h2>
              <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
                Handpicked selections of popular and highly-rated messes to get you started.
              </p>
              {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden shadow-lg">
                      <Skeleton className="w-full h-48" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full mt-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <p className="text-center text-destructive">Could not load featured messes.</p>
              ) : featuredMesses && featuredMesses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredMesses.map((mess) => (
                    <MessCard key={mess.id} mess={mess} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No featured messes available at the moment.</p>
              )}
              
              <div className="text-center mt-12">
                <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  <Link to="/messes">
                    View All Messes
                  </Link>
                </Button>
              </div>
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
        </>
      )}

      {profile?.role === 'delivery_personnel' && (
        <section className="py-16 bg-blue-50 dark:bg-blue-900/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-primary">How Delivery Works</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-10 max-w-4xl mx-auto">
              <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center">
                <Truck className="text-primary h-10 w-10 mb-3" />
                <h3 className="text-xl font-semibold mb-2">1. View Your Tasks</h3>
                <p className="text-sm text-muted-foreground">Check your dashboard for assigned deliveries, including pickup and drop-off locations.</p>
              </div>
              <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center">
                <PackageCheck className="text-primary h-10 w-10 mb-3" />
                <h3 className="text-xl font-semibold mb-2">2. Pickup &amp; Verify</h3>
                <p className="text-sm text-muted-foreground">Go to the mess, pick up the food, and upload photos as proof of pickup.</p>
              </div>
              <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center">
                <Home className="text-primary h-10 w-10 mb-3" />
                <h3 className="text-xl font-semibold mb-2">3. Deliver &amp; Complete</h3>
                <p className="text-sm text-muted-foreground">Deliver the meal to the student's address and upload photos to complete the task.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;

