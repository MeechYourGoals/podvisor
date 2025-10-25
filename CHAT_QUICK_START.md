# Chat Component - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Import the Component

```tsx
import Chat from "@/components/Chat";
import { ChatMessage } from "@/lib/chatStorage";
```

### 2. Add to Your Page

```tsx
function YourPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const handleSendMessage = (text: string) => {
    // Your logic to send message to server
    console.log("Sending:", text);
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Chat
        messagesFromServer={messages}
        onSendMessage={handleSendMessage}
        tripId="unique-id"
      />
    </div>
  );
}
```

### 3. Test It

Visit your page - you should see:
- Empty state message
- Input bar at bottom
- Ability to type and send messages

## 📋 Message Format

```typescript
const message: ChatMessage = {
  id: "unique-id",
  text: "Hello world!",
  type: "text",  // "text" | "image" | "video"
  timestamp: Date.now(),
  userId: "user-123",
  userName: "John Doe",
  
  // Optional for media
  url: "https://...",
  alt: "Description"
};
```

## 🔌 Connect to Supabase

```tsx
// Load messages on mount
useEffect(() => {
  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: true });
      
    setMessages(data || []);
  };
  
  loadMessages();
}, [tripId]);

// Real-time updates
useEffect(() => {
  const channel = supabase
    .channel(`trip-${tripId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `trip_id=eq.${tripId}`
      },
      (payload) => {
        setMessages(prev => [...prev, payload.new]);
      }
    )
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [tripId]);

// Send message
const handleSendMessage = async (text: string) => {
  await supabase.from('messages').insert({
    trip_id: tripId,
    user_id: currentUser.id,
    user_name: currentUser.name,
    text,
    type: 'text',
    timestamp: Date.now()
  });
};
```

## 🎨 Styling

The chat automatically adapts to your theme. To customize:

```tsx
<Chat
  className="your-custom-classes"
  messagesFromServer={messages}
  onSendMessage={handleSendMessage}
/>
```

## 🔧 Common Patterns

### Show Loading State

```tsx
{loading ? (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="animate-spin" />
  </div>
) : (
  <Chat messagesFromServer={messages} {...props} />
)}
```

### Empty State

The component handles this automatically. When `messages.length === 0`, it shows:
> "No messages yet. Start the conversation!"

### With Header

```tsx
<div className="h-screen flex flex-col">
  {/* Fixed Header */}
  <div className="p-4 border-b bg-background">
    <h1>Trip Chat</h1>
  </div>
  
  {/* Chat fills remaining space */}
  <div className="flex-1 overflow-hidden">
    <Chat {...props} />
  </div>
</div>
```

## 📱 Mobile Layout

Already optimized! Works perfectly on:
- ✅ iPhone Safari (notch support)
- ✅ Android Chrome
- ✅ iPad landscape/portrait
- ✅ Desktop browsers

## 🐛 Troubleshooting

### Messages not appearing?
Check: `messagesFromServer` prop is updating

### Scroll not working?
Ensure parent has `overflow: hidden`

### Input bar overlapping content?
Add `h-screen flex flex-col` to parent

### Build error?
Run: `npm install react-window idb`

## 📚 Advanced Features

### Send Images

```tsx
const message: ChatMessage = {
  id: nanoid(),
  text: "Check this out!",
  type: "image",
  url: "https://...",
  timestamp: Date.now(),
  userId: currentUser.id,
  userName: currentUser.name
};
```

### Clear Cache

```tsx
import { clearMessages } from "@/lib/chatStorage";

// Clear all cached messages
await clearMessages();
```

### Debug Mode

```tsx
// In Chat.tsx, add:
useEffect(() => {
  console.log("Messages:", messages.length);
}, [messages]);
```

## ✅ Checklist

Before deploying:
- [ ] Messages load from server
- [ ] Real-time updates working
- [ ] Send message works
- [ ] Tested on mobile device
- [ ] Offline mode works
- [ ] No console errors

## 🆘 Need Help?

See full documentation: [WEB_CHAT_IMPLEMENTATION.md](./WEB_CHAT_IMPLEMENTATION.md)

---

**Quick Test:** Visit `/chat-demo` to see it in action!
