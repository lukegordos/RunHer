import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Users,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type RunEvent = {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  distance: string;
  duration: string;
  description: string;
  participants: {
    id: string;
    name: string;
  }[];
};

const Calendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<RunEvent[]>([
    {
      id: "1",
      title: "Morning Group Run",
      date: new Date(2023, 5, 15),
      time: "6:30 AM",
      location: "Waterfront Park",
      distance: "5K",
      duration: "30 minutes",
      description: "Easy pace run along the waterfront. All levels welcome!",
      participants: [
        { id: "1", name: "Sarah Johnson" },
        { id: "2", name: "Melissa Chen" },
        { id: "3", name: "Jessica Williams" }
      ]
    },
    {
      id: "2",
      title: "Trail Run Adventure",
      date: new Date(2023, 5, 18),
      time: "8:00 AM",
      location: "Forest Park",
      distance: "10K",
      duration: "1 hour",
      description: "Moderate trail run with some elevation. Bring water!",
      participants: [
        { id: "1", name: "Sarah Johnson" },
        { id: "4", name: "Amanda Taylor" }
      ]
    },
    {
      id: "3",
      title: "Weekend Long Run",
      date: new Date(2023, 5, 20),
      time: "7:00 AM",
      location: "Springwater Corridor",
      distance: "Half Marathon",
      duration: "2 hours",
      description: "Training run for upcoming half marathon. Steady pace.",
      participants: [
        { id: "1", name: "Sarah Johnson" },
        { id: "2", name: "Melissa Chen" },
        { id: "5", name: "Stephanie Lee" }
      ]
    }
  ]);
  
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    time: "",
    location: "",
    distance: "",
    duration: "",
    description: ""
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const todaysEvents = events.filter(
    (event) => date && event.date.toDateString() === date.toDateString()
  );
  
  const handleAddEvent = () => {
    // Validate form data
    if (!newEvent.title || !newEvent.time || !newEvent.location) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const event: RunEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...newEvent,
      participants: [{ id: "1", name: "Sarah Johnson" }] // Current user
    };
    
    setEvents([...events, event]);
    setDialogOpen(false);
    
    // Reset form
    setNewEvent({
      title: "",
      date: new Date(),
      time: "",
      location: "",
      distance: "",
      duration: "",
      description: ""
    });
    
    toast({
      title: "Event created",
      description: "Your running event has been added to the calendar.",
    });
  };
  
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Calendar sidebar */}
          <div className="w-full md:w-1/3">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-runher" />
                  Calendar
                </h2>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-runher hover:bg-runher-dark h-8 flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      New Run
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-runher">Schedule a Run</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Title</label>
                        <Input 
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                          placeholder="e.g. Morning Run"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Date</label>
                          <div className="border rounded-md">
                            <CalendarComponent
                              mode="single"
                              selected={newEvent.date}
                              onSelect={(date) => date && setNewEvent({...newEvent, date})}
                              disabled={(date) => date < new Date()}
                              className="rounded-md"
                              classNames={{
                                months: "flex flex-col space-y-4",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-sm font-medium",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: "h-8 w-8 text-center text-xs p-0 relative",
                                day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                                day_selected: "bg-runher text-white hover:bg-runher hover:text-white",
                                day_today: "bg-accent text-accent-foreground",
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Time</label>
                            <Input 
                              value={newEvent.time}
                              onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                              placeholder="e.g. 7:00 AM"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Distance</label>
                            <Select 
                              value={newEvent.distance}
                              onValueChange={(distance) => setNewEvent({...newEvent, distance})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select distance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5K">5K</SelectItem>
                                <SelectItem value="10K">10K</SelectItem>
                                <SelectItem value="Half Marathon">Half Marathon</SelectItem>
                                <SelectItem value="Marathon">Marathon</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Duration</label>
                            <Input 
                              value={newEvent.duration}
                              onChange={(e) => setNewEvent({...newEvent, duration: e.target.value})}
                              placeholder="e.g. 45 minutes"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Location</label>
                        <Input 
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                          placeholder="e.g. Waterfront Park"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <Textarea 
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                          placeholder="Add details about the run..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="pt-2">
                        <Button onClick={handleAddEvent} className="w-full bg-runher hover:bg-runher-dark text-white font-medium h-10">
                          Schedule Run
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">UPCOMING RUNS</h3>
                <div className="space-y-3">
                  {events
                    .filter(event => event.date >= new Date())
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 3)
                    .map(event => (
                      <div key={event.id} className="flex items-start p-3 rounded-lg bg-secondary">
                        <div className="w-12 h-12 rounded-md bg-runher/10 flex flex-col items-center justify-center mr-3 text-runher font-medium">
                          <span className="text-xs">{format(event.date, 'MMM')}</span>
                          <span className="text-lg leading-tight">{format(event.date, 'd')}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.time} • {event.location}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Day view */}
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {date ? format(date, 'EEEE, MMMM d, yyyy') : 'Select a date'}
              </h2>
              
              {todaysEvents.length > 0 ? (
                <div className="space-y-6">
                  {todaysEvents.map(event => (
                    <div key={event.id} className="border border-border rounded-lg p-5">
                      <h3 className="text-lg font-semibold mb-2 flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-runher" />
                        {event.title}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.time} ({event.duration})
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-1">Distance</div>
                        <div className="bg-secondary inline-block px-3 py-1 rounded-full text-sm">
                          {event.distance}
                        </div>
                      </div>
                      
                      {event.description && (
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-1">Description</div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm font-medium mb-2 flex items-center">
                          <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span>Participants ({event.participants.length})</span>
                        </div>
                        <div className="flex -space-x-2">
                          {event.participants.map(participant => (
                            <Avatar key={participant.id} className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="bg-runher/10 text-runher text-xs">
                                {participant.name.split(' ').map(name => name[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          <Button variant="outline" className="h-8 w-8 rounded-full text-xs ml-2">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No runs scheduled</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You don't have any runs scheduled for this day.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="mt-4 bg-runher hover:bg-runher-dark flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Schedule a Run
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      {/* Same content as the other dialog */}
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
