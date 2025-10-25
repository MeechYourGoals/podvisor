import { useEffect, useRef, useCallback } from "react";
import { List, useListRef, type RowComponentProps } from "react-window";
import { LazyMedia } from "./LazyMedia";

export interface ChatMessage {
  id: string;
  text: string;
  url?: string;
  type: "text" | "image" | "video";
  alt?: string;
  timestamp: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

interface VirtualizedMessageContainerProps {
  messages: ChatMessage[];
  currentUserId?: string;
  onScrollToBottom?: () => void;
}

export function VirtualizedMessageContainer({
  messages,
  currentUserId,
  onScrollToBottom,
}: VirtualizedMessageContainerProps) {
  const listRef = useListRef();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && listRef[0]) {
      setTimeout(() => {
        listRef[0]?.scrollToRow({ align: "end", index: messages.length - 1 });
        onScrollToBottom?.();
      }, 100);
    }
  }, [messages.length, listRef, onScrollToBottom]);

  // Message row renderer
  const MessageRow = useCallback(
    ({ index, style }: RowComponentProps) => {
      const msg = messages[index];
      if (!msg) return null;

      const isCurrentUser = msg.userId === currentUserId;

      return (
        <div
          style={style}
          className={`px-4 py-2 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`flex flex-col gap-1 max-w-[80%] ${
              isCurrentUser ? "items-end" : "items-start"
            }`}
          >
            {/* User name */}
            {!isCurrentUser && msg.userName && (
              <div className="text-xs text-muted-foreground font-medium px-3">
                {msg.userName}
              </div>
            )}

            {/* Message content */}
            <div
              className={`rounded-2xl px-4 py-2 ${
                isCurrentUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.type === "text" && (
                <div className="text-sm break-words">{msg.text}</div>
              )}

              {(msg.type === "image" || msg.type === "video") && (
                <div>
                  <LazyMedia
                    src={msg.url || ""}
                    type={msg.type}
                    alt={msg.alt}
                    className="max-h-[300px] object-cover rounded-lg"
                  />
                  {msg.text && (
                    <p className="text-sm mt-2">{msg.text}</p>
                  )}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground px-3">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      );
    },
    [messages, currentUserId]
  );

  // Calculate container height
  const containerHeight =
    typeof window !== "undefined" ? window.innerHeight - 180 : 600;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto max-h-full scroll-smooth -webkit-overflow-scrolling-touch"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        </div>
      ) : (
        <List
          listRef={listRef}
          defaultHeight={containerHeight}
          rowCount={messages.length}
          rowHeight={100} // average message height
          rowComponent={MessageRow}
          rowProps={{}}
        />
      )}
    </div>
  );
}
