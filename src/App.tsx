
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
import StudentDeliveryTrackingPage from "./pages/StudentDeliveryTrackingPage";
import DeliveryDashboardPage from "./pages/DeliveryDashboardPage";
import DeliveryDetailsPage from "./pages/DeliveryDetailsPage";

const queryClient = new QueryClient();

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet /> {/* This is where the routed page component will be rendered */}
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> {/* Wrap with AuthProvider */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}> {/* Apply layout to all these routes */}
              <Route path="/" element={<Index />} />
              <Route path="/messes" element={<MessesPage />} />
              <Route path="/mess/:id" element={<MessDetailPage />} />
              <Route path="/auth" element={<AuthPage />} /> {/* Add AuthPage route */}
              
              <Route element={<ProtectedRoute allowedRoles={['mess_owner']} />}>
                <Route path="/add-mess" element={<AddMessPage />} />
                <Route path="/dashboard" element={<OwnerDashboardPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/my-subscriptions" element={<MySubscriptionsPage />} />
                <Route path="/my-deliveries" element={<StudentDeliveryTrackingPage />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['delivery_personnel']} />}>
                <Route path="/delivery-dashboard" element={<DeliveryDashboardPage />} />
                <Route path="/delivery/:deliveryId" element={<DeliveryDetailsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
