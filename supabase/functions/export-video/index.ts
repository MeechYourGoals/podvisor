import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Video {
  id: string;
  title: string;
  youtube_url: string;
  video_id: string;
  analyzed_at: string;
  profile_used: string;
  speakers: any[];
  tags: string[];
}

interface Insight {
  category: string;
  insight_text: string;
  impact_score: number;
  actionability_score: number;
}

interface PersonalizedInsight {
  insight_text: string;
  relevance_score: number;
  action_items: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { videoId, format } = await req.json();

    if (!videoId || !format) {
      return new Response(JSON.stringify({ error: 'Missing videoId or format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch video with insights
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (videoError || !video) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: insights } = await supabase
      .from('insights')
      .select('*')
      .eq('video_id', videoId);

    const { data: personalizedInsights } = await supabase
      .from('personalized_insights')
      .select('*')
      .eq('video_id', videoId);

    let content = '';
    let contentType = 'text/plain';
    let filename = `${video.title.replace(/[^a-z0-9]/gi, '_')}_export`;

    switch (format) {
      case 'json':
        content = JSON.stringify({
          video,
          insights: insights || [],
          personalized_insights: personalizedInsights || [],
        }, null, 2);
        contentType = 'application/json';
        filename += '.json';
        break;

      case 'csv':
        const csvRows = [
          ['Video Title', 'URL', 'Analyzed At', 'Profile Used', 'Insight Category', 'Insight Text', 'Impact Score', 'Actionability Score']
        ];
        
        (insights || []).forEach((insight: Insight) => {
          csvRows.push([
            video.title,
            video.youtube_url,
            video.analyzed_at,
            video.profile_used || 'N/A',
            insight.category,
            insight.insight_text.replace(/"/g, '""'),
            insight.impact_score?.toString() || 'N/A',
            insight.actionability_score?.toString() || 'N/A',
          ]);
        });

        content = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        contentType = 'text/csv';
        filename += '.csv';
        break;

      case 'markdown':
        content = `# ${video.title}\n\n`;
        content += `**URL:** ${video.youtube_url}\n`;
        content += `**Analyzed:** ${new Date(video.analyzed_at).toLocaleDateString()}\n`;
        content += `**Profile Used:** ${video.profile_used || 'Default'}\n\n`;
        
        if (video.speakers && video.speakers.length > 0) {
          content += `**Speakers:** ${video.speakers.join(', ')}\n\n`;
        }
        
        if (video.tags && video.tags.length > 0) {
          content += `**Tags:** ${video.tags.join(', ')}\n\n`;
        }

        content += `## Universal Insights\n\n`;
        (insights || []).forEach((insight: Insight) => {
          content += `### ${insight.category}\n`;
          content += `${insight.insight_text}\n\n`;
          content += `- **Impact Score:** ${insight.impact_score || 'N/A'}\n`;
          content += `- **Actionability:** ${insight.actionability_score || 'N/A'}\n\n`;
        });

        if (personalizedInsights && personalizedInsights.length > 0) {
          content += `## Personalized Insights\n\n`;
          (personalizedInsights).forEach((insight: PersonalizedInsight) => {
            content += `${insight.insight_text}\n\n`;
            if (insight.action_items && insight.action_items.length > 0) {
              content += `**Action Items:**\n`;
              insight.action_items.forEach((item: string) => {
                content += `- ${item}\n`;
              });
              content += `\n`;
            }
          });
        }

        contentType = 'text/markdown';
        filename += '.md';
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`Exported video ${videoId} as ${format} for user ${user.id}`);

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});