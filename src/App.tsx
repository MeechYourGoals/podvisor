import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProfileProvider } from "./contexts/ProfileContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MobileTabBar } from "./components/MobileTabBar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ChatDemo from "./pages/ChatDemo";
import TripDemo from "./pages/TripDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ChromeShell = () => {
  const location = useLocation();
  // Show mobile tab bar only on app routes (not auth / chat demo / trip demo)
  const hideTabBar = ["/auth", "/reset-password", "/chat-demo"].includes(location.pathname)
    || location.pathname.startsWith("/trip");
  return hideTabBar ? null : <MobileTabBar />;
};

const App = () => {
  useEffect(() => {
    if (window.Capacitor?.isNativePlatform()) {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#0f0f10' });
      }).catch(() => {});
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="app-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ProfileProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/chat-demo" element={<ChatDemo />} />
                  <Route path="/trip/:tripId" element={<TripDemo />} />
                  <Route path="/trip-demo" element={<TripDemo />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <ChromeShell />
              </ProfileProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
