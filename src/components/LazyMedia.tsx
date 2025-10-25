import { useState, useRef, useEffect } from "react";

interface LazyMediaProps {
  src: string;
  type: "image" | "video";
  alt?: string;
  className?: string;
}

export function LazyMedia({ src, type, alt = "", className = "" }: LazyMediaProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // preload before visible
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return (
      <div
        ref={ref}
        className={`bg-gray-100 animate-pulse rounded-md h-[200px] w-full ${className}`}
      />
    );
  }

  return type === "video" ? (
    <video
      controls
      src={src}
      className={`rounded-lg max-w-full ${className}`}
      preload="metadata"
    />
  ) : (
    <img 
      src={src} 
      alt={alt} 
      className={`rounded-lg max-w-full ${className}`} 
      loading="lazy" 
    />
  );
}
