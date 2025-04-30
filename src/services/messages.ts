import api from './api';

export interface Message {
  _id: string;
  conversation: string;
  sender: string;
  content: string;
  readBy: string[];
  createdAt: Date;
}

export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt: Date;
  isGroupChat: boolean;
  groupName?: string;
  createdAt: Date;
}

const messagesService = {
  // Conversations
  getConversations: () => 
    api.get<Conversation[]>('/api/messages/conversations'),
  
  getConversation: (conversationId: string) =>
    api.get<Conversation>(`/api/messages/conversations/${conversationId}`),
  
  createConversation: (participants: string[], isGroup: boolean = false, groupName?: string) =>
    api.post<Conversation>('/api/messages/conversations', {
      participants,
      isGroupChat: isGroup,
      groupName
    }),
  
  // Messages
  getMessages: (conversationId: string, limit = 50, before?: Date) =>
    api.get<Message[]>(`/api/messages/conversations/${conversationId}/messages`, {
      params: { limit, before }
    }),
  
  sendMessage: (conversationId: string, content: string) =>
    api.post<Message>(`/api/messages/conversations/${conversationId}/messages`, {
      content
    }),
  
  markAsRead: (conversationId: string, messageId: string) =>
    api.post(`/api/messages/conversations/${conversationId}/messages/${messageId}/read`),
  
  // Test Operations
  createTestConversation: () =>
    api.post('/api/messages/test-conversation'),

  // Group Operations
  addToGroup: (conversationId: string, userId: string) =>
    api.post(`/api/messages/conversations/${conversationId}/participants`, {
      userId
    }),
  
  removeFromGroup: (conversationId: string, userId: string) =>
    api.delete(`/api/messages/conversations/${conversationId}/participants/${userId}`),
  
  updateGroupName: (conversationId: string, groupName: string) =>
    api.put(`/api/messages/conversations/${conversationId}`, {
      groupName
    })
};

export default messagesService;
