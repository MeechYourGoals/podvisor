import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL ?? 'https://wnbybsgjdmguzviivpaj.supabase.co'),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduYnlic2dqZG1ndXp2aWl2cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjQzODcsImV4cCI6MjA3NTcwMDM4N30.sKrOB2w9MUMDZbGOVxZvU-5VNhODIev34vgCIEHG5S8'),
      'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(env.VITE_SUPABASE_PROJECT_ID ?? 'wnbybsgjdmguzviivpaj'),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'supabase': ['@supabase/supabase-js'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
