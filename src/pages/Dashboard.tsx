import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Welcome to RunHer</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Find Running Buddies</h2>
            <p className="text-muted-foreground mb-4">Connect with other runners in your area</p>
            <button 
              onClick={() => navigate('/buddies')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Find Buddies
            </button>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Running Routes</h2>
            <p className="text-muted-foreground mb-4">Discover and share safe running routes</p>
            <button 
              onClick={() => navigate('/routes')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              View Routes
            </button>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Safety Features</h2>
            <p className="text-muted-foreground mb-4">Report hazards and stay informed</p>
            <button 
              onClick={() => navigate('/hazards')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Safety Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
