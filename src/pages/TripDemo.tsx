import { useState, useEffect } from "react";
import { TripDetail } from "@/components/TripDetail";
import { MobileTripDetail } from "@/components/MobileTripDetail";
import { useAuth } from "@/hooks/useAuth";

const TripDemo = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const tripProps = {
    tripId: "demo-trip-123",
    tripName: "Hawaii Vacation 2025",
    memberCount: 5,
    currentUserId: user?.id || "demo-user",
    currentUserName: user?.email?.split("@")[0] || "Demo User",
  };

  return isMobile ? (
    <MobileTripDetail {...tripProps} />
  ) : (
    <TripDetail {...tripProps} />
  );
};

export default TripDemo;
