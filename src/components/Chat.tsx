import React, { useEffect, useMemo, useRef, useState } from 'react';

export type ChatMessage = {
  id: string;
  text: string;
};

type ChatProps = {
  messages: ChatMessage[];
  onSend?: (text: string) => void;
  storageKey?: string; // key to persist scroll position
  className?: string; // extra classes for outer container
  renderMessage?: (message: ChatMessage, index: number) => React.ReactNode;
};

export default function Chat({
  messages,
  onSend,
  storageKey = 'chatScroll',
  className,
  renderMessage,
}: ChatProps) {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');

  // Derive a stable storage key in case multiple chats exist
  const scrollStorageKey = useMemo(() => `chatScroll:${storageKey}`, [storageKey]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  // Restore and persist scroll position
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const saved = localStorage.getItem(scrollStorageKey);
    if (saved) {
      const savedTop = parseInt(saved, 10);
      if (!Number.isNaN(savedTop)) {
        container.scrollTop = savedTop;
      }
    }

    const handleBeforeUnload = () => {
      localStorage.setItem(scrollStorageKey, String(container.scrollTop));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      localStorage.setItem(scrollStorageKey, String(container.scrollTop));
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [scrollStorageKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend?.(text);
    setDraft('');
    // Next tick scroll to bottom
    requestAnimationFrame(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });
  };

  return (
    <div className={["chat-container h-full", className].filter(Boolean).join(' ')}>
      <div
        ref={chatContainerRef}
        className="chat-messages px-4 py-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg, idx) => (
          <div key={msg.id} className="py-1">
            {renderMessage ? renderMessage(msg, idx) : (
              <div className="text-sm text-foreground/90">{msg.text}</div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input p-2 input-safe-bottom">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message"
            rows={1}
            className="min-h-[40px] max-h-40 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <button
            type="submit"
            className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            disabled={!draft.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
