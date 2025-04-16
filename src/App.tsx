
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import FindBuddies from "./pages/FindBuddies";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import RunningRoutes from "./pages/Routes";
import ReportHazard from "./pages/ReportHazard";
import RunningDashboard from "./pages/RunningDashboard";
import LogRun from "./pages/LogRun";
import FindRunners from "./pages/FindRunners";
import EditProfile from "./pages/EditProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/buddies" element={<FindBuddies />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/routes" element={<RunningRoutes />} />
          <Route path="/hazards" element={<ReportHazard />} />
          <Route path="/running-dashboard" element={<RunningDashboard />} />
          <Route path="/log-run" element={<LogRun />} />
          <Route path="/find-runners" element={<FindRunners />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
