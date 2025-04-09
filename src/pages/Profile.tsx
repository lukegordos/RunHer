
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Award, 
  Camera,
  Save,
  X,
  Upload,
  Activity
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { stravaService } from "@/services/stravaService";
import { useLocation } from "react-router-dom";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const [stravaProfile, setStravaProfile] = useState<any>(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  
  useEffect(() => {
    // Check for Strava auth callback
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      handleStravaCallback(code);
    }

    // Check for existing Strava connection
    const storedTokens = localStorage.getItem('stravaTokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      stravaService.getAthleteProfile(tokens.accessToken)
        .then(profile => {
          setStravaProfile(profile);
          setStravaConnected(true);
        })
        .catch(() => {
          localStorage.removeItem('stravaTokens');
        });
    }
  }, [location]);

  const handleStravaCallback = async (code: string) => {
    try {
      const tokens = await stravaService.exchangeToken(code);
      localStorage.setItem('stravaTokens', JSON.stringify(tokens));
      const profile = await stravaService.getAthleteProfile(tokens.accessToken);
      setStravaProfile(profile);
      setStravaConnected(true);
      toast({
        title: "Success!",
        description: "Your Strava account has been connected.",
      });
    } catch (error) {
      console.error('Error connecting Strava:', error);
      toast({
        title: "Error",
        description: "Failed to connect your Strava account.",
        variant: "destructive",
      });
    }
  };

  const connectStrava = () => {
    window.location.href = stravaService.getAuthUrl();
  };

  const disconnectStrava = () => {
    localStorage.removeItem('stravaTokens');
    setStravaProfile(null);
    setStravaConnected(false);
    toast({
      title: "Disconnected",
      description: "Your Strava account has been disconnected.",
    });
  };

  const [profileData, setProfileData] = useState({
    name: "Sarah Johnson",
    location: "Portland, OR",
    bio: "Marathon runner and trail enthusiast. Looking for morning running partners!",
    experience: "Intermediate",
    preferredTime: "Mornings",
    averagePace: "8:30 min/mile",
    weeklyMiles: "25 miles",
    goals: "Training for Portland Marathon",
    strava: "https://www.strava.com/athletes/159964757"
  });
  
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile changes have been saved.",
    });
  };
  
  const handlePhotoClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfileImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Image and Stats */}
          <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div 
                  className={`w-full h-full rounded-full overflow-hidden ${isEditing ? 'cursor-pointer' : ''} ${!profileImage ? 'bg-secondary flex items-center justify-center' : ''}`}
                  onClick={handlePhotoClick}
                >
                  {profileImage ? (
                    <Avatar className="w-full h-full">
                      <AvatarImage src={profileImage} alt={profileData.name} className="w-full h-full object-cover" />
                      <AvatarFallback className="w-full h-full bg-secondary text-muted-foreground text-2xl">
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
                {isEditing && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                    {profileImage ? (
                      <button 
                        className="absolute bottom-0 right-0 bg-destructive text-white p-2 rounded-full shadow-md"
                        aria-label="Remove photo"
                        onClick={handleRemovePhoto}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        className="absolute bottom-0 right-0 bg-runher text-white p-2 rounded-full shadow-md"
                        aria-label="Upload photo"
                        onClick={handlePhotoClick}
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
              {isEditing ? (
                <Input 
                  name="name"
                  value={profileData.name} 
                  onChange={handleChange}
                  className="text-center text-xl font-bold mb-2"
                />
              ) : (
                <h1 className="text-2xl font-bold">{profileData.name}</h1>
              )}
              <div className="flex items-center justify-center mt-2 text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{profileData.location}</span>
              </div>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  variant="outline" 
                  className="mt-4"
                >
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  onClick={handleSave} 
                  className="mt-4 bg-runher hover:bg-runher-dark flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-lg">Runner Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-muted-foreground">
                    <Award className="w-4 h-4 mr-2" />
                    <span>Experience</span>
                  </div>
                  {isEditing ? (
                    <Input 
                      name="experience"
                      value={profileData.experience} 
                      onChange={handleChange}
                      className="w-36 h-8 text-sm"
                    />
                  ) : (
                    <span className="font-medium">{profileData.experience}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Avg. Pace</span>
                  </div>
                  {isEditing ? (
                    <Input 
                      name="averagePace"
                      value={profileData.averagePace} 
                      onChange={handleChange}
                      className="w-36 h-8 text-sm"
                    />
                  ) : (
                    <span className="font-medium">{profileData.averagePace}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Weekly Miles</span>
                  </div>
                  {isEditing ? (
                    <Input 
                      name="weeklyMiles"
                      value={profileData.weeklyMiles} 
                      onChange={handleChange}
                      className="w-36 h-8 text-sm"
                    />
                  ) : (
                    <span className="font-medium">{profileData.weeklyMiles}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Preferred Time</span>
                  </div>
                  {isEditing ? (
                    <Input 
                      name="preferredTime"
                      value={profileData.preferredTime} 
                      onChange={handleChange}
                      className="w-36 h-8 text-sm"
                    />
                  ) : (
                    <span className="font-medium">{profileData.preferredTime}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="w-full md:w-2/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-lg mb-3">About Me</h2>
              {isEditing ? (
                <Textarea 
                  name="bio"
                  value={profileData.bio} 
                  onChange={handleChange}
                  className="min-h-28"
                />
              ) : (
                <p className="text-muted-foreground">{profileData.bio}</p>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-lg mb-3">Running Goals</h2>
              {isEditing ? (
                <Textarea 
                  name="goals"
                  value={profileData.goals} 
                  onChange={handleChange}
                  className="min-h-28"
                />
              ) : (
                <p className="text-muted-foreground">{profileData.goals}</p>
              )}
            </div>

            {/* Strava Integration */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#FC4C02]" />
                  <h2 className="font-semibold text-lg">Strava Profile</h2>
                </div>
                {stravaConnected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectStrava}
                  >
                    Disconnect Strava
                  </Button>
                ) : (
                  <Button
                    className="bg-[#FC4C02] hover:bg-[#FC4C02]/90 text-white"
                    size="sm"
                    onClick={connectStrava}
                  >
                    Connect with Strava
                  </Button>
                )}
              </div>

              {stravaProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {stravaProfile.profile_medium && (
                      <img
                        src={stravaProfile.profile_medium}
                        alt="Strava profile"
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{stravaProfile.firstname} {stravaProfile.lastname}</p>
                      <p className="text-sm text-muted-foreground">{stravaProfile.city}, {stravaProfile.state}</p>
                    </div>
                  </div>
                  {stravaProfile.stats && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-md bg-secondary">
                        <p className="text-sm text-muted-foreground">Recent Runs</p>
                        <p className="text-lg font-medium">{stravaProfile.stats.recent_run_totals.count}</p>
                      </div>
                      <div className="p-3 rounded-md bg-secondary">
                        <p className="text-sm text-muted-foreground">Recent Distance</p>
                        <p className="text-lg font-medium">
                          {(stravaProfile.stats.recent_run_totals.distance / 1000).toFixed(1)}km
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : stravaConnected ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading Strava profile...
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Connect your Strava account to see your running stats and activities.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
