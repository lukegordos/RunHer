import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import runsService from "@/services/runs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type RunEvent = {
  id: string;
  title: string;
  date: Date;
  location: string;
  distance: string;
  duration: string;
  description?: string;
  type: 'solo' | 'group' | 'race' | 'training';
};

type NewRunEvent = {
  title: string;
  date: Date;
  time: string;
  location: string;
  distance: string;
  duration: string;
  description: string;
  type: 'solo' | 'group' | 'race' | 'training';
};

const transformEventForDisplay = (run: any): RunEvent => {
  try {
    if (!run) {
      throw new Error('No run data provided');
    }

    return {
  id: run._id,
  title: run.title || 'Untitled Run',
  date: new Date(run.date),
  location: run.meetingPoint || 'No location',
  distance: `${run.distance?.value || 0} ${run.distance?.unit || 'miles'}`,
  duration: `${Math.floor((run.duration || 0) / 60)} min`,
  description: run.description || '',
  type: run.type || 'solo'
    };
  } catch (error) {
    console.error('Error transforming event:', error);
    throw error;
  }
};

const Calendar = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState<NewRunEvent>({
    title: '',
    date: new Date(),
    time: '',
    location: '',
    distance: '',
    duration: '',
    description: '',
    type: 'solo'
  });

  const handleAddEvent = async () => {
    try {
      if (!user?._id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating event with data:', newEvent);
      // Combine date and time
      const [hours, minutes] = newEvent.time.split(':').map(Number);
      const eventDate = new Date(newEvent.date);
      eventDate.setHours(hours || 0, minutes || 0, 0, 0);

      // Calculate values
      const distanceValue = parseFloat(newEvent.distance) || 0;
      const durationSeconds = parseInt(newEvent.duration) * 60 || 0; // Convert to seconds
      
      // Calculate pace (minutes per mile)
      const paceMinutesPerMile = distanceValue > 0 ? durationSeconds / 60 / distanceValue : 0;

      const eventData = {
        title: newEvent.title,
        date: eventDate,
        meetingPoint: newEvent.location,
        distance: {
          value: distanceValue,
          unit: 'miles'
        },
        duration: durationSeconds,
        description: newEvent.description || '',
        type: newEvent.type || 'solo',
        status: 'scheduled' as const,
        confirmed: false,
        pace: paceMinutesPerMile,
        createdBy: user._id
      };

      console.log('Sending event data to server:', eventData);
      const response = await runsService.scheduleRun(eventData);
      console.log('Server response:', response);

      if (!response.data) {
        throw new Error('No data received from server');
      }

      console.log('Created event:', response.data);
      // Reload all events to ensure we have the latest data
      await loadEvents();

      toast({
        title: "Success",
        description: "Run scheduled successfully",
        variant: "default"
      });
      setShowAddEventDialog(false);
      setNewEvent({
        title: '',
        date: new Date(),
        time: '',
        location: '',
        distance: '',
        duration: '',
        description: '',
        type: 'solo'
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to schedule run",
        variant: "destructive"
      });
    }
  };

  const loadEvents = async () => {
    console.log('Loading events...');
    try {
      if (!date) {
        console.log('No date selected, using current date');
        setDate(new Date());
        return;
      }

      // Get the start and end of the selected month
      const selectedDate = new Date(date); // Create a copy to avoid mutations
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('Selected date:', selectedDate);
      console.log('Loading events between:', { startDate, endDate });

      const response = await runsService.getCalendarRuns(startDate, endDate);
      console.log('Response from server:', response);
      
      // Ensure we have an array of runs
      const runs = Array.isArray(response.data) ? response.data : [];
      console.log('Runs array:', runs);

      const transformedEvents: RunEvent[] = runs.map((run: any) => {
        console.log('Processing run:', run);
        return transformEventForDisplay(run);
      });

      console.log('Transformed events:', transformedEvents);
      setEvents(transformedEvents);
    } catch (error: any) {
      console.error('Error loading events:', {
        error,
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to load events",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadEvents();
  }, [date]); // Reload events when selected date changes

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
            <DialogTrigger asChild>
              <Button className="bg-runher hover:bg-runher-dark flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Schedule a Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a Run</DialogTitle>
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
                      <label className="text-sm font-medium mb-1 block">Distance (miles)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={newEvent.distance}
                          onChange={(e) => setNewEvent({...newEvent, distance: e.target.value})}
                          placeholder="Enter distance"
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          mi
                        </span>
                      </div>
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
                    placeholder="Add any additional details"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md border"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Events for {format(date, 'MMMM d, yyyy')}
            </h2>
            {(() => {
              const eventsForSelectedDate = events.filter(event => {
                try {
                  if (!event.date) return false;
                  const eventDate = new Date(event.date);
                  const selectedDate = new Date(date);
                  
                  // Compare year, month, and day
                  const isSameDay = 
                    eventDate.getFullYear() === selectedDate.getFullYear() &&
                    eventDate.getMonth() === selectedDate.getMonth() &&
                    eventDate.getDate() === selectedDate.getDate();
                  
                  console.log('Comparing dates:', {
                    event: event.title,
                    eventDate: eventDate.toISOString(),
                    selectedDate: selectedDate.toISOString(),
                    isSameDay
                  });
                  
                  return isSameDay;
                } catch (error) {
                  console.error('Error comparing dates:', error);
                  return false;
                }
              });
              console.log('Events for selected date:', { date: date.toISOString(), eventCount: eventsForSelectedDate.length });
              
              return eventsForSelectedDate.length === 0 ? (
                <p className="text-muted-foreground">No events scheduled for {format(date, 'MMMM d, yyyy')}.</p>
              ) : (
                <div className="space-y-4">
                  {eventsForSelectedDate.map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg hover:bg-accent">
                      <h3 className="font-medium">{event.title}</h3>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p>
                          {(() => {
                            try {
                              if (!event.date) return 'No time set';
                              const eventDate = new Date(event.date);
                              if (isNaN(eventDate.getTime())) return 'Invalid date';
                              return format(eventDate, 'h:mm a');
                            } catch (error) {
                              console.error('Error formatting time:', error);
                              return 'Error displaying time';
                            }
                          })()}
                        </p>
                        <p>{event.location}</p>
                        <p>{event.distance} • {event.duration}</p>
                        {event.description && <p>{event.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
            }
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
