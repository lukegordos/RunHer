
import { useState } from "react";
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
  Save
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Sarah Johnson",
    location: "Portland, OR",
    bio: "Marathon runner and trail enthusiast. Looking for morning running partners!",
    experience: "Intermediate",
    preferredTime: "Mornings",
    averagePace: "8:30 min/mile",
    weeklyMiles: "25 miles",
    goals: "Training for Portland Marathon"
  });

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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Image and Stats */}
          <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  <User className="w-16 h-16 text-muted-foreground" />
                </div>
                {isEditing && (
                  <button 
                    className="absolute bottom-0 right-0 bg-runher text-white p-2 rounded-full shadow-md"
                    aria-label="Upload photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h1 className="text-2xl font-bold">{profileData.name}</h1>
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

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-lg mb-4">Recent Activities</h2>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center p-3 rounded-lg bg-secondary">
                    <div className="w-12 h-12 rounded-md bg-runher/10 flex items-center justify-center mr-4">
                      <Calendar className="w-6 h-6 text-runher" />
                    </div>
                    <div>
                      <h3 className="font-medium">{`Morning Run ${i}`}</h3>
                      <p className="text-sm text-muted-foreground">5.2 miles • 43:12 • 2 days ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
