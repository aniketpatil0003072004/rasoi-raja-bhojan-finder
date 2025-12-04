import { Link } from "react-router-dom";
import { Star, MapPin, IndianRupee, Truck, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mess } from "@/types";

interface PricingPlan {
  name: string;
  price: number;
  description: string;
}

interface MessCardProps {
  mess: Mess;
}

const MessCard: React.FC<MessCardProps> = ({ mess }) => {
  const pricingPlans = mess.pricing_plans as unknown as PricingPlan[];
  const startingPrice = pricingPlans?.[0]?.price || "N/A";

  return (
    <div className="group glass-card rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="relative overflow-hidden h-56">
        <img
          src={mess.image_url || "/placeholder.svg"}
          alt={mess.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold">{mess.rating}</span>
          <span className="text-xs text-muted-foreground">({mess.review_count})</span>
        </div>
        {mess.offers_delivery && (
          <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm text-xs font-medium">
            <Truck className="w-3 h-3" /> Delivery
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {mess.name}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4 mr-1 text-primary shrink-0" />
            <span className="line-clamp-1">{mess.address}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
          {mess.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {mess.cuisine?.slice(0, 3).map((c) => (
            <Badge key={c} variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-0">
              {c}
            </Badge>
          ))}
          {mess.cuisine && mess.cuisine.length > 3 && (
            <Badge variant="outline" className="text-xs">+{mess.cuisine.length - 3}</Badge>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-lg font-bold text-primary flex items-center">
              <IndianRupee className="w-4 h-4" />
              {startingPrice}
              <span className="text-sm text-muted-foreground font-normal ml-1">/mo</span>
            </p>
          </div>

          <Button asChild size="sm" className="rounded-full w-10 h-10 p-0 bg-primary hover:bg-primary/90 shadow-md group-hover:translate-x-1 transition-all">
            <Link to={`/mess/${mess.id}`}>
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessCard;
