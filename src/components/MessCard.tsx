
import { Link } from "react-router-dom";
import { Star, MapPin, IndianRupee, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mess } from "@/types";

interface MessCardProps {
  mess: Mess;
}

const MessCard: React.FC<MessCardProps> = ({ mess }) => {
  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <img src={mess.image_url || "/placeholder.svg"} alt={mess.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1 text-primary">{mess.name}</h3>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Star className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" />
          <span>{mess.rating} ({mess.review_count} reviews)</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 h-10 overflow-hidden">{mess.description}</p>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <MapPin className="w-4 h-4 mr-1 text-secondary" />
          <span>{mess.address}</span>
        </div>
        <div className="mb-3">
          {mess.cuisine?.map((c) => (
            <Badge key={c} variant="secondary" className="mr-1 mb-1">{c}</Badge>
          ))}
        </div>
         <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-semibold text-green-600 flex items-center">
            <IndianRupee className="w-5 h-5 mr-1" />{mess.monthly_price}
            <span className="text-xs text-muted-foreground ml-1">/month</span>
          </p>
          {mess.offers_delivery && (
            <Badge variant="outline" className="flex items-center text-emerald-600 border-emerald-500">
              <Truck className="w-3 h-3 mr-1" /> Delivery
            </Badge>
          )}
        </div>
        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link to={`/mess/${mess.id}`}>View Details</Link>
        </Button>
      </div>
    </div>
  );
};

export default MessCard;
