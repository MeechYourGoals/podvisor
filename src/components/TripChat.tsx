import { useState, useEffect } from "react";
import { VirtualizedMessageContainer, ChatMessage } from "./VirtualizedMessageContainer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Image, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveMessages, loadMessages } from "@/lib/chatStorage";

interface TripChatProps {
  tripId: string;
  currentUserId?: string;
  currentUserName?: string;
  onSendMessage?: (message: Omit<ChatMessage, "id" | "timestamp">) => Promise<void>;
  className?: string;
}

export function TripChat({
  tripId,
  currentUserId,
  currentUserName = "You",
  onSendMessage,
  className = "",
}: TripChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);
  const { toast } = useToast();

  // Load messages on mount
  useEffect(() => {
    const loadTripMessages = async () => {
      const cached = await loadMessages();
      if (cached.length > 0) {
        setMessages(cached);
      }
      // TODO: Load from Supabase here
    };

    loadTripMessages();
  }, [tripId]);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    setSending(true);

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text: inputValue,
      type: "text",
      timestamp: Date.now(),
      userId: currentUserId,
      userName: currentUserName,
    };

    try {
      // Optimistic update
      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");

      // Call parent callback if provided
      if (onSendMessage) {
        await onSendMessage({
          text: newMessage.text,
          type: newMessage.type,
          userId: newMessage.userId,
          userName: newMessage.userName,
        });
      }

      // TODO: Send to Supabase realtime here
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send",
        description: "Please try again",
        variant: "destructive",
      });
      // Remove optimistic update on error
      setMessages((prev) => prev.filter((m) => m.id !== newMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Chat Shell - Critical: flex-1 min-h-0 to enable scrolling */}
      <div className="mx-4 mb-0 sm:mb-2 rounded-2xl border border-white/10 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Messages Container - This will scroll */}
        <VirtualizedMessageContainer
          messages={messages}
          currentUserId={currentUserId}
          onScrollToBottom={() => setShowNewMessageBadge(false)}
        />

        {/* New Messages Badge */}
        {showNewMessageBadge && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full shadow-lg"
              onClick={() => {
                setShowNewMessageBadge(false);
                // Scroll to bottom
              }}
            >
              New messages ↓
            </Button>
          </div>
        )}

        {/* Input Area - Fixed at bottom */}
        <div className="border-t border-white/10 bg-black/20 p-3 input-safe-bottom">
          <div className="flex gap-2 items-center">
            {/* Attachment buttons */}
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              disabled={sending}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              disabled={sending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Message input */}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 bg-white/5 border-white/10 focus-visible:ring-primary"
            />

            {/* Send button */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || sending}
              size="icon"
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
