
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, AtSign, Lock, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading: isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await signIn(email, password);
      navigate("/profile");
    } catch (error) {
      // Error is already handled in the signIn function
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding section */}
      <div className="w-full md:w-1/2 bg-runher flex flex-col justify-center items-center p-8 md:p-12">
        <div className="animate-fade-in w-full max-w-md">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              runHER
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8">
              Running empowers women. Sign in to join the community.
            </p>
            
            <div className="hidden md:block mt-12">
              <div className="flex items-center space-x-3 mb-4 opacity-90">
                <div className="h-1 w-1 rounded-full bg-white"></div>
                <p className="text-white text-sm">Train together</p>
              </div>
              <div className="flex items-center space-x-3 mb-4 opacity-90 animate-pulse-soft">
                <div className="h-1 w-1 rounded-full bg-white"></div>
                <p className="text-white text-sm">Run smarter</p>
              </div>
              <div className="flex items-center space-x-3 mb-4 opacity-90">
                <div className="h-1 w-1 rounded-full bg-white"></div>
                <p className="text-white text-sm">Build your community</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* Back to home link */}
          <div className="flex items-center">
            <Button asChild variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-runher">
              <Link to="/">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to home
              </Link>
            </Button>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="text-muted-foreground mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-secondary border-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-runher hover:text-runher-dark transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-secondary border-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-md bg-runher hover:bg-runher-dark transition-all flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              <span>Sign in</span>
              {!isLoading && <ChevronRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-runher hover:text-runher-dark transition-all font-medium"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
