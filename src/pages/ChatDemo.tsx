import { useState } from "react";
import Chat from "@/components/Chat";
import { ChatMessage } from "@/lib/chatStorage";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChatDemo = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hey! Welcome to the trip chat!",
      type: "text",
      timestamp: Date.now() - 3600000,
      userId: "user1",
      userName: "Sarah"
    },
    {
      id: "2",
      text: "So excited for this trip! 🎉",
      type: "text",
      timestamp: Date.now() - 3500000,
      userId: "user2",
      userName: "Mike"
    },
    {
      id: "3",
      text: "I've been looking at hotels. What do you all think about this one?",
      type: "text",
      timestamp: Date.now() - 3400000,
      userId: "user3",
      userName: "Emily"
    },
    {
      id: "4",
      text: "Here's a photo from last year's trip!",
      url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400",
      type: "image",
      alt: "Beach vacation",
      timestamp: Date.now() - 3300000,
      userId: "user1",
      userName: "Sarah"
    },
    {
      id: "5",
      text: "That looks amazing! Can't wait to make more memories",
      type: "text",
      timestamp: Date.now() - 3200000,
      userId: "user2",
      userName: "Mike"
    },
  ]);

  const handleSendMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      type: "text",
      timestamp: Date.now(),
      userId: "currentUser",
      userName: "You"
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 bg-gradient-mesh opacity-20 blur-3xl pointer-events-none"></div>
      
      <div className="relative flex flex-col h-screen">
        {/* Header */}
        <div className="bg-background border-b p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Trip to Hawaii</h1>
            <p className="text-sm text-muted-foreground">5 members</p>
          </div>
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <Chat
            messagesFromServer={messages}
            onSendMessage={handleSendMessage}
            tripId="demo-trip"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;
