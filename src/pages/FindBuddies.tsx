
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  Search,
  UserPlus,
  MessageCircle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Runner = {
  id: string;
  name: string;
  location: string;
  experience: string;
  pace: string;
  preferredTime: string;
  distance: number;
  compatibility: number;
  avatar?: string;
};

const FindBuddies = () => {
  const [searchParams, setSearchParams] = useState({
    location: "",
    experience: "",
    pace: "",
    distance: [5],
    time: ""
  });
  
  const [runners, setRunners] = useState<Runner[]>([
    {
      id: "1",
      name: "Melissa Chen",
      location: "Portland, OR",
      experience: "Intermediate",
      pace: "9:00 min/mile",
      preferredTime: "Morning",
      distance: 3.2,
      compatibility: 95,
    },
    {
      id: "2",
      name: "Jessica Williams",
      location: "Portland, OR",
      experience: "Advanced",
      pace: "7:30 min/mile",
      preferredTime: "Evening",
      distance: 4.5,
      compatibility: 82,
    },
    {
      id: "3",
      name: "Amanda Taylor",
      location: "Lake Oswego, OR",
      experience: "Beginner",
      pace: "10:30 min/mile",
      preferredTime: "Weekends",
      distance: 5.6,
      compatibility: 78,
    },
    {
      id: "4",
      name: "Rebecca Johnson",
      location: "Beaverton, OR",
      experience: "Intermediate",
      pace: "8:45 min/mile",
      preferredTime: "Morning",
      distance: 7.1,
      compatibility: 73,
    },
    {
      id: "5",
      name: "Stephanie Lee",
      location: "Portland, OR",
      experience: "Advanced",
      pace: "7:00 min/mile",
      preferredTime: "Evening",
      distance: 8.3,
      compatibility: 68,
    }
  ]);

  const handleConnect = (runnerId: string) => {
    toast({
      title: "Connection Request Sent",
      description: "We'll notify you when they respond.",
    });
  };

  const handleMessage = (runnerId: string) => {
    // Navigate to messages in a real implementation
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Enter city or zip code"
                  className="pl-10"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Experience Level</label>
              <Select 
                value={searchParams.experience}
                onValueChange={(value) => setSearchParams({...searchParams, experience: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Preferred Time</label>
              <Select
                value={searchParams.time}
                onValueChange={(value) => setSearchParams({...searchParams, time: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="weekend">Weekends</SelectItem>
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
                  <SelectValue placeholder="Any pace" />
                </SelectTrigger>
                <SelectContent>
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
          
          <Button className="w-full md:w-auto bg-runher hover:bg-runher-dark flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Runners
          </Button>
        </div>
        
        <div className="space-y-4">
          {runners.map((runner) => (
            <div key={runner.id} className="bg-white rounded-xl shadow-sm p-6">
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
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {runner.location}
                    </div>
                  </div>
                  <div className="mt-2 bg-runher/10 text-runher font-medium rounded-full py-1 px-3 text-sm">
                    {runner.compatibility}% Match
                  </div>
                </div>
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Experience</div>
                    <div className="font-medium">{runner.experience}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Avg. Pace</div>
                    <div className="font-medium">{runner.pace}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Preferred Time</div>
                    <div className="font-medium">{runner.preferredTime}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3 md:col-span-3">
                    <div className="text-sm text-muted-foreground">Looking for</div>
                    <div className="font-medium">5K training partner for weekday mornings</div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => handleConnect(runner.id)}
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Connect
                  </Button>
                  <Button 
                    onClick={() => handleMessage(runner.id)}
                    className="bg-runher hover:bg-runher-dark flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
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
