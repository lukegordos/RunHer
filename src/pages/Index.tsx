
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white to-runher/10">
      <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Welcome to <span className="text-runher">runHER</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The premium platform designed for women who run. Track your progress, 
            connect with other runners, and achieve your goals.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild size="lg" className="h-12 px-8 bg-runher hover:bg-runher-dark">
            <Link to="/login">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8">
            <Link to="/register">Create account</Link>
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-sm text-muted-foreground">
          © 2023 runHER. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Index;
