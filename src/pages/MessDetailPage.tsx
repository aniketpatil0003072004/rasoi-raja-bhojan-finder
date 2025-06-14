
import { useParams } from "react-router-dom";
import { mockMesses, Mess } from "@/data/mockMesses";
import { Star, MapPin, IndianRupee, Phone, Clock, Utensils, Truck, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const MessDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const mess = mockMesses.find((m) => m.id === id);

  if (!mess) {
    return <div className="container py-8 text-center text-xl">Mess not found.</div>;
  }

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <img src={mess.imageUrl} alt={mess.name} className="w-full h-96 object-cover rounded-lg shadow-lg mb-6" />
          <h1 className="text-4xl font-bold text-primary mb-2">{mess.name}</h1>
          <div className="flex items-center text-muted-foreground mb-4">
            <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
            <span>{mess.rating} ({mess.reviewCount} reviews)</span>
            <Separator orientation="vertical" className="h-5 mx-3" />
            <MapPin className="w-5 h-5 mr-1 text-secondary" />
            <span>{mess.address}</span>
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
              <div className="space-y-4">
                {mess.weeklyMenu.slice(0, 3).map((dayMenu) => ( // Show first 3 days for brevity
                  <div key={dayMenu.day}>
                    <h4 className="font-semibold text-md text-primary mb-1">{dayMenu.day}</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                      <li><strong>Breakfast:</strong> {dayMenu.meals.breakfast}</li>
                      <li><strong>Lunch:</strong> {dayMenu.meals.lunch}</li>
                      <li><strong>Dinner:</strong> {dayMenu.meals.dinner}</li>
                    </ul>
                  </div>
                ))}
                {mess.weeklyMenu.length > 3 && <p className="text-sm text-primary hover:underline cursor-pointer">View full menu...</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-green-600 flex items-center justify-center">
                <IndianRupee className="w-7 h-7 mr-1" />{mess.monthlyPrice}
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
                <span className="text-muted-foreground">Hours: {mess.operatingHours}</span>
              </div>
              <div className="flex items-center">
                {mess.offersDelivery ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : <XCircle className="w-4 h-4 mr-2 text-red-500" />}
                <span className="text-muted-foreground">{mess.offersDelivery ? "Delivery Available" : "Delivery Not Available"}</span>
                 {mess.offersDelivery && <Truck className="w-4 h-4 ml-auto text-secondary" />}
              </div>
              <div className="pt-2">
                <h5 className="font-medium mb-1">Cuisine:</h5>
                {mess.cuisine.map((c) => (
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

