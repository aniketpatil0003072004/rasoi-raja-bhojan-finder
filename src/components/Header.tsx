
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed, Search, UserCircle, LogOut } from "lucide-react";
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

interface Profile {
  full_name?: string | null; // Can be null
  avatar_url?: string | null; // Can be null
  phone?: string | null; // Added phone
}

const Header = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.id) { // Ensure user and user.id exist
        setProfileLoading(true);
        try {
          // Temporary workaround for TypeScript error when Supabase types are not yet updated
          // The 'profiles' table might not be in the generated types immediately after migration.
          const { data, error } = await supabase
            .from('profiles' as any) // Cast 'profiles' to any to bypass type checking for the table name
            .select('full_name, avatar_url, phone')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
            // Set a default profile using user's phone if fetching fails
            setProfile({ phone: user.phone || null });
          } else {
            setProfile(data as Profile); // Cast data to Profile
          }
        } catch (e) {
          console.error("Exception fetching profile:", e);
          setProfile({ phone: user.phone || null });
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
    setProfile(null); // Clear profile on sign out
    navigate('/');
  };

  const getInitials = (name?: string | null, phone?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    if (phone) {
      // Use last 2 digits of phone as fallback, or 'P' for Phone
      return phone.slice(-2) || "P"; 
    }
    return "U"; // User
  };
  
  const displayName = profile?.full_name || profile?.phone || user?.phone || "User";
  const displayDetail = profile?.full_name && (profile?.phone || user?.phone) 
    ? (profile?.phone || user?.phone) 
    : profile?.full_name ? "" : "";


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl text-primary">Rasoi Raja</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          <Link
            to="/messes"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Find a Mess
          </Link>
          {/* Future links: "List Your Mess", "About Us" */}
        </nav>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          {authLoading || (user && profileLoading) ? ( // Show loading if auth is loading OR if user exists and profile is loading
            <Button variant="outline" size="sm" disabled>
              Loading...
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback>{getInitials(profile?.full_name, profile?.phone || user.phone)}</AvatarFallback>
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
                {/* <DropdownMenuItem>Profile</DropdownMenuItem> */}
                {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
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
