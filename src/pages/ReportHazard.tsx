
import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Construction,
  User,
  MapPin,
  Camera,
  Check,
  X,
  Flag
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";

type HazardReport = {
  id: string;
  type: "construction" | "suspicious" | "other";
  description: string;
  location: string;
  timestamp: Date;
  reportedBy: string;
  status: "active" | "confirmed" | "resolved" | "dismissed";
  confirmations: number;
  imageUrl?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

// Mock data for demonstration
const mockReports: HazardReport[] = [
  {
    id: "1",
    type: "construction",
    description: "Sidewalk closed due to construction, need to cross the street",
    location: "NW 23rd & Lovejoy",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    reportedBy: "Sarah J.",
    status: "active",
    confirmations: 3,
    coordinates: {
      lat: 45.529722,
      lng: -122.698333
    }
  },
  {
    id: "2",
    type: "suspicious",
    description: "Man in blue jacket following runners in the area",
    location: "Waterfront Park near the Steel Bridge",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    reportedBy: "Jessica M.",
    status: "confirmed",
    confirmations: 5,
    coordinates: {
      lat: 45.525833,
      lng: -122.671944
    }
  },
  {
    id: "3",
    type: "other",
    description: "Flooding on the trail after rain, very slippery",
    location: "Springwater Corridor mile marker 3",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    reportedBy: "Emily R.",
    status: "resolved",
    confirmations: 2,
    imageUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06",
    coordinates: {
      lat: 45.474722,
      lng: -122.651944
    }
  },
];

const HazardTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "construction":
      return <Construction className="h-5 w-5 text-orange-500" />;
    case "suspicious":
      return <User className="h-5 w-5 text-red-500" />;
    case "other":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case "active":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-red-100 text-red-800 border-red-300";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-300";
      case "dismissed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusStyle()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ReportHazard = () => {
  const [reports, setReports] = useState<HazardReport[]>(mockReports);
  const [showReportForm, setShowReportForm] = useState(false);
  const [newReport, setNewReport] = useState({
    type: "construction",
    description: "",
    location: "",
  });
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);

  const handleCreateReport = () => {
    if (!newReport.description || !newReport.location) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const report: HazardReport = {
      id: Date.now().toString(),
      type: newReport.type as "construction" | "suspicious" | "other",
      description: newReport.description,
      location: newReport.location,
      timestamp: new Date(),
      reportedBy: "You",
      status: "active",
      confirmations: 0,
      coordinates: {
        lat: 45.523064, // Default Portland coordinates for example
        lng: -122.676483
      }
    };

    setReports([report, ...reports]);
    setShowReportForm(false);
    setNewReport({
      type: "construction",
      description: "",
      location: "",
    });

    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our community safe!",
    });
  };

  const handleReportAction = (reportId: string, action: "confirm" | "resolve" | "dismiss") => {
    setReports(
      reports.map((report) => {
        if (report.id === reportId) {
          switch (action) {
            case "confirm":
              return {
                ...report,
                confirmations: report.confirmations + 1,
                status: "confirmed"
              };
            case "resolve":
              return {
                ...report,
                status: "resolved"
              };
            case "dismiss":
              return {
                ...report,
                status: "dismissed"
              };
            default:
              return report;
          }
        }
        return report;
      })
    );

    const actionMessages = {
      confirm: "You've confirmed this hazard",
      resolve: "You've marked this hazard as resolved",
      dismiss: "You've dismissed this report"
    };

    toast({
      title: "Report updated",
      description: actionMessages[action],
    });

    if (selectedReport && selectedReport.id === reportId) {
      setShowReportDetail(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffMins < 24 * 60) {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      const diffDays = Math.floor(diffMins / (60 * 24));
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-runher" />
            Safety Reports
          </h1>
          <p className="text-muted-foreground mb-6">
            Report and view hazards in your running area to keep the community informed and safe.
          </p>

          <Button 
            className="bg-runher hover:bg-runher-dark"
            onClick={() => setShowReportForm(true)}
          >
            Report New Hazard
          </Button>
        </div>

        {/* Report list */}
        <div className="space-y-4">
          {reports.filter(r => r.status !== "dismissed").map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl p-4 shadow-sm border cursor-pointer hover:border-runher transition-colors"
              onClick={() => {
                setSelectedReport(report);
                setShowReportDetail(true);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-full">
                  <HazardTypeIcon type={report.type} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Hazard
                      </h3>
                      <p className="text-sm text-muted-foreground">{report.location}</p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="text-sm mb-2 line-clamp-2">{report.description}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Reported by {report.reportedBy} • {formatTime(report.timestamp)}</span>
                    <span className="flex items-center">
                      <Check className="h-3 w-3 mr-1" /> 
                      {report.confirmations} confirmation{report.confirmations !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reports.filter(r => r.status !== "dismissed").length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No active hazards reported</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                The running routes in your area seem safe at the moment. Stay vigilant and report any hazards you encounter.
              </p>
            </div>
          )}
        </div>

        {/* New report dialog */}
        <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report a Hazard</DialogTitle>
              <DialogDescription>
                Provide details about the hazard to help keep others safe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hazard Type</label>
                <Select
                  value={newReport.type}
                  onValueChange={(value) => setNewReport({ ...newReport, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                    <SelectItem value="other">Other Hazard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Where is the hazard located?"
                    className="pl-10"
                    value={newReport.location}
                    onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your current location will be used for map placement
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe the hazard in detail"
                  rows={3}
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Photo (Optional)</label>
                <Button variant="outline" className="w-full flex gap-2">
                  <Camera className="h-4 w-4" />
                  <span>Take or Upload Photo</span>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReportForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport} className="bg-runher hover:bg-runher-dark">
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Report detail dialog */}
        <Dialog open={showReportDetail} onOpenChange={setShowReportDetail}>
          <DialogContent className="sm:max-w-lg">
            {selectedReport && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <HazardTypeIcon type={selectedReport.type} />
                    {selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)} Hazard
                  </DialogTitle>
                  <DialogDescription>
                    {selectedReport.location}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Reported by {selectedReport.reportedBy}
                    </div>
                    <StatusBadge status={selectedReport.status} />
                  </div>
                  
                  <p>{selectedReport.description}</p>
                  
                  {selectedReport.imageUrl && (
                    <div className="rounded-md overflow-hidden">
                      <img 
                        src={selectedReport.imageUrl} 
                        alt="Hazard" 
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="h-40 bg-secondary rounded-md flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Map location</span>
                  </div>
                  
                  <div className="text-sm flex justify-between items-center">
                    <span>Reported {formatTime(selectedReport.timestamp)}</span>
                    <span>{selectedReport.confirmations} confirmation{selectedReport.confirmations !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                
                <DialogFooter className="flex sm:justify-between sm:space-x-0 gap-2">
                  {selectedReport.status === "active" && (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleReportAction(selectedReport.id, "confirm")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Confirm
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-green-600"
                        onClick={() => handleReportAction(selectedReport.id, "resolve")}
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Resolved
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-600"
                    onClick={() => handleReportAction(selectedReport.id, "dismiss")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Dismiss
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ReportHazard;
