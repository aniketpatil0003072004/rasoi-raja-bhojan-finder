
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Search, UserCircle, LogOut, LayoutDashboard, BookUser, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Profile } from "@/types";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.id) {
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
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const handleSignOut = async () => {
    await signOut();
    setProfile(null); 
    navigate('/');
  };

  const getInitials = (name?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };
  
  const displayName = profile?.full_name || user?.email || "User";
  const displayDetail = (profile?.full_name && user?.email) ? user.email : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl text-primary">Rasoi Raja</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {(!user || profile?.role === 'student') && (
            <Link
              to="/messes"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Find a Mess
            </Link>
          )}
          {(!user || profile?.role === 'mess_owner') && (
            <Link
              to="/add-mess"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              List Your Mess
            </Link>
          )}
          {/* Future links: "About Us" */}
        </nav>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          {user && <NotificationBell />}
          {authLoading || (user && profileLoading) ? (
            <Button variant="outline" size="sm" disabled>
              Loading...
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    {displayDetail && <p className="text-xs leading-none text-muted-foreground">
                      {displayDetail}
                    </p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profile?.role === 'mess_owner' && (
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                )}
                {profile?.role === 'student' && (
                  <DropdownMenuItem onClick={() => navigate('/my-subscriptions')}>
                    <BookUser className="mr-2 h-4 w-4" />
                    <span>My Subscriptions</span>
                  </DropdownMenuItem>
                )}
                {profile?.role === 'delivery_personnel' && (
                  <DropdownMenuItem onClick={() => navigate('/delivery-dashboard')}>
                    <Truck className="mr-2 h-4 w-4" />
                    <span>My Deliveries</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">
                <UserCircle className="mr-2 h-4 w-4" />
                Login / Sign Up
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
