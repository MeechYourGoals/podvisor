import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ProfileProvider } from "./contexts/ProfileContext";

createRoot(document.getElementById("root")!).render(
  <ProfileProvider>
    <App />
  </ProfileProvider>
);
