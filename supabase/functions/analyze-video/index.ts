import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, profileId } = await req.json();
    
    console.log('Analyzing video:', videoUrl, 'with profile:', profileId);

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: 'Video URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract YouTube video ID
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get video metadata from YouTube oEmbed
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedResponse = await fetch(oembedUrl);
    const oembedData = await oembedResponse.json();
    
    const videoTitle = oembedData.title;
    const channelName = oembedData.author_name;

    console.log('Video metadata:', { videoTitle, channelName });

    // Get user profile if provided, otherwise get default profile
    let userProfile = null;
    let profileUsed = 'default';
    
    if (profileId) {
      const { data } = await supabase
        .from('user_context_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      userProfile = data;
      profileUsed = userProfile?.profile_name || 'default';
      console.log('Using custom profile:', userProfile);
    } else {
      // Try to fetch default profile
      const { data: { user } } = await supabase.auth.getUser(
        req.headers.get('authorization')?.replace('Bearer ', '') || ''
      );
      
      if (user) {
        const { data: defaultProfile } = await supabase
          .from('user_default_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (defaultProfile) {
          userProfile = {
            profile_name: 'Default Profile',
            category: 'general',
            role_description: defaultProfile.description,
            experience_level: 'varied',
            goals: 'General learning and improvement',
            challenges: 'Various'
          };
          console.log('Using default profile:', defaultProfile.description);
        }
      }
    }

    // Build AI prompt
    const systemPrompt = `You are an expert at extracting actionable insights from expert videos across ALL domains - business, sports, health, education, creative, technology, finance, and personal development.

Your task is to deeply analyze video content and extract comprehensive, actionable insights that can help someone improve in that domain.

CRITICAL REQUIREMENTS:
- Extract EXACTLY 10 tactical insights ranked by actionability (1-10) and impact (1-10)
- Each insight must be 3-4 sentences with specific context and examples
- Extract the expert's name, domain, credentials, and achievements
- If user profile is provided, generate EXACTLY 5 personalized insights relevant to their context
- Use actual data from the video - DO NOT provide mock or placeholder content
- If you cannot access the video content, return an error`;

    const userPrompt = `Analyze this video:
URL: ${videoUrl}
Title: ${videoTitle}
Source: ${channelName}

${userProfile ? `
USER CONTEXT:
- Profile: ${userProfile.profile_name}
- Category: ${userProfile.category}
- Role: ${userProfile.role_description}
- Experience: ${userProfile.experience_level}
- Goals: ${userProfile.goals}
- Challenges: ${userProfile.challenges}
` : ''}

INSTRUCTIONS:
1. Analyze the video content and extract real insights
2. Identify the expert(s) and their domain/credentials
3. Extract EXACTLY 10 tactical, actionable insights with specific context
4. ${userProfile ? 'Generate EXACTLY 5 personalized insights tailored to the user\'s profile' : 'Skip personalized insights'}
5. Rank insights by actionability (1-10) and impact (1-10)
6. Include expert attribution for each insight
7. Categorize insights (e.g., Strategy, Execution, Mindset, Technical, Nutrition, Training, etc.)`;

    // Call Lovable AI with tool calling
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_video_data",
            description: "Extract structured data from expert video",
            parameters: {
              type: "object",
              properties: {
                source_name: { type: "string", description: "YouTube channel or series name" },
                source_type: { type: "string", enum: ["youtube_channel", "podcast", "course", "conference"] },
                expert: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    domain: { type: "string", description: "business, sports, health, education, creative, technology, finance, personal_development, other" },
                    credentials: { type: "string" },
                    current_role: { type: "string" },
                    achievements: { type: "string" }
                  },
                  required: ["name", "domain"]
                },
                speakers: {
                  type: "array",
                  description: "Array of speakers with their roles. Identify PRIMARY speakers (interviewees/guests) vs hosts. For interviews, focus on the person being interviewed, not the host.",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Full name of the speaker" },
                      role: { type: "string", enum: ["interviewee", "host", "panelist", "guest"], description: "Role of the speaker" }
                    },
                    required: ["name", "role"]
                  },
                  minItems: 1
                },
                tags: {
                  type: "array",
                  description: "3-7 smart tags for categorization (e.g., 'Psychology', 'Interview', 'Leadership')",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 7
                },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      insight_text: { type: "string", description: "3-4 sentences with specific context" },
                      category: { type: "string" },
                      impact_score: { type: "integer", minimum: 1, maximum: 10 },
                      actionability_score: { type: "integer", minimum: 1, maximum: 10 },
                      expert_attribution: { type: "string" }
                    },
                    required: ["insight_text", "impact_score", "actionability_score"]
                  },
                  minItems: 10,
                  maxItems: 10
                },
                personalized_insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      personalized_text: { type: "string" },
                      relevance_score: { type: "integer", minimum: 1, maximum: 10 },
                      action_items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            action: { type: "string" },
                            timeline: { type: "string" },
                            difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                          }
                        }
                      }
                    }
                  },
                  minItems: 0,
                  maxItems: 5
                }
              },
              required: ["source_name", "expert", "speakers", "tags", "insights"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_video_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze video with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in AI response');
      return new Response(
        JSON.stringify({ error: 'AI did not provide structured data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', extractedData);

    // Store in database
    // 1. Create or find content source
    const { data: existingSource } = await supabase
      .from('content_sources')
      .select('id')
      .eq('source_url', videoUrl)
      .single();

    let sourceId = existingSource?.id;
    if (!sourceId) {
      const { data: newSource } = await supabase
        .from('content_sources')
        .insert({
          source_type: 'youtube',
          source_url: videoUrl,
          source_name: channelName
        })
        .select('id')
        .single();
      sourceId = newSource?.id;
    }

    // 2. Create or find expert
    const { data: existingExpert } = await supabase
      .from('experts')
      .select('id')
      .eq('name', extractedData.expert.name)
      .single();

    let expertId = existingExpert?.id;
    if (!expertId) {
      const { data: newExpert } = await supabase
        .from('experts')
        .insert({
          name: extractedData.expert.name,
          credentials: extractedData.expert.credentials,
          domain: extractedData.expert.domain
        })
        .select('id')
        .single();
      expertId = newExpert?.id;
    }

    // 3. Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token || '');

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create video record
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        title: videoTitle,
        youtube_url: videoUrl,
        video_id: videoId,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        source_id: sourceId,
        expert_id: expertId,
        status: 'completed',
        profile_used: profileUsed,
        speakers: extractedData.speakers || [],
        tags: extractedData.tags || [],
        is_favorite: false
      })
      .select('id')
      .single();

    if (videoError) {
      console.error('Error creating video:', videoError);
      return new Response(
        JSON.stringify({ error: 'Failed to save video' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Insert insights
    const insightsToInsert = extractedData.insights.map((insight: any) => ({
      video_id: video.id,
      category: insight.category?.toLowerCase().replace(/\s+/g, '_') || 'general',
      insight_text: insight.insight_text,
      impact_score: insight.impact_score,
      actionability_score: insight.actionability_score,
      profile_used: profileUsed
    }));

    const { error: insightsError } = await supabase
      .from('insights')
      .insert(insightsToInsert);

    if (insightsError) {
      console.error('Error inserting insights:', insightsError);
    }

    // 6. Insert personalized insights if profile provided
    if (userProfile && extractedData.personalized_insights?.length > 0) {
      const personalizedToInsert = extractedData.personalized_insights.map((pInsight: any) => ({
        video_id: video.id,
        profile_id: profileId,
        insight_text: pInsight.personalized_text,
        relevance_score: pInsight.relevance_score,
        action_items: pInsight.action_items?.map((a: any) => 
          typeof a === 'string' ? a : `${a.action} (${a.timeline}, ${a.difficulty})`
        ) || [],
        profile_used: profileUsed
      }));

      const { error: personalizedError } = await supabase
        .from('personalized_insights')
        .insert(personalizedToInsert);

      if (personalizedError) {
        console.error('Error inserting personalized insights:', personalizedError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        videoId: video.id,
        insightCount: extractedData.insights.length,
        personalizedCount: extractedData.personalized_insights?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-video:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}