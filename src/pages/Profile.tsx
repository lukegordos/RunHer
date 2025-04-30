
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/contexts/AuthContext";
import { stravaService } from "@/services/stravaService";
import { useLocation } from "react-router-dom";
import { RunnerProfile, updateProfile, getProfile } from "@/services/profile";

const Profile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auth = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  const defaultProfile = useCallback((): RunnerProfile => ({
    name: auth?.user?.name || '',
    email: auth?.user?.email || '',
    experienceLevel: 'beginner',
    averagePace: 0,
    weeklyMileage: 0,
    personalBests: {
      mile: null,
      fiveK: null,
      tenK: null,
      halfMarathon: null,
      marathon: null
    },
    preferredRunningTime: 'morning',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    bio: '',
    goals: ''
  }), [auth?.user?.name, auth?.user?.email]);

  const [isEditing, setIsEditing] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [profileData, setProfileData] = useState<RunnerProfile | null>(null);
  const [stravaProfile, setStravaProfile] = useState<any>(null);
  const [stravaConnected, setStravaConnected] = useState(false);

  // Load profile data first
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await getProfile();
        if (profile) {
          setProfileData(profile);
        } else {
          setProfileData(defaultProfile());
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
        // If we can't load the profile, initialize with default data
        setProfileData(defaultProfile());
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [defaultProfile]);

  // Then sync with auth data if needed
  useEffect(() => {
    if (auth?.user?.name && profileData && !profileData.name) {
      const updatedProfile: RunnerProfile = {
        ...profileData,
        name: auth.user.name,
        email: auth.user.email || ''
      };
      setProfileData(updatedProfile);
    }
  }, [auth?.user?.name, auth?.user?.email]);

  const handleStravaCallback = useCallback(async (code: string) => {
    try {
      const tokens = await stravaService.exchangeToken(code);
      const profile = await stravaService.getProfile(tokens.accessToken);
      setStravaProfile(profile);
      setStravaConnected(true);
      toast({
        title: 'Success!',
        description: 'Successfully connected to Strava',
      });
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to Strava',
        variant: 'destructive',
      });
    }
  }, [setStravaProfile, setStravaConnected]);

  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code');
    if (code) {
      handleStravaCallback(code);
    }
  }, [location, handleStravaCallback]);

  const handleConnectStrava = () => {
    window.location.href = stravaService.getAuthUrl();
  };
  
  useEffect(() => {
    // Check for existing Strava connection
    const storedTokens = localStorage.getItem('stravaTokens');
    if (storedTokens) {
      const tokens = JSON.parse(storedTokens);
      stravaService.getProfile(tokens.accessToken)
        .then(profile => {
          setStravaProfile(profile);
          setStravaConnected(true);
        })
        .catch(() => {
          localStorage.removeItem('stravaTokens');
        });
    }
  }, [setStravaProfile, setStravaConnected]);

  const handleDisconnectStrava = () => {
    localStorage.removeItem('stravaTokens');
    setStravaProfile(null);
    setStravaConnected(false);
    toast({
      title: "Disconnected",
      description: "Your Strava account has been disconnected.",
    });
  };






  
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'location') {
      setLocationInput(value);
      if (value) {
        await updateLocation(value);
      }
      return;
    }

    setProfileData(prev => {
      const currentProfile = prev || defaultProfile();
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        return {
          ...currentProfile,
          [parent]: {
            ...currentProfile[parent],
            [child]: value === '' ? null : parseFloat(value)
          }
        };
      } else if (name === 'averagePace' || name === 'weeklyMileage') {
        // Convert empty string to 0, otherwise parse as float
        const numericValue = value === '' ? 0 : parseFloat(value);
        // Only update if it's a valid number
        return {
          ...currentProfile,
          [name]: isNaN(numericValue) ? 0 : numericValue
        };
      } else {
        return {
          ...currentProfile,
          [name]: value
        };
      }
    });
  };

  const handleSelectChange = async (name: string, value: string) => {
    if (!profileData) return;
    
    try {
      setIsLoading(true);
      const updatedProfile = await updateProfile({
        ...profileData,
        [name]: value
      });
      setProfileData(updatedProfile);
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = async (location: string) => {
    try {
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${import.meta.env.VITE_OPENCAGE_API_KEY}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry;
        const components = result.components;
        const city = components.city || components.town || components.village;
        const state = components.state;

        if (city && state) {
          setLocationInput(`${city}, ${state}`);
          const updatedLocation = {
            type: 'Point' as const,
            coordinates: [lng, lat] as [number, number]
          };
          setProfileData(prev => {
            const currentProfile = prev || defaultProfile();
            const updatedProfile: RunnerProfile = {
              ...currentProfile,
              location: updatedLocation
            };
            return updatedProfile;
          });
        } else {
          setLocationInput(result.formatted);
          const updatedLocation = {
            type: 'Point' as const,
            coordinates: [lng, lat] as [number, number]
          };
          setProfileData(prev => {
            const currentProfile = prev || defaultProfile();
            const updatedProfile: RunnerProfile = {
              ...currentProfile,
              location: updatedLocation
            };
            return updatedProfile;
          });
        }
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      if (!profileData) {
        throw new Error('No profile data to save');
      }
      setIsLoading(true);
      const updatedProfile = await updateProfile(profileData);
      setProfileData(updatedProfile);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-runher"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Image and Stats */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center sticky top-24">
              <div className="flex flex-col items-center text-center space-y-6">
                <div
                  className="w-32 h-32 mb-4 relative rounded-full overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-colors"
                  onClick={handlePhotoClick}
                >
                  {profileImage ? (
                    <>
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                      {isEditing && (
                        <button
                          onClick={handleRemovePhoto}
                          className="absolute top-0 right-0 p-1 bg-black/50 text-white rounded-bl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      {auth?.user?.name ? (
                        <div className="text-2xl font-semibold text-muted-foreground">
                          {auth?.user?.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      ) : (
                        <User className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                )}

                {isEditing ? (
                  <Input 
                    name="name"
                    value={auth?.user?.name || ''} 
                    onChange={handleChange}
                    className="text-center text-xl font-bold mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{auth?.user?.name}</h1>
                )}

                <div className="text-muted-foreground text-sm space-y-4">
                  <div className="flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {isEditing ? (
                      <Input
                        name="location"
                        value={locationInput}
                        onChange={handleChange}
                        className="max-w-[200px]"
                      />
                    ) : (
                      locationInput
                    )}
                  </div>

                  {/* Runner Stats */}
                  <div className="w-full px-4">
                    <h3 className="font-medium text-sm mb-2 text-foreground">Runner Stats</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Experience:</span>
                        {isEditing ? (
                          <Select
                            name="experienceLevel"
                            value={profileData?.experienceLevel || 'beginner'}
                            onValueChange={(value) => handleSelectChange('experienceLevel', value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize">{profileData?.experienceLevel || 'beginner'}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Preferred Time:</span>
                        {isEditing ? (
                          <Select
                            name="preferredRunningTime"
                            value={profileData?.preferredRunningTime || 'morning'}
                            onValueChange={(value) => handleSelectChange('preferredRunningTime', value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning</SelectItem>
                              <SelectItem value="afternoon">Afternoon</SelectItem>
                              <SelectItem value="evening">Evening</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize">{profileData?.preferredRunningTime || 'morning'}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Average Pace:</span>
                        {isEditing ? (
                          <Input
                            name="averagePace"
                            value={profileData?.averagePace || 0}
                            onChange={handleChange}
                            className="max-w-[120px]"
                            type="number"
                            step="0.1"
                          />
                        ) : (
                          <span>{profileData?.averagePace || 0} min/mile</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Weekly Miles:</span>
                        {isEditing ? (
                          <Input
                            name="weeklyMileage"
                            value={profileData?.weeklyMileage || 0}
                            onChange={handleChange}
                            className="max-w-[120px]"
                            type="number"
                            step="0.1"
                          />
                        ) : (
                          <span>{profileData?.weeklyMileage || 0} miles</span>
                        )}
                      </div>
                    </div>
                  </div>


                </div>

                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    className="mt-4 bg-runher hover:bg-runher-dark flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
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
            </div>
          </div>

          {/* Profile Details */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="font-semibold text-xl mb-4">About Me</h2>
              {isEditing ? (
                <Textarea 
                  name="bio"
                  value={profileData?.bio || ''} 
                  onChange={handleChange}
                  className="min-h-28"
                />
              ) : (
                <p className="text-muted-foreground">{profileData?.bio || 'No bio provided'}</p>
              )}
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="font-semibold text-xl mb-4">Running Goals</h2>
              {isEditing ? (
                <Textarea 
                  name="goals"
                  value={profileData?.goals || ''} 
                  onChange={handleChange}
                  className="min-h-28"
                />
              ) : (
                <p className="text-muted-foreground">{profileData?.goals || 'No goals set'}</p>
              )}
            </div>

            {/* Strava Integration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#FC4C02]" />
                  <h2 className="font-semibold text-lg">Strava Profile</h2>
                </div>
                {stravaConnected ? (
                  <Button
                    variant="outline"
                    onClick={handleDisconnectStrava}
                    className="w-full"
                  >
                    Disconnect Strava
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleConnectStrava}
                    className="w-full"
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
                  LOADING Strava Profile...
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Connect Your Strava Account To See Your Running Stats And Activities.
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
