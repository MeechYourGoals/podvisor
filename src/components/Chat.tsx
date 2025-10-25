import { useEffect, useRef, useState, useCallback } from "react";
import { List, useListRef, type RowComponentProps } from "react-window";
import { saveMessages, loadMessages, ChatMessage } from "@/lib/chatStorage";
import { LazyMedia } from "./LazyMedia";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatProps {
  messagesFromServer?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  tripId?: string;
  className?: string;
}

export default function Chat({ 
  messagesFromServer = [], 
  onSendMessage,
  tripId,
  className = ""
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const listRef = useListRef();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load cached messages on mount
  useEffect(() => {
    (async () => {
      const cached = await loadMessages();
      if (cached.length > 0) {
        setMessages(cached);
      }
    })();
  }, []);

  // Save and update messages when server sends new data
  useEffect(() => {
    if (messagesFromServer.length > 0) {
      setMessages(messagesFromServer);
      saveMessages(messagesFromServer);
      
      // Auto-scroll to bottom on new messages
      setTimeout(() => {
        if (listRef[0]) {
          listRef[0].scrollToRow({ align: "end", index: messagesFromServer.length - 1 });
        }
      }, 100);
    }
  }, [messagesFromServer, listRef]);

  // Restore scroll position on reload
  useEffect(() => {
    const container = chatContainerRef.current;
    const savedScroll = localStorage.getItem(`chatScroll-${tripId || 'default'}`);
    
    if (container && savedScroll) {
      container.scrollTop = parseInt(savedScroll, 10);
    }
    
    return () => {
      if (container) {
        localStorage.setItem(
          `chatScroll-${tripId || 'default'}`, 
          container.scrollTop.toString()
        );
      }
    };
  }, [tripId]);

  // Online/offline detection
  useEffect(() => {
    const updateStatus = () => {
      const online = navigator.onLine;
      setIsOffline(!online);
      
      if (online) {
        toast({
          title: "Back online",
          description: "Connection restored",
        });
      } else {
        toast({
          title: "Offline Mode",
          description: "Viewing cached messages",
          variant: "destructive",
        });
      }
    };
    
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [toast]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;
    
    if (isOffline) {
      toast({
        title: "Offline",
        description: "Cannot send messages while offline",
        variant: "destructive",
      });
      return;
    }
    
    if (onSendMessage) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  }, [inputValue, isOffline, onSendMessage, toast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Virtualized row renderer
  const MessageRow = useCallback(
    ({ index, style }: RowComponentProps) => {
      const msg = messages[index];
      if (!msg) return null;

      return (
        <div style={style} className="px-4 py-2">
          <div className="flex flex-col gap-1">
            {msg.userName && (
              <div className="text-xs text-muted-foreground font-medium">
                {msg.userName}
              </div>
            )}
            
            {msg.type === "text" && (
              <div className="text-sm bg-muted rounded-lg px-3 py-2 max-w-[80%] break-words">
                {msg.text}
              </div>
            )}
            
            {(msg.type === "image" || msg.type === "video") && (
              <div className="max-w-[80%]">
                <LazyMedia 
                  src={msg.url || ""} 
                  type={msg.type} 
                  alt={msg.alt} 
                  className="max-h-[300px] object-cover"
                />
                {msg.text && (
                  <p className="text-sm mt-1 text-muted-foreground">{msg.text}</p>
                )}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      );
    },
    [messages]
  );

  // Calculate container height (viewport - header - input)
  const containerHeight = typeof window !== "undefined" 
    ? window.innerHeight - 120 
    : 600;

  return (
    <div className={`chat-container flex flex-col h-screen ${className}`}>
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-yellow-200 text-yellow-900 text-center p-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Offline Mode – viewing cached messages
        </div>
      )}

      {/* Chat Messages - Virtualized Scroll Container */}
      <div
        ref={chatContainerRef}
        className="chat-messages flex-1 overflow-y-auto scroll-smooth bg-background"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <List
            listRef={listRef}
            defaultHeight={containerHeight}
            rowCount={messages.length}
            rowHeight={80} // average message height
            rowComponent={MessageRow}
            rowProps={{}}
            className="scrollbar-thin"
          />
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Chat Input - Fixed Bottom */}
      <div className="chat-input border-t bg-background sticky bottom-0 z-10 input-safe-bottom">
        <div className="flex gap-2 p-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isOffline ? "Offline - can't send" : "Type a message..."}
            disabled={isOffline}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isOffline}
            size="icon"
          >
            {isOffline ? <WifiOff className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
