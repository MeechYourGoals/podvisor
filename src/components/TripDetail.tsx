import { useState, useEffect } from "react";
import { TripTabs } from "./TripTabs";
import { Button } from "./ui/button";
import { ArrowLeft, Settings, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TripDetailProps {
  tripId: string;
  tripName?: string;
  memberCount?: number;
  currentUserId?: string;
  currentUserName?: string;
}

export function TripDetail({
  tripId,
  tripName = "Trip",
  memberCount = 1,
  currentUserId,
  currentUserName,
}: TripDetailProps) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-20 blur-3xl pointer-events-none"></div>

      {/* Content */}
      <div className="relative flex flex-col h-screen">
        {/* Header */}
        <div className="bg-background/80 backdrop-blur-sm border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{tripName}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Trip Content - Tabs with height constraint */}
        <div className="flex-1 overflow-hidden">
          <TripTabs
            tripId={tripId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </div>
    </div>
  );
}
