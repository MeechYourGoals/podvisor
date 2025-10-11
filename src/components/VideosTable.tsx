import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Bookmark, Youtube, Search, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  video_id: string;
  thumbnail_url: string | null;
  analyzed_at: string;
  status: string;
  experts: { name: string; domain: string } | null;
  content_sources: { source_name: string } | null;
}

interface VideosTableProps {
  onVideoSelect: (videoId: string) => void;
  onBookmark: (videoId: string) => void;
  refreshTrigger?: number;
}

const VideosTable = ({ onVideoSelect, onBookmark, refreshTrigger }: VideosTableProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadVideos();
      subscribeToVideos();
    }
  }, [user, refreshTrigger]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('videos')
        .select(`
          id,
          title,
          youtube_url,
          video_id,
          thumbnail_url,
          analyzed_at,
          status,
          experts (name, domain),
          content_sources (source_name)
        `)
        .eq('user_id', user?.id)
        .order('analyzed_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToVideos = () => {
    const channel = supabase
      .channel('videos_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'videos',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        loadVideos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = domainFilter === 'all' || video.experts?.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Videos</CardTitle>
          <CardDescription>No videos analyzed yet. Start by analyzing a YouTube video above!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-primary" />
              Your Videos ({filteredVideos.length})
            </CardTitle>
            <CardDescription>Analyzed videos and insights</CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="health_fitness">Health</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="education">Education</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Expert</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos.map((video) => (
                <TableRow key={video.id} className="hover:bg-muted/50">
                  <TableCell>
                    <img
                      src={`https://img.youtube.com/vi/${video.video_id}/default.jpg`}
                      alt=""
                      className="w-12 h-9 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {video.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{video.experts?.name || 'Unknown'}</span>
                      {video.experts?.domain && (
                        <Badge variant="outline" className="w-fit text-xs">
                          {video.experts.domain.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {video.content_sources?.source_name || 'YouTube'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={video.status === 'completed' ? 'default' : 'destructive'}>
                      {video.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(video.analyzed_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onVideoSelect(video.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onBookmark(video.id)}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideosTable;