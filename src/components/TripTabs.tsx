import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { TripChat } from "./TripChat";
import { MessageSquare, MapPin, Calendar, Users, Receipt } from "lucide-react";

interface TripTabsProps {
  tripId: string;
  currentUserId?: string;
  currentUserName?: string;
}

export function TripTabs({ tripId, currentUserId, currentUserName }: TripTabsProps) {
  const renderTabContent = (activeTab: string) => {
    switch (activeTab) {
      case "chat":
        return (
          <TripChat
            tripId={tripId}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        );
      case "itinerary":
        return (
          <div className="p-6 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Itinerary view coming soon</p>
          </div>
        );
      case "map":
        return (
          <div className="p-6 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Map view coming soon</p>
          </div>
        );
      case "travelers":
        return (
          <div className="p-6 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Travelers view coming soon</p>
          </div>
        );
      case "budget":
        return (
          <div className="p-6 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Budget view coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
      {/* Tab Headers */}
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
        <TabsTrigger
          value="chat"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </TabsTrigger>
        <TabsTrigger
          value="itinerary"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Itinerary
        </TabsTrigger>
        <TabsTrigger
          value="map"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Map
        </TabsTrigger>
        <TabsTrigger
          value="travelers"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Users className="h-4 w-4 mr-2" />
          Travelers
        </TabsTrigger>
        <TabsTrigger
          value="budget"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Budget
        </TabsTrigger>
      </TabsList>

      {/* Tab Content - CRITICAL HEIGHT CONSTRAINT */}
      {/* This is line ~140 where the fix is applied */}
      <div className="h-[calc(100vh-280px)] max-h-[800px] min-h-[400px] overflow-hidden">
        <TabsContent value="chat" className="h-full m-0 p-0">
          {renderTabContent("chat")}
        </TabsContent>
        <TabsContent value="itinerary" className="h-full m-0">
          {renderTabContent("itinerary")}
        </TabsContent>
        <TabsContent value="map" className="h-full m-0">
          {renderTabContent("map")}
        </TabsContent>
        <TabsContent value="travelers" className="h-full m-0">
          {renderTabContent("travelers")}
        </TabsContent>
        <TabsContent value="budget" className="h-full m-0">
          {renderTabContent("budget")}
        </TabsContent>
      </div>
    </Tabs>
  );
}
