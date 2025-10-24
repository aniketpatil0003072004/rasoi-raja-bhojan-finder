import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Menu, Mess, Profile, Subscription } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  IndianRupee,
  MapPin,
  Phone,
  Star,
  Truck,
  Utensils,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AddMenuForm from "@/components/AddMenuForm";
import SubscriptionForm from "@/components/SubscriptionForm";

const MessDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const [isMenuDialogOpen, setIsMenuDialogOpen] = React.useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] =
    React.useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false);

  const fetchMess = async (messId: string): Promise<Mess | null> => {
    const { data, error } = await supabase
      .from("messes")
      .select("*")
      .eq("id", messId)
      .single();
    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }
    return data;
  };

  const fetchMenu = async (messId: string): Promise<Menu | null> => {
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .eq("mess_id", messId)
      .single();
    if (error && error.code !== "PGRST116") {
      return null;
    }
    return data;
  };

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  };

  const fetchUserSubscription = async (
    messId: string,
    userId: string
  ): Promise<Subscription | null> => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("mess_id", messId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Error fetching user subscription", error);
      return null;
    }
    return data;
  };

  const {
    data: mess,
    isLoading: isMessLoading,
    error: messError,
  } = useQuery({
    queryKey: ["mess", id],
    queryFn: () => fetchMess(id!),
    enabled: !!id,
  });

  const {
    data: menu,
    isLoading: isMenuLoading,
    error: menuError,
  } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => fetchMenu(id!),
    enabled: !!id,
  });

  const { data: profile } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  const { data: userSubscription } = useQuery({
    queryKey: ["userSubscription", id, user?.id],
    queryFn: () => fetchUserSubscription(id!, user!.id),
    enabled: !!id && !!user,
  });

  const parseMenuItems = (items: string | null): string[] => {
    if (!items) return [];
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed.filter((item) => item.trim()) : [];
    } catch {
      return items ? [items] : [];
    }
  };

  const breakfastItems = menu ? parseMenuItems(menu.breakfast) : [];
  const lunchItems = menu ? parseMenuItems(menu.lunch) : [];
  const dinnerItems = menu ? parseMenuItems(menu.dinner) : [];

  const isLoading = isMessLoading || isMenuLoading;
  const isOwner = user && mess && user.id === mess.owner_id;
  const isStudent = profile?.role === "student";
  console.log(isStudent);

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
    return (
      <div className="container py-8 text-center text-xl text-destructive">
        Error: {(error as Error).message}
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="container py-8 text-center text-xl">Mess not found.</div>
    );
  }

  const hasMenuItems =
    breakfastItems.length > 0 ||
    lunchItems.length > 0 ||
    dinnerItems.length > 0;

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <img
            src={mess.image_url || "/placeholder.svg"}
            alt={mess.name}
            className="w-full h-96 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-2">{mess.name}</h1>
          <div className="flex flex-wrap items-center text-muted-foreground mb-4 gap-x-3 gap-y-1">
            <div className="flex items-center">
              <Star
                className="w-5 h-5 text-yellow-400 mr-1"
                fill="currentColor"
              />
              <span>
                {mess.rating?.toFixed(1) || "N/A"} ({mess.review_count || 0}{" "}
                reviews)
              </span>
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Utensils className="w-6 h-6 mr-2 text-primary" />
                  General Menu
                </CardTitle>
                {isOwner && (
                  <Dialog
                    open={isMenuDialogOpen}
                    onOpenChange={setIsMenuDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">Edit Menu</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[650px]">
                      <DialogHeader>
                        <DialogTitle>Manage General Menu</DialogTitle>
                        <DialogDescription>
                          Update the breakfast, lunch, and dinner options. Click
                          save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="max-h-[70vh] overflow-y-auto p-1 pr-2">
                        {id && (
                          <AddMenuForm
                            messId={id}
                            onSuccess={() => setIsMenuDialogOpen(false)}
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasMenuItems ? (
                <div className="space-y-4">
                  {breakfastItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-md text-primary mb-2">
                        Breakfast
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                        {breakfastItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lunchItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-md text-primary mb-2">
                        Lunch
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                        {lunchItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dinnerItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-md text-primary mb-2">
                        Dinner
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                        {dinnerItems.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Menu not available yet.{" "}
                  {isOwner && "Click 'Edit Menu' to add it."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscription Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {mess.price_1_month && (
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="font-medium">1 Month</span>
                    <span className="text-green-600 font-semibold flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {mess.price_1_month}
                    </span>
                  </div>
                )}
                {mess.price_2_months && (
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="font-medium">2 Months</span>
                    <span className="text-green-600 font-semibold flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {mess.price_2_months}
                    </span>
                  </div>
                )}
                {mess.price_3_months && (
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="font-medium">3 Months</span>
                    <span className="text-green-600 font-semibold flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {mess.price_3_months}
                    </span>
                  </div>
                )}
                {mess.price_6_months && (
                  <div className="flex justify-between items-center p-2 rounded border">
                    <span className="font-medium">6 Months</span>
                    <span className="text-green-600 font-semibold flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {mess.price_6_months}
                    </span>
                  </div>
                )}
              </div>
              <Separator className="my-3" />
              {!user && (
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                  <Link to="/auth/sign-in">Login to Subscribe</Link>
                </Button>
              )}
              {user && isOwner && (
                <Button className="w-full text-lg py-6" disabled>
                  You are the owner
                </Button>
              )}
              {user && !isOwner && !isStudent && (
                <Button className="w-full text-lg py-6" disabled>
                  Only students can subscribe
                </Button>
              )}
              {user && isStudent && !userSubscription && (
                <Dialog
                  open={isSubscriptionDialogOpen}
                  onOpenChange={setIsSubscriptionDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6">
                      Subscribe Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Subscribe to {mess.name}</DialogTitle>
                      <DialogDescription>
                        Upload your payment proof to request a subscription. The
                        owner will verify it.
                      </DialogDescription>
                    </DialogHeader>
                    {id && (
                      <SubscriptionForm
                        messId={id}
                        onSuccess={() => setIsSubscriptionDialogOpen(false)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              )}
              {user && isStudent && userSubscription && (
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-lg py-6"
                  disabled
                >
                  <CheckCircle className="mr-2" />
                  Subscribed
                </Button>
              )}
              <Dialog
                open={isContactDialogOpen}
                onOpenChange={setIsContactDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Contact Mess
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Contact {mess.name}</DialogTitle>
                    <DialogDescription>
                      You can reach the mess owner using the details below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <a
                        href={`tel:${mess.contact}`}
                        className="text-primary hover:underline"
                      >
                        {mess.contact}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{mess.address}</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mess Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-primary" />
                <span className="text-muted-foreground">
                  Contact: {mess.contact}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                <span className="text-muted-foreground">
                  Hours: {mess.operating_hours}
                </span>
              </div>
              <div className="flex items-center">
                {mess.offers_delivery ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                )}
                <span className="text-muted-foreground">
                  {mess.offers_delivery
                    ? "Delivery Available"
                    : "Delivery Not Available"}
                </span>
                {mess.offers_delivery && (
                  <Truck className="w-4 h-4 ml-auto text-secondary" />
                )}
              </div>
              <div className="pt-2">
                <h5 className="font-medium mb-1">Cuisine:</h5>
                {mess.cuisine?.map((c) => (
                  <Badge key={c} variant="secondary" className="mr-1 mb-1">
                    {c}
                  </Badge>
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
