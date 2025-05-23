
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, AtSign, Lock, Eye, EyeOff, UserPlus, ChevronLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { register } from "@/services/auth";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register({ name, email, password });
      
      toast({
        title: "Account created!",
        description: "Please log in with your new account.",
      });
      
      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding section */}
      <div className="w-full md:w-1/2 bg-runher flex flex-col justify-center items-center p-8 md:p-12">
        <div className="animate-fade-in w-full max-w-md">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              runher
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8">
              Join our community of women who run. Sign up today.
            </p>
            
            <div className="hidden md:block mt-12">
              <div className="flex items-center space-x-3 mb-4 opacity-90">
                <div className="h-1 w-1 rounded-full bg-white"></div>
                <p className="text-white text-sm">Track your progress</p>
              </div>
              <div className="flex items-center space-x-3 mb-4 opacity-90 animate-pulse-soft">
                <div className="h-1 w-1 rounded-full bg-white"></div>
                <p className="text-white text-sm">Connect with runners</p>
              </div>
              <div className="flex items-center space-x-3 mb-4 opacity-90">
                <div className="h-1 w-1 rounded-full bg-white"></div>
                <p className="text-white text-sm">Achieve your goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
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
              Create an account
            </h2>
            <p className="text-muted-foreground mt-2">
              Join the runher community today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 bg-secondary border-none"
                  />
                </div>
              </div>

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
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
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

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 bg-secondary border-none"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-md bg-runher hover:bg-runher-dark transition-all flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              <span>Create account</span>
              {!isLoading && <ChevronRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-runher hover:text-runher-dark transition-all font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
