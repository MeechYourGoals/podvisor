import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug: Check if env vars are loaded
console.log('ENV CHECK:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});

createRoot(document.getElementById("root")!).render(<App />);
