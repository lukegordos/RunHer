
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Send,
  Phone,
  Video,
  Info,
  MoreVertical,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

type Contact = {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  online?: boolean;
  unread?: number;
};

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
};

const Messages = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "Melissa Chen",
      lastMessage: "Let me know what time works for you tomorrow!",
      lastMessageTime: new Date(2023, 5, 20, 15, 43),
      online: true,
      unread: 1,
    },
    {
      id: "2",
      name: "Jessica Williams",
      lastMessage: "Great run today! Same time next week?",
      lastMessageTime: new Date(2023, 5, 19, 18, 22),
    },
    {
      id: "3",
      name: "Amanda Taylor",
      lastMessage: "I found a great new trail we should try!",
      lastMessageTime: new Date(2023, 5, 19, 9, 15),
      online: true,
    },
    {
      id: "4",
      name: "Running Group",
      lastMessage: "Sarah: Is everyone still on for Saturday?",
      lastMessageTime: new Date(2023, 5, 18, 14, 30),
      unread: 3,
    },
    {
      id: "5",
      name: "Rebecca Johnson",
      lastMessage: "Thanks for the recommendation!",
      lastMessageTime: new Date(2023, 5, 17, 20, 10),
    }
  ]);
  
  const [activeChat, setActiveChat] = useState<Contact | null>(contacts[0]);
  
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "1": [
      {
        id: "1-1",
        senderId: "1",
        text: "Hi Sarah! Are we still on for our morning run tomorrow?",
        timestamp: new Date(2023, 5, 20, 15, 30),
        read: true,
      },
      {
        id: "1-2",
        senderId: "user",
        text: "Hi Melissa! Yes, definitely still on. What time works for you?",
        timestamp: new Date(2023, 5, 20, 15, 40),
        read: true,
      },
      {
        id: "1-3",
        senderId: "1",
        text: "Let me know what time works for you tomorrow!",
        timestamp: new Date(2023, 5, 20, 15, 43),
        read: false,
      }
    ],
    "2": [
      {
        id: "2-1",
        senderId: "user",
        text: "That was an awesome run today! Thanks for pushing me.",
        timestamp: new Date(2023, 5, 19, 18, 15),
        read: true,
      },
      {
        id: "2-2",
        senderId: "2",
        text: "Great run today! Same time next week?",
        timestamp: new Date(2023, 5, 19, 18, 22),
        read: true,
      }
    ]
  });
  
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const message: Message = {
      id: `${activeChat.id}-${Date.now()}`,
      senderId: "user",
      text: newMessage,
      timestamp: new Date(),
      read: true,
    };
    
    // Update messages
    const updatedMessages = { 
      ...messages,
      [activeChat.id]: [...(messages[activeChat.id] || []), message] 
    };
    setMessages(updatedMessages);
    
    // Update contact's last message
    const updatedContacts = contacts.map(c => 
      c.id === activeChat.id 
        ? { ...c, lastMessage: newMessage, lastMessageTime: new Date() }
        : c
    );
    setContacts(updatedContacts);
    
    // Clear input
    setNewMessage("");
    
    // Simulate reply after a delay
    if (activeChat.id === "1") {
      setTimeout(() => {
        const reply: Message = {
          id: `${activeChat.id}-${Date.now()}`,
          senderId: activeChat.id,
          text: "6:30 AM works great for me! See you at the usual spot.",
          timestamp: new Date(),
          read: false,
        };
        
        setMessages(prev => ({
          ...prev,
          [activeChat.id]: [...(prev[activeChat.id] || []), reply]
        }));
        
        setContacts(prev => 
          prev.map(c => 
            c.id === activeChat.id 
              ? { 
                  ...c, 
                  lastMessage: "6:30 AM works great for me! See you at the usual spot.", 
                  lastMessageTime: new Date(),
                  unread: (c.unread || 0) + 1
                }
              : c
          )
        );
        
        toast({
          title: "New message",
          description: `${activeChat.name}: 6:30 AM works great for me! See you at the usual spot.`,
        });
      }, 3000);
    }
  };
  
  const handleContactSelect = (contact: Contact) => {
    setActiveChat(contact);
    
    // Mark messages as read
    if (contact.unread) {
      const updatedContacts = contacts.map(c => 
        c.id === contact.id ? { ...c, unread: 0 } : c
      );
      setContacts(updatedContacts);
      
      if (messages[contact.id]) {
        const updatedMessages = {
          ...messages,
          [contact.id]: messages[contact.id].map(m => 
            m.senderId === contact.id ? { ...m, read: true } : m
          )
        };
        setMessages(updatedMessages);
      }
    }
  };
  
  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
        {/* Contacts sidebar */}
        <div className="w-full md:w-1/4 border-r border-border bg-white">
          <div className="p-4 border-b border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Plus className="h-5 w-5" />
              </Button>
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
            {filteredContacts.map(contact => (
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
                      {contact.lastMessageTime && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(contact.lastMessageTime, 'h:mm a')}
                        </span>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
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
                {messages[activeChat.id]?.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.senderId === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.senderId !== 'user' && (
                      <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                        <AvatarFallback className="bg-runher/10 text-runher text-xs">
                          {activeChat.name.split(' ').map(name => name[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div 
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === 'user' 
                          ? 'bg-runher text-white rounded-br-none'
                          : 'bg-secondary rounded-bl-none'
                      }`}
                    >
                      <p>{message.text}</p>
                      <div 
                        className={`text-xs mt-1 ${
                          message.senderId === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}
                      >
                        {format(message.timestamp, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
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
