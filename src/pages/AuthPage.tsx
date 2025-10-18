import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState("sign-in");

  // Update tab when route changes
  useEffect(() => {
    const currentTab = location.pathname.split("/")[2] || "sign-in";
    setTabValue(currentTab);
  }, [location.pathname]);

  // Handle tab change manually
  const handleTabChange = (value) => {
    setTabValue(value);
    navigate(`/auth/${value}`);
  };

  return (
    <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
      <Tabs
        value={tabValue} // <-- make it controlled
        onValueChange={handleTabChange} // <-- handle when tab changes
        className="w-[400px]"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
        </TabsList>

        {/* Nested route renders here */}
        <Outlet />
      </Tabs>
    </div>
  );
};

export default AuthPage;
