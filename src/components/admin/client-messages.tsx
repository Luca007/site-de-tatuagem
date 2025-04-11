"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Image as ImageIcon, ArrowLeft, MessageSquare, X } from "lucide-react";
import { clientDb, getClientMessages, addClientMessage, updateClientMessage, deleteClientMessage, onClientMessagesSnapshot } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, limit, where } from "firebase/firestore";

// Demo data for development purposes
const DEMO_CLIENTS = [
  {
    id: "client1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    lastMessage: "Hi, I'd like to discuss my sleeve tattoo design.",
    lastMessageDate: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    unread: true,
    avatar: "/clients/sarah.jpg",
  },
  {
    id: "client2",
    name: "Michael Chen",
    email: "michael@example.com",
    lastMessage: "When is the earliest appointment available?",
    lastMessageDate: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    unread: false,
    avatar: "/clients/michael.jpg",
  },
  {
    id: "client3",
    name: "Emily Rodriguez",
    email: "emily@example.com",
    lastMessage: "Thanks for the design mockup, I love it!",
    lastMessageDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    unread: false,
    avatar: "/clients/emily.jpg",
  },
  {
    id: "client4",
    name: "David Thompson",
    email: "david@example.com",
    lastMessage: "I just booked my appointment for next Tuesday.",
    lastMessageDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    unread: false,
    avatar: "/clients/david.jpg",
  },
];

const DEMO_MESSAGES = {
  client1: [
    {
      id: "msg1",
      text: "Hi, I'd like to discuss my sleeve tattoo design.",
      sender: "client1",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
  ],
  client2: [
    {
      id: "msg2",
      text: "Hello! I'm interested in booking an appointment for a tattoo.",
      sender: "client2",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      read: true,
    },
    {
      id: "msg3",
      text: "I'm thinking of a geometric design on my forearm.",
      sender: "client2",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60),
      read: true,
    },
    {
      id: "msg4",
      text: "That sounds great! I have some availability next week to discuss your design in detail.",
      sender: "admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 - 1000 * 60 * 10),
      read: true,
    },
    {
      id: "msg5",
      text: "When is the earliest appointment available?",
      sender: "client2",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: true,
    },
  ],
  client3: [
    {
      id: "msg6",
      text: "Hi, I'm looking for a custom tattoo design.",
      sender: "client3",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
      read: true,
    },
    {
      id: "msg7",
      text: "Hello! I'd be happy to help with a custom design. What style are you interested in?",
      sender: "admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 30),
      read: true,
    },
    {
      id: "msg8",
      text: "I'm thinking something in watercolor style.",
      sender: "client3",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 15),
      read: true,
    },
    {
      id: "msg9",
      imageUrl: "/portfolio/tattoo4.jpg",
      sender: "admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 5),
      read: true,
    },
    {
      id: "msg10",
      text: "Thanks for the design mockup, I love it!",
      sender: "client3",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
    },
  ],
  client4: [
    {
      id: "msg11",
      text: "Hi, I'd like to book an appointment.",
      sender: "client4",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      read: true,
    },
    {
      id: "msg12",
      text: "I just booked my appointment for next Tuesday.",
      sender: "client4",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      read: true,
    },
  ],
};

interface Client {
  id: string;
  name: string;
  email: string;
  lastMessage: string;
  lastMessageDate: Date;
  unread: boolean;
  avatar?: string;
}

interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: string;
  timestamp: Date;
  read: boolean;
}

export default function ClientMessages() {
  const [clients, setClients] = useState<Client[]>(DEMO_CLIENTS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showChat, setShowChat] = useState(false); // For mobile view toggling
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from Firestore
    if (selectedClient) {
      const clientMessages = DEMO_MESSAGES[selectedClient.id as keyof typeof DEMO_MESSAGES] || [];
      setMessages(clientMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));

      // Mark all messages as read
      const updatedClients = clients.map(client =>
        client.id === selectedClient.id ? { ...client, unread: false } : client
      );
      setClients(updatedClients);
    }
  }, [selectedClient, clients]);

  useEffect(() => {
    const unsubscribe = onClientMessagesSnapshot((snapshot) => {
      const updatedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, []);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setShowChat(true);
  };

  const handleBackToClients = () => {
    setShowChat(false);
  };

  const handleSendMessage = async () => {
    if (!selectedClient || (!newMessage.trim() && !fileUpload)) return;

    setIsSending(true);

    try {
      // In a real app, this would save to Firestore
      const newMsg: Message = {
        id: `msg${Date.now()}`,
        text: newMessage.trim() || undefined,
        imageUrl: fileUpload ? URL.createObjectURL(fileUpload) : undefined,
        sender: "admin",
        timestamp: new Date(),
        read: false,
      };

      // Update messages state
      setMessages([...messages, newMsg]);

      // Update last message in clients list
      const updatedClients = clients.map(client => {
        if (client.id === selectedClient.id) {
          return {
            ...client,
            lastMessage: newMessage || "Image",
            lastMessageDate: new Date(),
            unread: false,
          };
        }
        return client;
      });

      setClients(updatedClients);
      setNewMessage("");
      setFileUpload(null);
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileUpload(e.target.files[0]);
    }
  };

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col md:flex-row h-[70vh] gap-4 border rounded-lg">
      {/* Client List */}
      <div
        className={`md:w-1/3 border-r overflow-y-auto ${showChat ? 'hidden md:block' : 'block'}`}
      >
        <div className="p-4 border-b">
          <h3 className="font-medium">Clients</h3>
          <p className="text-sm text-muted-foreground">
            {clients.filter(c => c.unread).length} unread message(s)
          </p>
        </div>
        <div className="divide-y">
          {clients.map((client) => (
            <div
              key={client.id}
              className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                client.unread ? 'bg-muted/30' : ''
              }`}
              onClick={() => handleClientSelect(client)}
            >
              <Avatar className="h-10 w-10">
                {client.avatar ? (
                  <AvatarImage src={client.avatar} alt={client.name} />
                ) : (
                  <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className={`font-medium truncate ${client.unread ? 'font-semibold' : ''}`}>
                    {client.name}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {getTimeAgo(client.lastMessageDate)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {client.lastMessage}
                </p>
              </div>
              {client.unread && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div
        className={`flex-1 flex flex-col ${!showChat ? 'hidden md:flex' : 'flex'}`}
      >
        {selectedClient ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={handleBackToClients}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                {selectedClient.avatar ? (
                  <AvatarImage src={selectedClient.avatar} alt={selectedClient.name} />
                ) : (
                  <AvatarFallback>{getInitials(selectedClient.name)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedClient.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'admin' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg p-3 ${
                        message.sender === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.text && <p className="text-sm">{message.text}</p>}
                      {message.imageUrl && (
                        <div className="rounded overflow-hidden mt-1">
                          <Image
                            src={message.imageUrl}
                            alt="Image message"
                            width={200}
                            height={150}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className="text-xs opacity-70 text-right mt-1">
                        {getTimeAgo(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t">
              {fileUpload && (
                <div className="mb-2 p-2 bg-muted rounded flex items-center justify-between">
                  <span className="text-sm truncate">{fileUpload.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setFileUpload(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shrink-0"
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Button>
                <Textarea
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] max-h-[150px]"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  className="rounded-full shrink-0 p-2 h-10 w-10"
                  disabled={isSending || (!newMessage.trim() && !fileUpload)}
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-muted rounded-full p-6 mb-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">Your Messages</h3>
            <p className="text-muted-foreground max-w-md">
              Select a client from the sidebar to view your conversation history
              and respond to messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
