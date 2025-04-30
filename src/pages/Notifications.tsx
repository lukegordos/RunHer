import { useEffect, useState, useRef } from "react";
import { FriendRequest, getFriendRequests, updateFriendRequest } from "@/services/users";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Check, X, RefreshCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const NotificationsContent = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  // Track if the component is mounted to prevent setting state after unmount
  const isMounted = useRef(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getFriendRequests();
      
      if (!response || (!response.received && !response.sent)) {
        throw new Error('Invalid response format');
      }
      
      if (isMounted.current) {
        // Only show pending received requests
        const pendingRequests = response.received.filter(req => req.status === 'pending');
        setRequests(pendingRequests);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load friend requests';
      if (isMounted.current) {
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateFriendRequest(requestId, status);
      toast({
        title: "Success",
        description: `Friend request ${status}`,
      });
      loadRequests(); // Reload the requests
    } catch (error) {
      console.error('Error updating friend request:', error);
      toast({
        title: "Error",
        description: "Failed to update friend request",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    loadRequests();
  };

  if (!loading && !error && (!requests || requests.length === 0)) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">No pending friend requests</h1>
          <Button onClick={handleRetry} variant="outline" className="flex items-center">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Loading notifications...</h1>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Notifications</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline" className="flex items-center">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <UserPlus className="mr-2 h-6 w-6 text-runher" />
          Friend Requests
        </h1>

        {!requests || requests.length === 0 ? (
          <div className="text-gray-500">No pending friend requests</div>
        ) : (
          <div className="space-y-4">
            {requests?.map((request) => (
              <div key={request._id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>{request.requester.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{request.requester.name}</h3>
                      <p className="text-sm text-gray-500">{request.requester.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleRequest(request._id, 'accepted')}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleRequest(request._id, 'rejected')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

const Notifications = () => (
  <ErrorBoundary>
    <NotificationsContent />
  </ErrorBoundary>
);

export default Notifications;
