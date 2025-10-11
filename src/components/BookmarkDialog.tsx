import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Folder } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId?: string;
  insightId?: string;
  type: 'video' | 'insight';
}

interface Folder {
  id: string;
  folder_name: string;
  color: string;
  icon: string | null;
}

export const BookmarkDialog = ({ open, onOpenChange, videoId, insightId, type }: BookmarkDialogProps) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadFolders();
      loadExistingBookmarks();
    }
  }, [open, videoId, insightId]);

  const loadFolders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookmark_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadExistingBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (type === 'video' && videoId) {
        // Check if video is already bookmarked
        const { data: bookmarkedVideo } = await supabase
          .from('bookmarked_videos')
          .select('id')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .maybeSingle();

        if (bookmarkedVideo) {
          // Load folders this video is in
          const { data: folderLinks } = await supabase
            .from('bookmarked_videos_folders')
            .select('folder_id')
            .eq('bookmarked_video_id', bookmarkedVideo.id);

          if (folderLinks) {
            setSelectedFolders(folderLinks.map(link => link.folder_id));
          }
        }
      } else if (type === 'insight' && insightId) {
        const { data: bookmarkedInsight } = await supabase
          .from('bookmarked_insights')
          .select('folder_id')
          .eq('insight_id', insightId)
          .maybeSingle();

        if (bookmarkedInsight?.folder_id) {
          setSelectedFolders([bookmarkedInsight.folder_id]);
        }
      }
    } catch (error) {
      console.error('Error loading existing bookmarks:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookmark_folders')
        .insert({
          user_id: user.id,
          folder_name: newFolderName,
          color: newFolderColor,
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [data, ...prev]);
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast({
        title: "Folder created",
        description: "New bookmark folder created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleFolder = (folderId: string) => {
    setSelectedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleSave = async () => {
    if (selectedFolders.length === 0) {
      toast({
        title: "Select folders",
        description: "Please select at least one folder",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (type === 'video' && videoId) {
        // First, insert or get existing bookmarked_video
        const { data: existingBookmark } = await supabase
          .from('bookmarked_videos')
          .select('id')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .maybeSingle();

        let bookmarkedVideoId;
        if (existingBookmark) {
          bookmarkedVideoId = existingBookmark.id;
          // Delete existing folder links
          await supabase
            .from('bookmarked_videos_folders')
            .delete()
            .eq('bookmarked_video_id', bookmarkedVideoId);
        } else {
          const { data: newBookmark, error: bookmarkError } = await supabase
            .from('bookmarked_videos')
            .insert({
              user_id: user.id,
              video_id: videoId,
            })
            .select()
            .single();

          if (bookmarkError) throw bookmarkError;
          bookmarkedVideoId = newBookmark.id;
        }

        // Insert new folder links
        const folderLinks = selectedFolders.map(folderId => ({
          bookmarked_video_id: bookmarkedVideoId,
          folder_id: folderId,
        }));

        const { error: linkError } = await supabase
          .from('bookmarked_videos_folders')
          .insert(folderLinks);

        if (linkError) throw linkError;

      } else if (type === 'insight' && insightId) {
        // For insights, use the first selected folder (single folder support for now)
        const { error } = await supabase
          .from('bookmarked_insights')
          .upsert({
            user_id: user.id,
            insight_id: insightId,
            folder_id: selectedFolders[0],
          }, {
            onConflict: 'insight_id,user_id'
          });

        if (error) throw error;
      }

      toast({
        title: "Bookmarked!",
        description: `${type === 'video' ? 'Video' : 'Insight'} saved to ${selectedFolders.length} folder(s)`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Bookmarks</DialogTitle>
          <DialogDescription>
            Choose which folders to save this {type} to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isCreatingFolder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingFolder(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Folder
            </Button>
          )}

          {isCreatingFolder && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Label className="text-sm">Color:</Label>
                <Input
                  type="color"
                  value={newFolderColor}
                  onChange={(e) => setNewFolderColor(e.target.value)}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateFolder}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingFolder(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No folders yet. Create one to get started!
              </p>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => handleToggleFolder(folder.id)}
                >
                  <Checkbox
                    checked={selectedFolders.includes(folder.id)}
                    onCheckedChange={() => handleToggleFolder(folder.id)}
                  />
                  <Folder className="h-4 w-4" style={{ color: folder.color }} />
                  <Label className="flex-1 cursor-pointer">{folder.folder_name}</Label>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || selectedFolders.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};