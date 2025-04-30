import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  MoreVertical,
  Search,
  Send,
  Settings,
  UserPlus,
  Users,
  Plus,
  Phone,
  Video,
  Info
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import messagesService, { Message as ServerMessage } from '@/services/messages';

interface User {
  _id: string;
  name: string;
  avatar?: string;
}

type Message = ServerMessage;

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: Message;
  lastMessageAt?: Date;
  online?: boolean;
  unread: number;
  isGroupChat?: boolean;
  groupName?: string;
  participants?: User[];
}

const Messages = () => {
  const [user] = useState(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    return { id: currentUser._id };
  });
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]); 
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<Contact | null>(null);

  // Create test conversation
  const createTestConversation = async () => {
    try {
      setLoading(true);
      await messagesService.createTestConversation();
      await loadConversations();
      toast({
        title: 'Test Conversation Created',
        description: 'A test conversation has been created with some sample messages.',
      });
    } catch (error) {
      console.error('Error creating test conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test conversation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load conversations
  const loadConversations = async () => {
    if (!user) return;

    const mapParticipant = (p: any): User => ({
      _id: p._id || p,
      name: p.name || 'Unknown',
      avatar: p.avatar
    });

    try {
      setLoading(true);
      const { data: conversations } = await messagesService.getConversations();
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser?._id;

      const mappedConversations = conversations.map((conv: any) => {
        // Get other participant's name for 1-on-1 chats
        const otherParticipant = !conv.isGroupChat && conv.participants.find(p => p._id !== currentUserId);
        const displayName = conv.isGroupChat ? conv.groupName : (otherParticipant?.name || 'Unknown User');

        return {
          id: conv._id,
          name: displayName,
          avatar: otherParticipant?.avatar,
          lastMessage: conv.lastMessage ? { ...conv.lastMessage, id: conv.lastMessage._id } : undefined,
          lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : undefined,
          unread: conv.lastMessage && !conv.lastMessage.readBy.includes(currentUserId) ? 1 : 0,
          isGroupChat: conv.isGroupChat,
          groupName: conv.groupName,
          participants: conv.participants.map(mapParticipant),
        };
      });

      setContacts(mappedConversations);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load messages for active chat
  const loadMessages = async (chatId: string, limit: number = 50) => {
    try {
      setLoading(true);
      const { data: chatMessages } = await messagesService.getMessages(chatId, limit);
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser?._id;

      // Map messages and ensure sender is properly set
      setMessages(prev => ({
        ...prev,
        [chatId]: chatMessages.map(msg => ({
          ...msg,
          _id: msg._id,
          sender: msg.sender._id || msg.sender // Handle both populated and unpopulated sender
        }))
      }));

      console.log('Loaded messages:', {
        chatId,
        messages: chatMessages,
        currentUserId
      });
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;

    const messageToSend = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      const { data: sentMessage } = await messagesService.sendMessage(activeChat.id, messageToSend);

      // Update messages state
      // Add new message to messages state
      setMessages(prev => ({
        ...prev,
        [activeChat.id]: [
          ...(prev[activeChat.id] || []),
          {
            ...sentMessage,
            _id: sentMessage._id,
            sender: user.id, // Use current user's ID as sender
            content: messageToSend,
            createdAt: new Date()
          }
        ]
      }));

      // Update contacts state with new last message
      setContacts(prev => prev.map(contact => {
        if (contact.id === activeChat.id) {
          return {
            ...contact,
            lastMessage: { 
              ...sentMessage,
              _id: sentMessage._id,
              sender: user.id // Use current user's ID as sender
            },
            lastMessageAt: new Date(),
            unread: 0
          };
        }
        return contact;
      }));

      // Scroll to bottom
      setTimeout(() => {
        const messageList = document.querySelector('.message-list');
        if (messageList) {
          messageList.scrollTop = messageList.scrollHeight;
        }
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsRead = async (contact: Contact) => {
    try {
      // Get unread messages for this contact
      const unreadMessages = messages[contact.id]?.filter(m => 
        m.sender === contact.id && !m.readBy.includes(user.id)
      ) || [];

      console.log('Unread messages:', unreadMessages);

      // Mark each unread message as read
      for (const message of unreadMessages) {
        if (!message._id) {
          console.error('Message missing _id:', message);
          continue;
        }
        try {
          await messagesService.markAsRead(contact.id, message._id);
          console.log('Successfully marked message as read:', message._id);
        } catch (err) {
          console.error('Error marking message as read:', message._id, err);
        }
      }

      // Update local message state
      if (messages[contact.id]) {
        const updatedMessages = {
          ...messages,
          [contact.id]: messages[contact.id].map(m => 
            m.sender === contact.id ? { ...m, readBy: [...m.readBy, user.id] } : m
          )
        };
        setMessages(updatedMessages);
      }

      // Update contact's unread count
      setContacts(prev =>
        prev.map(c =>
          c.id === contact.id ? { ...c, unread: 0 } : c
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark messages as read",
        variant: "destructive"
      });
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setActiveChat(contact);
    
    // Mark messages as read
    if (contact.unread) {
      handleMarkAsRead(contact);
    }
  };
  
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id, 50);
    }
  }, [activeChat?.id]);

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
        {/* Contacts sidebar */}
        <div className="w-full md:w-1/4 border-r border-border bg-white">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-semibold">Messages</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                  onClick={createTestConversation}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  Create Test Chat
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations"
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-148px)]">
            {sortedContacts.map(contact => (
              <div 
                key={contact.id}
                className={`p-4 cursor-pointer hover:bg-secondary/80 transition-colors ${
                  activeChat?.id === contact.id ? 'bg-secondary' : ''
                }`}
                onClick={() => handleContactSelect(contact)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-runher/10 text-runher">
                        {contact.name.split(' ').map(name => name[0]).join('')}
                      </AvatarFallback>
                      {contact.avatar && <AvatarImage src={contact.avatar} />}
                    </Avatar>
                    {contact.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium truncate">{contact.name}</h3>
                      {contact.lastMessageAt && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(contact.lastMessageAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <div className="text-sm text-muted-foreground">
                        {contact.lastMessage.content}
                      </div>
                    )}
                  </div>
                  {contact.unread && contact.unread > 0 && (
                    <div className="flex-shrink-0 h-5 w-5 bg-runher text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {contact.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
        
        {/* Chat area */}
        {activeChat ? (
          <div className="flex-grow flex flex-col h-full bg-secondary/30">
            {/* Chat header */}
            <div className="p-4 border-b border-border bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-runher/10 text-runher">
                    {activeChat.name.split(' ').map(name => name[0]).join('')}
                  </AvatarFallback>
                  {activeChat.avatar && <AvatarImage src={activeChat.avatar} />}
                </Avatar>
                <div>
                  <h3 className="font-medium">{activeChat.name}</h3>
                  {activeChat.online && (
                    <p className="text-xs text-green-500">Online</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Info className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {messages[activeChat.id]?.map(message => {
                  const isCurrentUser = message.sender === user.id;
                  return (
                    <div 
                      key={message._id} 
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                          <AvatarFallback className="bg-runher/10 text-runher text-xs">
                            {activeChat.name.split(' ').map(name => name[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div 
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-runher text-white rounded-br-none'
                            : 'bg-secondary rounded-bl-none'
                        }`}
                      >
                        <p>{message.content}</p>
                        <div 
                          className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-white/70' : 'text-muted-foreground'
                          }`}
                        >
                          {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            
            {/* Message input */}
            <div className="p-4 bg-white border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  className="flex-grow"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-runher hover:bg-runher-dark flex-shrink-0 h-10 w-10 p-0 rounded-full"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center bg-secondary/30">
            <div className="text-center p-8">
              <div className="mx-auto h-16 w-16 bg-muted-foreground/20 rounded-full flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">Your Messages</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Select a conversation or start a new one to begin messaging with other runners.
              </p>
              <Button className="mt-4 bg-runher hover:bg-runher-dark">
                Start a Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
