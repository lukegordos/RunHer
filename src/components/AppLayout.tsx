
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  Users,
  Calendar,
  Map,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Find Buddies", href: "/buddies", icon: Users },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Messages", href: "/messages", icon: MessageCircle },
    { name: "Routes", href: "/routes", icon: Map },
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    // In a real app, this would navigate to login or perform actual logout
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl md:text-2xl font-bold text-runher">
                runHER
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive(item.href)
                      ? "bg-runher/10 text-runher"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-1.5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="flex items-center">
              <div className="hidden md:flex items-center space-x-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-runher text-white">SJ</AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-600"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMobileMenu}
                  className="text-gray-600"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  isActive(item.href)
                    ? "bg-runher/10 text-runher"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.name}
              </Link>
            ))}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-2">
                  <AvatarFallback className="bg-runher text-white">SJ</AvatarFallback>
                </Avatar>
                <span className="font-medium">Sarah Johnson</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-gray-600"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
