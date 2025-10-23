import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfileContext } from '@/contexts/ProfileContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Folder, Plus, Trash2, Youtube, FileText, Download, Globe, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface BookmarkFolder {
  id: string;
  folder_name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sort_order: number;
  profile_id: string | null;
}

interface BookmarkedVideo {
  id: string;
  video_id: string;
  folder_id: string | null;
  notes: string | null;
  created_at: string;
  videos: {
    id: string;
    title: string;
    video_id: string;
    youtube_url: string;
    experts: { name: string; domain: string } | null;
  };
}

interface BookmarkedInsight {
  id: string;
  insight_id: string;
  folder_id: string | null;
  notes: string | null;
  created_at: string;
  insights: {
    id: string;
    insight_text: string;
    category: string;
    impact_score: number;
  };
}

export const BookmarksSection = () => {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<BookmarkedVideo[]>([]);
  const [bookmarkedInsights, setBookmarkedInsights] = useState<BookmarkedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'global' | 'profile'>('global');
  const [subscription, setSubscription] = useState<any>(null);
  const { user } = useAuth();
  const { activeProfileId } = useProfileContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, viewMode, activeProfileId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load subscription data
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      setSubscription(subData);

      // Build folder query with profile filtering
      let folderQuery = (supabase as any)
        .from('bookmark_folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('sort_order');
      
      // Filter folders based on view mode
      if (viewMode === 'profile' && activeProfileId) {
        folderQuery = folderQuery.eq('profile_id', activeProfileId);
      } else if (viewMode === 'global') {
        folderQuery = folderQuery.is('profile_id', null);
      }

      const [foldersRes, videosRes, insightsRes] = await Promise.all([
        folderQuery,
        (supabase as any).from('bookmarked_videos').select(`
          id,
          video_id,
          folder_id,
          notes,
          created_at,
          videos (
            id,
            title,
            video_id,
            youtube_url,
            experts (name, domain)
          )
        `).eq('user_id', user?.id).order('created_at', { ascending: false }),
        (supabase as any).from('bookmarked_insights').select(`
          id,
          insight_id,
          folder_id,
          notes,
          created_at,
          insights (
            id,
            insight_text,
            category,
            impact_score
          )
        `).eq('user_id', user?.id).order('created_at', { ascending: false }),
      ]);

      setFolders(foldersRes.data || []);
      setBookmarkedVideos(videosRes.data || []);
      setBookmarkedInsights(insightsRes.data || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    // Check folder limit for free users
    if (subscription?.tier === 'free') {
      const foldersPerProfile = subscription.folders_per_profile || 2;
      const currentFolders = folders.filter(f => 
        viewMode === 'profile' 
          ? f.profile_id === activeProfileId 
          : f.profile_id === null
      ).length;
      
      if (currentFolders >= foldersPerProfile) {
        toast({
          title: "Folder limit reached",
          description: `Free tier: ${foldersPerProfile} folders per ${viewMode === 'profile' ? 'profile' : 'global'}. Upgrade to Pro for unlimited folders!`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const { error } = await (supabase as any)
        .from('bookmark_folders')
        .insert({
          user_id: user?.id,
          folder_name: newFolderName,
          description: newFolderDesc || null,
          profile_id: viewMode === 'profile' ? activeProfileId : null,
          color: '#6366f1',
          sort_order: folders.length,
        });

      if (error) throw error;

      toast({
        title: "Folder created!",
        description: `"${newFolderName}" has been added`,
      });

      setNewFolderName('');
      setNewFolderDesc('');
      setCreateFolderOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('bookmark_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast({
        title: "Folder deleted",
        description: "Bookmarks moved to 'Saved Items'",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string, type: 'video' | 'insight') => {
    try {
      const table = type === 'video' ? 'bookmarked_videos' : 'bookmarked_insights';
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Bookmark removed from your collection",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportFolder = (folderId: string | null) => {
    const folderVideos = bookmarkedVideos.filter(v => v.folder_id === folderId);
    const folderInsights = bookmarkedInsights.filter(i => i.folder_id === folderId);
    const folder = folders.find(f => f.id === folderId);

    const markdown = `# ${folder?.folder_name || 'Saved Items'}

${folder?.description ? `${folder.description}\n` : ''}

## Videos (${folderVideos.length})

${folderVideos.map(v => `
### ${v.videos.title}
- **Expert**: ${v.videos.experts?.name || 'Unknown'}
- **Domain**: ${v.videos.experts?.domain || 'Unknown'}
- **URL**: ${v.videos.youtube_url}
${v.notes ? `- **Notes**: ${v.notes}` : ''}
`).join('\n')}

## Insights (${folderInsights.length})

${folderInsights.map(i => `
### ${i.insights.category}
**Impact**: ${i.insights.impact_score}/10

${i.insights.insight_text}
${i.notes ? `\n**Notes**: ${i.notes}` : ''}
`).join('\n')}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(folder?.folder_name || 'saved-items').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "Folder exported as Markdown",
    });
  };

  if (!user) {
    return (
      <div className="space-y-4 text-center py-8">
        <Folder className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-base font-semibold mb-2">Save Videos & Insights</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create folders, bookmark videos, and organize insights. 
            Sign up to start building your knowledge library.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/auth')} 
          size="lg"
        >
          Sign Up to Save Bookmarks
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold mb-1">Saved Items</h3>
          <p className="text-sm text-muted-foreground">
            Your bookmarked videos and insights
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Saved Items</h3>
        <p className="text-sm text-muted-foreground">
          Your bookmarked videos and insights
        </p>
      </div>

      {/* View Mode Switcher */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'global' | 'profile')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">
            <Globe className="h-4 w-4 mr-2" />
            Global Folders
          </TabsTrigger>
          <TabsTrigger value="profile" disabled={!activeProfileId}>
            <User className="h-4 w-4 mr-2" />
            Profile Folders
            {activeProfileId && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {folders.filter(f => f.profile_id === activeProfileId).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Explanation text */}
      {viewMode === 'global' && (
        <p className="text-xs text-muted-foreground">
          Global folders are visible across all profiles
        </p>
      )}
      {viewMode === 'profile' && activeProfileId && (
        <p className="text-xs text-muted-foreground">
          These folders are specific to your active profile
        </p>
      )}
      {viewMode === 'profile' && !activeProfileId && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Select a profile to manage profile-specific folders
          </p>
        </div>
      )}

      <Tabs defaultValue="folders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="folders">
            <Folder className="h-4 w-4 mr-1" />
            Folders
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Youtube className="h-4 w-4 mr-1" />
            Videos ({bookmarkedVideos.length})
          </TabsTrigger>
          <TabsTrigger value="insights">
            <FileText className="h-4 w-4 mr-1" />
            Insights ({bookmarkedInsights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="folders" className="space-y-3 mt-4">
          <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
                <DialogDescription>
                  Organize your bookmarks into folders
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g., Business Strategies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="folder-desc">Description (Optional)</Label>
                  <Textarea
                    id="folder-desc"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    placeholder="What's this folder for?"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateFolder}>Create Folder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {folders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No folders yet. Create one to organize your bookmarks!
            </p>
          ) : (
            folders.map((folder) => {
              const videoCount = bookmarkedVideos.filter(v => v.folder_id === folder.id).length;
              const insightCount = bookmarkedInsights.filter(i => i.folder_id === folder.id).length;

              return (
                <Card key={folder.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: folder.color }}
                          />
                          {folder.folder_name}
                        </h4>
                        {folder.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {folder.description}
                          </p>
                        )}
                        <div className="flex gap-3 mt-2">
                          <Badge variant="secondary">{videoCount} videos</Badge>
                          <Badge variant="secondary">{insightCount} insights</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => exportFolder(folder.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {folder.folder_name !== 'Saved Items' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteFolder(folder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-3 mt-4">
          {bookmarkedVideos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No bookmarked videos yet. Click the bookmark icon on any video to save it!
            </p>
          ) : (
            bookmarkedVideos.map((bookmark) => (
              <Card key={bookmark.id}>
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${bookmark.videos.video_id}/default.jpg`}
                      alt=""
                      className="w-20 h-15 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {bookmark.videos.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {bookmark.videos.experts?.name}
                      </p>
                      {bookmark.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          "{bookmark.notes}"
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a 
                            href={bookmark.videos.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Watch
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveBookmark(bookmark.id, 'video')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-3 mt-4">
          {bookmarkedInsights.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No bookmarked insights yet. Click the bookmark icon on any insight to save it!
            </p>
          ) : (
            bookmarkedInsights.map((bookmark) => (
              <Card key={bookmark.id}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline">{bookmark.insights.category}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveBookmark(bookmark.id, 'insight')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm line-clamp-3">
                      {bookmark.insights.insight_text}
                    </p>
                    {bookmark.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        Note: "{bookmark.notes}"
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Impact: {bookmark.insights.impact_score}/10
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};