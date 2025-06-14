
import MessCard from "@/components/MessCard";
import { mockMesses } from "@/data/mockMesses";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

const MessesPage = () => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockMesses.map((mess) => (
          <MessCard key={mess.id} mess={mess} />
        ))}
      </div>
      {mockMesses.length === 0 && (
         <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">No messes found matching your criteria. Try adjusting your search or filters.</p>
          </div>
      )}
    </div>
  );
};

export default MessesPage;

