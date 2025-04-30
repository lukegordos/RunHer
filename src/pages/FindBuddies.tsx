import { useState } from "react";
import { Button } from "@/components/ui/button";
import { searchUsers, User, SearchCriteria } from "@/services/users";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Users, UserPlus, MapPin, Calendar, Clock, Search } from "lucide-react";
import { sendFriendRequest } from "@/services/users";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Runner {
  _id: string;
  name: string;
  email: string;
  location: string;
  experience: string;
  pace: string;
  preferredTime: string;
  distance: number;
  compatibility: number;
  avatar?: string;
}

const FindBuddies = () => {
  const [nameQuery, setNameQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    location: "",
    experienceLevel: "",
    pace: "",
    distance: [5],
    preferredTime: ""
  });

  // Function to find running buddies
  const findBuddies = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchCriteria: SearchCriteria = {
        query: nameQuery?.trim() || undefined,
        experienceLevel: searchParams.experienceLevel?.trim() || undefined,
        preferredTime: searchParams.preferredTime?.trim() || undefined,
        location: searchParams.location?.trim() || undefined,
        distance: searchParams.distance[0]
      };

      const result = await searchUsers(searchCriteria);

      if ('error' in result) {
        setError(result.error);
        setRunners([]);
        return;
      }

      const mappedRunners: Runner[] = result.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        location: user.location || 'No location set',
        experience: user.experienceLevel || 'Not specified',
        pace: user.pace || 'Not specified',
        preferredTime: user.preferredTime || 'Not specified',
        distance: user.preferredDistance || 0,
        compatibility: user.compatibility || 0,
        avatar: undefined
      }));
      setRunners(mappedRunners);
    } catch (err: any) {
      console.error('Error finding buddies:', err);
      setError('Failed to find running buddies');
      setRunners([]);
      toast({
        title: "Error",
        description: "Failed to find running buddies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (runnerId: string) => {
    try {
      await sendFriendRequest(runnerId);
      toast({
        title: "Friend Request Sent",
        description: "Your connection request has been sent!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleMessage = (runnerId: string) => {
    // For now, just show a toast. In a real implementation, navigate to messages
    toast({
      title: "Starting conversation",
      description: "Opening message thread...",
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <Users className="mr-2 h-6 w-6 text-runher" />
            Find Running Buddies
          </h1>
          
          <div className="space-y-4 mb-6">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
                {error}
              </div>
            )}
            {/* Name search */}
            <div className="flex gap-4">
              <Input
                placeholder="Search by name..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && findBuddies()}
                className="flex-1"
              />
              <Button onClick={findBuddies} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Location and other filters */}
            <div className="flex gap-4">
              <Input
                placeholder="Filter by location..."
                value={searchParams.location}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, location: e.target.value })
                }
                className="flex-1"
              />
              <Button onClick={findBuddies} disabled={loading}>
                {loading ? 'Filtering...' : 'Apply Filters'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Experience Level</label>
              <Select 
                value={searchParams.experienceLevel}
                onValueChange={(value) => setSearchParams({...searchParams, experienceLevel: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Preferred Time</label>
              <Select
                value={searchParams.preferredTime}
                onValueChange={(value) => setSearchParams({...searchParams, preferredTime: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Pace Range</label>
              <Select
                value={searchParams.pace}
                onValueChange={(value) => setSearchParams({...searchParams, pace: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="beginner">10:00+ min/mile</SelectItem>
                  <SelectItem value="casual">9:00-10:00 min/mile</SelectItem>
                  <SelectItem value="moderate">8:00-9:00 min/mile</SelectItem>
                  <SelectItem value="fast">7:00-8:00 min/mile</SelectItem>
                  <SelectItem value="elite">Sub 7:00 min/mile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Maximum Distance: {searchParams.distance[0]} miles
              </label>
              <Slider
                defaultValue={[5]}
                max={20}
                step={1}
                onValueChange={(value) => setSearchParams({...searchParams, distance: value})}
              />
            </div>
          </div>
          
          <Button 
            className="w-full md:w-auto bg-runher hover:bg-runher-dark flex items-center gap-2"
            onClick={async () => {
              try {
                console.log('Finding runners with all params:', searchParams);
                
                // Check if at least one search criteria is provided
                if (!nameQuery.trim() && 
                    !searchParams.experienceLevel && 
                    !searchParams.preferredTime && 
                    !searchParams.location.trim()) {
                  setError('Please provide at least one search criteria (name, experience level, preferred time, or location)');
                  return;
                }
                
                setLoading(true);
                setError(null);

                console.log('Starting search with params:', {
                  query: nameQuery,
                  experienceLevel: searchParams.experienceLevel,
                  preferredTime: searchParams.preferredTime,
                  location: searchParams.location
                });

                const results = await searchUsers({
                  query: nameQuery,
                  experienceLevel: searchParams.experienceLevel,
                  preferredTime: searchParams.preferredTime,
                  location: searchParams.location
                });

                console.log('Search results received:', results);
                if (!results || !Array.isArray(results)) {
                  console.error('Invalid response format:', results);
                  throw new Error('Invalid response format');
                }

                const formattedResults: Runner[] = results.map(user => ({
                  _id: user._id || 'unknown',
                  name: user.name || 'Unknown User',
                  email: user.email || 'no-email@example.com',
                  location: user.location || searchParams.location || 'Portland, OR',
                  experience: user.experienceLevel || searchParams.experienceLevel || 'Intermediate',
                  pace: user.pace || searchParams.pace || '9:00 min/mile',
                  preferredTime: user.preferredTime || searchParams.preferredTime || 'Morning',
                  distance: searchParams.distance[0],
                  compatibility: Math.floor(Math.random() * 30) + 70,
                  avatar: undefined
                }));

                console.log('Formatted find runners results:', formattedResults);
                setRunners(formattedResults);
              } catch (error: any) {
                console.error('Error finding runners:', error);
                const errorMessage = error.response?.data?.error || error.message || "Failed to find runners. Please try again.";
                setError(errorMessage);
                toast({
                  title: "Error",
                  description: errorMessage,
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <Search className="h-4 w-4" />
            {loading ? 'Searching...' : 'Find Runners'}
          </Button>
        </div>
        
        <div className="space-y-4">
          {runners.map((runner) => (
            <div key={runner._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-runher/10 text-runher text-xl">
                      {runner.name.split(' ').map(name => name[0]).join('')}
                    </AvatarFallback>
                    {runner.avatar && <AvatarImage src={runner.avatar} />}
                  </Avatar>
                  <div className="mt-2 text-center">
                    <div className="text-lg font-semibold">{runner.name}</div>
                    {runner.email && (
                      <div className="mb-2">{runner.email}</div>
                    )}
                    {runner.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {runner.location}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 bg-runher/10 text-runher font-medium rounded-full py-1 px-3 text-sm">
                    {runner.compatibility}% Match
                  </div>
                </div>
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Experience</div>
                    <div className="font-medium">{runner.experience || 'Not specified'}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Avg. Pace</div>
                    <div className="font-medium">{runner.pace || 'Not specified'}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Preferred Time</div>
                    <div className="font-medium">{runner.preferredTime || 'Not specified'}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3 md:col-span-3">
                    <div className="text-sm text-muted-foreground">Looking for</div>
                    <div className="font-medium">5K training partner for weekday mornings</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(runner._id)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessage(runner._id)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default FindBuddies;
