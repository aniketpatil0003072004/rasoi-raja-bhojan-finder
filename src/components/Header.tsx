
import { Link } from "react-router-dom";
import { UtensilsCrossed, Search, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
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
          <Button variant="outline" size="sm">
            <UserCircle className="mr-2 h-4 w-4" />
            Login / Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

