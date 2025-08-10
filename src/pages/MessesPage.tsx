
import MessCard from "@/components/MessCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mess } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";

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

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(id);
  }, [search]);

  const filteredMesses = useMemo(() => {
    if (!messes) return [] as Mess[];
    const normalize = (s?: string | null) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    const q = normalize(debouncedSearch);
    if (!q) return messes;
    return messes.filter((m) => {
      const name = normalize(m.name);
      const address = normalize(m.address);
      const cuisineText = Array.isArray(m.cuisine) ? normalize(m.cuisine.join(" ")) : "";
      return name.includes(q) || address.includes(q) || cuisineText.includes(q);
    });
  }, [messes, debouncedSearch]);

  useEffect(() => {
    // Debug in published build
    // eslint-disable-next-line no-console
    console.debug('[MessesPage] search:', debouncedSearch, 'messes:', messes?.length ?? 0, 'filtered:', filteredMesses.length);
  }, [debouncedSearch, messes, filteredMesses]);

  return (
    <div className="container py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Find Your Perfect Mess</h1>
        <p className="text-lg text-muted-foreground">Discover homely and affordable meal plans near you.</p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input
          type="search"
          placeholder="Search by name, cuisine, or location..."
          aria-label="Search messes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          className="flex-grow"
        />
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
      ) : messes && filteredMesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMesses.map((mess) => (
            <MessCard key={mess.id} mess={mess} />
          ))}
        </div>
      ) : (
         <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">{search ? 'No messes match your search.' : 'No messes found. Why not be the first to list one?'}</p>
          </div>
      )}
    </div>
  );
};

export default MessesPage;
