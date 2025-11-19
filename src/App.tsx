import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MessesPage from "./pages/MessesPage";
import MessDetailPage from "./pages/MessDetailPage";
import ScrollToTop from "./components/ScrollToTop";
import AuthPage from "./pages/AuthPage"; // Import AuthPage
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider
import AddMessPage from "./pages/AddMessPage";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerDashboardPage from "./pages/OwnerDashboardPage"; // Import new page
import MySubscriptionsPage from "./pages/MySubscriptionsPage";

import { SubscriptionExpirationDialog } from "./components/SubscriptionExpirationDialog";
import SignUpPage from "./pages/SignUp";
import SignInPage from "./pages/SignIn";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <SubscriptionExpirationDialog />
      <main className="flex-grow">
        <Outlet />{" "}
        {/* This is where the routed page component will be rendered */}
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        {" "}
        {/* Wrap with AuthProvider */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              {" "}
              {/* Apply layout to all these routes */}
              <Route path="/" element={<Index />} />
              <Route path="/messes" element={<MessesPage />} />
              <Route path="/mess/:id" element={<MessDetailPage />} />
              <Route element={<AuthPage />}>
                <Route path="/auth/sign-up" element={<SignUpPage />} />
                <Route index path="/auth/sign-in" element={<SignInPage />} />
              </Route>{" "}
              {/* Add AuthPage route */}
              <Route element={<ProtectedRoute allowedRoles={["mess_owner"]} />}>
                <Route path="/add-mess" element={<AddMessPage />} />
                <Route path="/dashboard" element={<OwnerDashboardPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
                <Route
                  path="/my-subscriptions"
                  element={<MySubscriptionsPage />}
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;
