import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  Search, 
  ExternalLink, 
  Eye, 
  Download, 
  Link2, 
  Trash2,
  MoreVertical,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Speaker {
  name: string;
  role: string;
}

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  video_id: string;
  analyzed_at: string;
  profile_used: string | null;
  is_favorite: boolean;
  tags: string[];
  speakers: Speaker[];
  content_sources: {
    source_name: string;
  } | null;
}

interface VideosTableProps {
  onVideoSelect: (videoId: string) => void;
  onBookmark: (videoId: string) => void;
  refreshTrigger?: number;
}

const VideosTable = ({ onVideoSelect, onBookmark, refreshTrigger }: VideosTableProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { toast } = useToast();

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          youtube_url,
          video_id,
          analyzed_at,
          profile_used,
          is_favorite,
          tags,
          speakers,
          content_sources (
            source_name
          )
        `)
        .order("analyzed_at", { ascending: false });

      if (error) throw error;
      setVideos((data as any) || []);
    } catch (error) {
      console.error("Error loading videos:", error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();

    const channel = supabase
      .channel("videos-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "videos",
        },
        () => {
          loadVideos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const handleToggleFavorite = async (videoId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("videos")
        .update({ is_favorite: !currentState })
        .eq("id", videoId);

      if (error) throw error;

      setVideos(prev =>
        prev.map(v => (v.id === videoId ? { ...v, is_favorite: !currentState } : v))
      );

      toast({
        title: !currentState ? "Added to favorites" : "Removed from favorites",
        description: !currentState ? "Video saved to your favorites" : "Video removed from favorites",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (error) throw error;

      toast({
        title: "Video deleted",
        description: "The video analysis has been removed",
      });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "YouTube link copied to clipboard",
    });
  };

  const handleExport = (video: Video) => {
    const dataStr = JSON.stringify(video, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${video.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTagClick = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const removeTag = (tag: string) => {
    setActiveTags(prev => prev.filter(t => t !== tag));
  };

  const clearAllTags = () => {
    setActiveTags([]);
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags =
      activeTags.length === 0 ||
      activeTags.every(tag => video.tags?.includes(tag));
    const matchesFavorites = !showFavoritesOnly || video.is_favorite;
    return matchesSearch && matchesTags && matchesFavorites;
  });

  const getPrimarySpeakers = (speakers: Speaker[]) => {
    if (!speakers || speakers.length === 0) return "Unknown";
    const primary = speakers.filter(s => 
      s.role === "interviewee" || s.role === "guest"
    );
    if (primary.length > 0) {
      return primary.map(s => s.name).join(", ");
    }
    return speakers[0].name;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-2">No videos analyzed yet.</p>
        <p className="text-sm text-muted-foreground">Try analyzing a video above to see it here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="gap-2"
        >
          <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
          Favorites
        </Button>
      </div>

      {/* Active Tags */}
      {activeTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeTags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAllTags}>
            Clear all
          </Button>
        </div>
      )}

      {/* Videos List */}
      <Card>
        <div className="divide-y divide-border">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <img
                  src={`https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`}
                  alt={video.title}
                  className="w-32 h-20 object-cover rounded"
                />

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title & Date */}
                  <div>
                    <h3 className="font-medium text-base line-clamp-1">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(video.analyzed_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Company/Source & Speakers */}
                  <div className="flex gap-6 text-sm">
                    {video.content_sources?.source_name && (
                      <div>
                        <span className="text-muted-foreground">Source: </span>
                        <span>{video.content_sources.source_name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Speaker(s): </span>
                      <span>{getPrimarySpeakers(video.speakers)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                          onClick={() => handleTagClick(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFavorite(video.id, video.is_favorite)}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        video.is_favorite
                          ? "fill-red-500 text-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => window.open(video.youtube_url, "_blank")}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Watch Now
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onVideoSelect(video.id)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport(video)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export Episode
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyLink(video.youtube_url)}
                        className="gap-2"
                      >
                        <Link2 className="h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(video.id)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Analysis
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {filteredVideos.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No videos match your current filters.
          </p>
        </Card>
      )}
    </div>
  );
};

export default VideosTable;
