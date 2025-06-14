
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mess, Menu } from "@/types";
import { Star, MapPin, IndianRupee, Phone, Clock, Utensils, Truck, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const MessDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const fetchMess = async (messId: string): Promise<Mess | null> => {
    const { data, error } = await supabase
      .from("messes")
      .select("*")
      .eq("id", messId)
      .single();
    if (error && error.code !== 'PGRST116') { // Ignore error for no rows found
      throw new Error(error.message);
    }
    return data;
  };

  const fetchMenu = async (messId: string): Promise<Menu[]> => {
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .eq("mess_id", messId)
      .order("day");
    if (error) throw new Error(error.message);
    return data || [];
  };

  const { data: mess, isLoading: isMessLoading, error: messError } = useQuery({
    queryKey: ["mess", id],
    queryFn: () => fetchMess(id!),
    enabled: !!id,
  });

  const { data: menu, isLoading: isMenuLoading, error: menuError } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => fetchMenu(id!),
    enabled: !!id,
  });
  
  const isLoading = isMessLoading || isMenuLoading;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="w-full h-96 rounded-lg" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="md:col-span-1 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const error = messError || menuError;
  if (error) {
    return <div className="container py-8 text-center text-xl text-destructive">Error: {(error as Error).message}</div>;
  }

  if (!mess) {
    return <div className="container py-8 text-center text-xl">Mess not found.</div>;
  }

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <img src={mess.image_url || '/placeholder.svg'} alt={mess.name} className="w-full h-96 object-cover rounded-lg shadow-lg mb-6" />
          <h1 className="text-4xl font-bold text-primary mb-2">{mess.name}</h1>
          <div className="flex flex-wrap items-center text-muted-foreground mb-4 gap-x-3 gap-y-1">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
              <span>{mess.rating} ({mess.review_count} reviews)</span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-1 text-secondary" />
              <span>{mess.address}</span>
            </div>
          </div>
          <p className="text-lg text-foreground mb-6">{mess.description}</p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="w-6 h-6 mr-2 text-primary" />
                Weekly Menu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {menu && menu.length > 0 ? (
                <div className="space-y-4">
                  {menu.map((dayMenu) => (
                    <div key={dayMenu.day}>
                      <h4 className="font-semibold text-md text-primary mb-1">{dayMenu.day}</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                        {dayMenu.breakfast && <li><strong>Breakfast:</strong> {dayMenu.breakfast}</li>}
                        {dayMenu.lunch && <li><strong>Lunch:</strong> {dayMenu.lunch}</li>}
                        {dayMenu.dinner && <li><strong>Dinner:</strong> {dayMenu.dinner}</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Menu not available yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-green-600 flex items-center justify-center">
                <IndianRupee className="w-7 h-7 mr-1" />{mess.monthly_price}
                <span className="text-sm text-muted-foreground ml-1">/month</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6">Subscribe Now</Button>
               <Button variant="outline" className="w-full">Contact Mess</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Mess Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-primary" />
                <span className="text-muted-foreground">Contact: {mess.contact}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                <span className="text-muted-foreground">Hours: {mess.operating_hours}</span>
              </div>
              <div className="flex items-center">
                {mess.offers_delivery ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : <XCircle className="w-4 h-4 mr-2 text-red-500" />}
                <span className="text-muted-foreground">{mess.offers_delivery ? "Delivery Available" : "Delivery Not Available"}</span>
                 {mess.offers_delivery && <Truck className="w-4 h-4 ml-auto text-secondary" />}
              </div>
              <div className="pt-2">
                <h5 className="font-medium mb-1">Cuisine:</h5>
                {mess.cuisine?.map((c) => (
                  <Badge key={c} variant="secondary" className="mr-1 mb-1">{c}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessDetailPage;
