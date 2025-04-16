import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, updateProfile, type RunnerProfile } from "@/services/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";



const EditProfile = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<RunnerProfile | null>(null);
  const [defaultProfile] = useState<RunnerProfile>({
    experienceLevel: "beginner",
    averagePace: 0,
    weeklyMileage: 0,
    personalBests: {},
    preferredRunningTime: "morning",
    location: {
      type: "Point",
      coordinates: [0, 0]
    }
  });

  // Fetch current profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(defaultProfile);
        toast({
          title: "Error",
          description: "Failed to load profile. Using default settings.",
          variant: "destructive"
        });
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token, defaultProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Clean and validate data before sending
      const dataToSend = {
        experienceLevel: profile.experienceLevel,
        averagePace: parseFloat(profile.averagePace?.toString() || '0'),
        weeklyMileage: parseFloat(profile.weeklyMileage?.toString() || '0'),
        personalBests: {
          mile: profile.personalBests?.mile ? parseFloat(profile.personalBests.mile.toString()) : null,
          fiveK: profile.personalBests?.fiveK ? parseFloat(profile.personalBests.fiveK.toString()) : null,
          tenK: profile.personalBests?.tenK ? parseFloat(profile.personalBests.tenK.toString()) : null,
          halfMarathon: profile.personalBests?.halfMarathon ? parseFloat(profile.personalBests.halfMarathon.toString()) : null,
          marathon: profile.personalBests?.marathon ? parseFloat(profile.personalBests.marathon.toString()) : null,
        },
        preferredRunningTime: profile.preferredRunningTime,
        location: profile.location || { type: 'Point', coordinates: [0, 0] }
      };

      const updatedProfile = await updateProfile(dataToSend);
      setProfile(updatedProfile);
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const parseTime = (timeString: string): number => {
    const [minutes, seconds] = timeString.split(":").map(Number);
    return minutes * 60 + (seconds || 0);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Experience Level</label>
            <Select
              value={profile.experienceLevel}
              onValueChange={(value) => setProfile({ ...profile, experienceLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Average Pace (min/mile)</label>
            <Input
              type="number"
              step="0.1"
              value={profile.averagePace || ""}
              onChange={(e) => setProfile({ ...profile, averagePace: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Weekly Mileage</label>
            <Input
              type="number"
              value={profile.weeklyMileage || ""}
              onChange={(e) => setProfile({ ...profile, weeklyMileage: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Personal Bests</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Mile (mm:ss)</label>
              <Input
                value={formatTime(profile.personalBests?.mile)}
                onChange={(e) => setProfile({
                  ...profile,
                  personalBests: {
                    ...profile.personalBests,
                    mile: parseTime(e.target.value)
                  }
                })}
                placeholder="4:30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">5K (mm:ss)</label>
              <Input
                value={formatTime(profile.personalBests?.fiveK)}
                onChange={(e) => setProfile({
                  ...profile,
                  personalBests: {
                    ...profile.personalBests,
                    fiveK: parseTime(e.target.value)
                  }
                })}
                placeholder="22:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">10K (mm:ss)</label>
              <Input
                value={formatTime(profile.personalBests?.tenK)}
                onChange={(e) => setProfile({
                  ...profile,
                  personalBests: {
                    ...profile.personalBests,
                    tenK: parseTime(e.target.value)
                  }
                })}
                placeholder="45:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Half Marathon (mm:ss)</label>
              <Input
                value={formatTime(profile.personalBests?.halfMarathon)}
                onChange={(e) => setProfile({
                  ...profile,
                  personalBests: {
                    ...profile.personalBests,
                    halfMarathon: parseTime(e.target.value)
                  }
                })}
                placeholder="1:45:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Marathon (mm:ss)</label>
              <Input
                value={formatTime(profile.personalBests?.marathon)}
                onChange={(e) => setProfile({
                  ...profile,
                  personalBests: {
                    ...profile.personalBests,
                    marathon: parseTime(e.target.value)
                  }
                })}
                placeholder="3:30:00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Preferred Running Time</label>
            <Select
              value={profile.preferredRunningTime}
              onValueChange={(value) => setProfile({ ...profile, preferredRunningTime: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="early_morning">Early Morning</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default EditProfile;
