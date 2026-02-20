import { useState } from "react";
import { TripChat } from "./TripChat";
import { BudgetTab } from "./BudgetTab";
import { Button } from "./ui/button";
import { ArrowLeft, Menu, MapPin, Calendar, Users, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface MobileTripDetailProps {
  tripId: string;
  tripName?: string;
  memberCount?: number;
  currentUserId?: string;
  currentUserName?: string;
}

export function MobileTripDetail({
  tripId,
  tripName = "Trip",
  memberCount = 1,
  currentUserId,
  currentUserName,
}: MobileTripDetailProps) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"chat" | "itinerary" | "map" | "travelers" | "budget">("chat");

  const renderView = () => {
    switch (activeView) {
      case "chat":
        return (
          <div className="h-[calc(100vh-140px)]">
            <TripChat
              tripId={tripId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>
        );
      case "budget":
        return (
          <div className="h-[calc(100vh-140px)] overflow-auto">
            <BudgetTab
              tripId={tripId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>
        );
      default:
        return (
          <div className="p-6 text-center text-muted-foreground">
            <p>View coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="relative mobile-min-h-screen bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-20 blur-3xl pointer-events-none"></div>

      {/* Content */}
      <div className="relative flex flex-col mobile-h-screen">
        {/* Mobile Header */}
        <div className="bg-background/80 backdrop-blur-sm border-b p-4 pt-safe flex items-center justify-between">
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
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Trip Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setActiveView("chat")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Travelers
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setActiveView("itinerary")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Itinerary
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setActiveView("map")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View Map
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setActiveView("budget")}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Budget
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="bg-background/80 backdrop-blur-sm border-t pb-safe">
          <div className="flex justify-around p-2">
            <Button
              variant={activeView === "chat" ? "default" : "ghost"}
              size="sm"
              className="flex-col h-auto py-2"
              onClick={() => setActiveView("chat")}
            >
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">Chat</span>
            </Button>
            <Button
              variant={activeView === "itinerary" ? "default" : "ghost"}
              size="sm"
              className="flex-col h-auto py-2"
              onClick={() => setActiveView("itinerary")}
            >
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-xs">Plan</span>
            </Button>
            <Button
              variant={activeView === "map" ? "default" : "ghost"}
              size="sm"
              className="flex-col h-auto py-2"
              onClick={() => setActiveView("map")}
            >
              <MapPin className="h-5 w-5 mb-1" />
              <span className="text-xs">Map</span>
            </Button>
            <Button
              variant={activeView === "budget" ? "default" : "ghost"}
              size="sm"
              className="flex-col h-auto py-2"
              onClick={() => setActiveView("budget")}
            >
              <Receipt className="h-5 w-5 mb-1" />
              <span className="text-xs">Budget</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
