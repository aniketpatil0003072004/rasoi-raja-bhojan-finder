
import MessCard from "@/components/MessCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mess } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const MessesPage = () => {
  const fetchMesses = async (): Promise<Mess[]> => {
    const { data, error } = await supabase.from("messes").select("*").order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: messes, isLoading, error } = useQuery<Mess[]>({
    queryKey: ["messes"],
    queryFn: fetchMesses,
  });

  return (
    <div className="container py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Find Your Perfect Mess</h1>
        <p className="text-lg text-muted-foreground">Discover homely and affordable meal plans near you.</p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input placeholder="Search by name or location..." className="flex-grow" />
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden shadow-lg bg-card">
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
        <div className="text-center py-10">
          <p className="text-xl text-destructive">Error fetching messes: {(error as Error).message}</p>
        </div>
      ) : messes && messes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messes.map((mess) => (
            <MessCard key={mess.id} mess={mess} />
          ))}
        </div>
      ) : (
         <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">No messes found. Why not be the first to list one?</p>
          </div>
      )}
    </div>
  );
};

export default MessesPage;
