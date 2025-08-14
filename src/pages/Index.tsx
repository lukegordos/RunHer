
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  UserPlus, 
  Shield, 
  MapPin, 
  Users, 
  Route, 
  Calendar, 
  AlertTriangle,
  MessageCircle
} from "lucide-react";

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType, 
  title: string, 
  description: string 
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-runher transition-colors">
    <div className="h-12 w-12 rounded-full bg-runher/10 text-runher flex items-center justify-center mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const Testimonial = ({ 
  quote, 
  author, 
  location 
}: { 
  quote: string, 
  author: string, 
  location: string 
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="space-y-4">
      <p className="italic text-lg">"{quote}"</p>
      <div>
        <p className="font-medium">{author}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-white to-runher/10 pt-12 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-center lg:text-left space-y-6 animate-fade-in">
              <div className="inline-block bg-runher/10 text-runher px-4 py-2 rounded-full text-sm font-medium mb-2">
                Run Strong. Run Safe.
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight">
                Safety in <span className="text-runher">Community</span> for Women Runners
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                runher creates a safer running experience through community, real-time hazard alerts, and routes designed with women's safety in mind.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button asChild size="lg" className="h-12 px-8 bg-runher hover:bg-runher-dark">
                  <Link to="/login">
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8">
                  <Link to="/register">
                    Create account
                    <UserPlus className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {/* Demo Mode Button */}
              <div className="pt-4">
                <Button asChild variant="ghost" size="lg" className="h-12 px-8 text-runher hover:bg-runher/10">
                  <Link to="/login">
                    🎭 Try Demo Mode
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-runher" />
                  <span>Safety focused</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-runher" />
                  <span>10,000+ women in the community</span>
                </div>
                <div className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-runher" />
                  <span>Verified safe routes</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative max-w-md lg:max-w-none animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/images/runherLogo.png"
                  alt="runher Logo"
                  className="w-full h-full object-contain bg-white"
                />
              </div>
              <div className="absolute -bottom-5 -left-5 glass-morphism p-4 rounded-lg max-w-[200px] hidden md:block">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-8 w-8 text-runher" />
                  <div className="text-xs">
                    <div className="font-medium">Safety Score</div>
                    <div className="text-muted-foreground">Portland, OR</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-runher">4.8/5</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Running with confidence</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform is designed to address the unique challenges women face while running.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={AlertTriangle}
              title="Real-time Hazard Alerts"
              description="Report and receive alerts about suspicious activity, construction, or other hazards along your running route."
            />
            <FeatureCard 
              icon={MapPin}
              title="Safety-Verified Routes"
              description="Discover running routes that prioritize well-lit areas, populated spaces, and avoid known trouble spots."
            />
            <FeatureCard 
              icon={Users}
              title="Running Buddies"
              description="Connect with other women in your area to schedule group runs. Run together, run safer."
            />
            <FeatureCard 
              icon={Calendar}
              title="Schedule Runs"
              description="Plan your runs in advance and share your schedule with trusted contacts for accountability."
            />
            <FeatureCard 
              icon={Route}
              title="AI Route Generation"
              description="Generate custom routes based on your preferred distance, starting point, and safety preferences."
            />
            <FeatureCard 
              icon={MessageCircle}
              title="Community Support"
              description="Chat with other runners in your area, share tips, and build a supportive network."
            />
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Hear from our community</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Women across the country are running with more confidence thanks to runHER.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Testimonial 
              quote="Since joining runHER, I've been running more frequently. The hazard alerts have helped me avoid construction zones and the buddy system makes evening runs possible again."
              author="Michelle K."
              location="Portland, OR"
            />
            <Testimonial 
              quote="The AI route generator is a game-changer! I love discovering new paths that are both scenic and safe. The safety ratings give me peace of mind."
              author="Jessica T."
              location="Seattle, WA"
            />
            <Testimonial 
              quote="I've met an amazing group of women through runHER. We meet twice a week for runs, and I feel so much safer and more motivated."
              author="Samantha H."
              location="Chicago, IL"
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-runher text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start running with confidence today</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            Join thousands of women who are transforming their running experience with safety, community, and support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-12 px-8 bg-white text-runher hover:bg-gray-100">
              <Link to="/register">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12 px-8 bg-white text-runher hover:bg-gray-100">
              <Link to="/routes">
                Explore safe routes
                <Route className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-runher">runHER</h3>
              <p className="text-sm text-muted-foreground mt-1">Running safely, together.</p>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 runHER. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
