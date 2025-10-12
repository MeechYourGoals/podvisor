import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { YoutubeTranscript } from 'https://esm.sh/youtube-transcript@1.0.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback transcript fetcher using YouTube's timedtext API
async function fetchTimedTextTranscript(videoId: string): Promise<string> {
  const langs = ['en-US', 'en', 'en-GB'];
  
  for (const lang of langs) {
    try {
      const url = `https://video.google.com/timedtext?lang=${lang}&v=${videoId}`;
      const response = await fetch(url);
      if (response.ok) {
        const xml = await response.text();
        // Parse XML <text> nodes
        const textMatches = xml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
        const lines = Array.from(textMatches).map(match => {
          // Decode HTML entities
          return match[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        });
        if (lines.length > 0) {
          console.log(`[analyze-video] Fetched transcript via timedtext (${lang})`);
          return lines.join(' ');
        }
      }
    } catch (e) {
      console.log(`[analyze-video] timedtext fetch failed for ${lang}:`, e);
    }
  }
  throw new Error('No transcript available from timedtext API');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[analyze-video] Received request');
    const { videoUrl, profileId } = await req.json();
    
    console.log('[analyze-video] Analyzing video:', videoUrl, 'with profile:', profileId);

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
    console.log('[analyze-video] Fetching oEmbed metadata');
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedResponse = await fetch(oembedUrl);
    const oembedData = await oembedResponse.json();
    
    const videoTitle = oembedData.title;
    const channelName = oembedData.author_name;

    console.log('[analyze-video] Video metadata:', { videoTitle, channelName });

    // Fetch video transcript with fallback
    console.log('[analyze-video] Fetching transcript');
    let transcript = '';
    let transcriptSource = 'none';
    
    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = transcriptData.map((item: any) => item.text).join(' ');
      transcriptSource = 'youtube-transcript';
      console.log('[analyze-video] Transcript fetched via youtube-transcript, length:', transcript.length);
    } catch (transcriptError) {
      console.log('[analyze-video] youtube-transcript failed, trying timedtext fallback');
      try {
        transcript = await fetchTimedTextTranscript(videoId);
        transcriptSource = 'timedtext';
      } catch (timedtextError) {
        console.log('[analyze-video] All transcript methods failed');
        transcriptSource = 'unavailable';
      }
    }
    
    console.log(`[analyze-video] Transcript source: ${transcriptSource}, length: ${transcript.length}`);

    // Get user profile if provided, otherwise get default profile
    console.log('[analyze-video] Resolving user profile');
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
      console.log('[analyze-video] Using custom profile:', userProfile);
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
          console.log('[analyze-video] Using default profile:', defaultProfile.description);
        }
      }
    }

    // Build AI prompt
    const systemPrompt = `You are an elite insight extraction AI analyzing expert content across ALL domains - business, sports, health, education, creative, technology, finance, personal development, and more.

CRITICAL OUTPUT REQUIREMENTS:

1. **Top Lessons (EXACTLY 10 Required)**:
   - Each insight: 4-5 sentences with specific examples, concrete advice, and context
   - Include expert attribution in format: "— [Speaker Name]"
   - Impact score: 1-10 (how transformative is this insight?)
   - Actionability score: 1-10 (how quickly can someone act on this?)
   - Categories: Use domain-appropriate tags like "Strategy", "Communication", "Mindset", "Technical Skills", "Psychology", "Health", "Performance", "Leadership", etc.

2. **Personalized Insights (EXACTLY 10 Required if profile provided)**:
   - Opening context: "For Your [Profile Name]:" with 1-2 sentence bridge connecting the insight to their specific situation
   - Main insight: Full paragraph (4-5 sentences) with concrete examples relevant to their goals and challenges
   - Impact and Actionability scores (1-10)
   - EXACTLY 3 numbered action items formatted as:
     "1. [Specific action with timeline and measurable outcome]"
     "2. [Second action with concrete steps and resources needed]"
     "3. [Third action with implementation details and success metrics]"
   - Relevance score: X/10 (how relevant is this to their specific context?)

3. **Expert Attribution**:
   - Every insight must end with "— [Expert Name]" or "— [Speaker Name]"
   - Use the actual speaker's name from the video

QUALITY STANDARDS:
- NO generic advice - every insight must be specific and actionable
- Include numbers, frameworks, or step-by-step processes when mentioned
- Reference specific examples or stories from the video
- Connect insights to real-world application
${transcript ? '- Base insights on the ACTUAL TRANSCRIPT provided, not assumptions' : '- Analyze based on title and metadata (transcript unavailable)'}`;

    const userPrompt = `${transcript ? `FULL TRANSCRIPT:\n${transcript.slice(0, 50000)}\n\n` : ''}VIDEO METADATA:
Title: ${videoTitle}
Source: ${channelName}
URL: ${videoUrl}${transcriptSource === 'unavailable' ? `\n\nNote: Transcript unavailable. Analyze based on title and available metadata.` : ''}

${userProfile ? `USER PROFILE (analyze through this lens):
- Name: ${userProfile.profile_name}
- Category: ${userProfile.category}
- Role: ${userProfile.role_description}
- Experience Level: ${userProfile.experience_level}
- Goals: ${userProfile.goals}
- Current Challenges: ${userProfile.challenges}

TASK: Extract EXACTLY 10 universal insights + EXACTLY 10 personalized insights tailored to this profile.` : 'TASK: Extract EXACTLY 10 universal insights (no personalized insights needed).'}

CRITICAL FORMATTING:
- Every insight must end with "— [Speaker Name]"
- Each personalized insight must start with "For Your [Profile Name]:"
- Each personalized insight must have EXACTLY 3 numbered action items
- Use specific numbers, frameworks, and examples from the video
- Make insights tactical and immediately actionable`;

    // Call Lovable AI with tool calling
    console.log('[analyze-video] Calling Lovable AI API');
    
    // Adaptive model selection based on transcript length
    const model = transcript.length > 12000 ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';
    console.log(`[analyze-video] Using model: ${model}`);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
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
                  description: "EXACTLY 10 universal insights",
                  items: {
                    type: "object",
                    properties: {
                      insight_text: { type: "string", description: "4-5 sentences with specific examples and context. Must end with expert attribution: — [Speaker Name]" },
                      category: { type: "string", description: "Domain-appropriate category (e.g., Strategy, Communication, Psychology, Performance)" },
                      impact_score: { type: "integer", minimum: 1, maximum: 10 },
                      actionability_score: { type: "integer", minimum: 1, maximum: 10 },
                      expert_attribution: { type: "string", description: "Speaker name only, e.g., 'Jordan Peterson'" }
                    },
                    required: ["insight_text", "category", "impact_score", "actionability_score", "expert_attribution"]
                  },
                  minItems: 10,
                  maxItems: 10
                },
                personalized_insights: {
                  type: "array",
                  description: "EXACTLY 10 personalized insights if profile provided, otherwise 0",
                  items: {
                    type: "object",
                    properties: {
                      for_profile_context: { type: "string", description: "Opening line: 'For Your [Profile Name]:' followed by 1-2 sentence bridge" },
                      insight_text: { type: "string", description: "4-5 sentence paragraph connecting lesson to user's specific context" },
                      action_items: {
                        type: "array",
                        description: "EXACTLY 3 numbered action items",
                        items: { type: "string", description: "Full action description with timeline and success metrics" },
                        minItems: 3,
                        maxItems: 3
                      },
                      relevance_score: { type: "integer", minimum: 1, maximum: 10 },
                      impact_score: { type: "integer", minimum: 1, maximum: 10 },
                      actionability_score: { type: "integer", minimum: 1, maximum: 10 }
                    },
                    required: ["for_profile_context", "insight_text", "action_items", "relevance_score", "impact_score", "actionability_score"]
                  },
                  minItems: 0,
                  maxItems: 10
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
      console.error('[analyze-video] AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limits exceeded, please try again later.',
            error_code: 'RATE_LIMIT'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Payment required, please add funds to your Lovable AI workspace.',
            error_code: 'PAYMENT_REQUIRED'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'AI gateway error',
          error_code: 'AI_GATEWAY_ERROR',
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const aiData = await aiResponse.json();
    console.log('[analyze-video] AI response received');
    
    // Check for AI error in response
    if (aiData.error) {
      console.error('[analyze-video] AI returned error:', aiData.error);
      return new Response(
        JSON.stringify({ 
          error: aiData.error.message || 'AI processing error',
          error_code: 'AI_GATEWAY_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Defensive parsing of AI response
    const choice0 = aiData.choices?.[0];
    if (!choice0) {
      console.error('[analyze-video] No choices in AI response');
      return new Response(
        JSON.stringify({ 
          error: 'AI returned no choices',
          error_code: 'AI_NO_CHOICES'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const msg = choice0.message || {};
    const toolCalls = msg.tool_calls || (msg.function_call ? [{ type: 'function', function: msg.function_call }] : []);
    
    let extractedData: any;
    
    if (toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      try {
        extractedData = typeof toolCall.function?.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function?.arguments || toolCall.arguments;
      } catch (e) {
        console.error('[analyze-video] Failed to parse tool call arguments:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to parse AI response data',
            error_code: 'AI_INVALID_STRUCTURE'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Attempt to extract JSON from content
      console.log('[analyze-video] No tool call, attempting to parse content');
      const content = msg.content || '';
      
      // Try to find JSON in fenced code block
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.error('[analyze-video] Failed to parse JSON from code block');
        }
      }
      
      // Fallback: try parsing entire content
      if (!extractedData) {
        try {
          extractedData = JSON.parse(content);
        } catch (e) {
          console.error('[analyze-video] Failed to parse content as JSON');
          return new Response(
            JSON.stringify({ 
              error: 'AI returned unstructured data',
              error_code: 'AI_NO_TOOL_CALL'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
    }

    // Validate minimum structure
    if (!extractedData.insights || !Array.isArray(extractedData.insights) || extractedData.insights.length === 0) {
      console.error('[analyze-video] Invalid insights structure');
      return new Response(
        JSON.stringify({ 
          error: 'AI returned invalid insights structure',
          error_code: 'AI_INVALID_STRUCTURE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log('[analyze-video] Extracted data:', { 
      insightsCount: extractedData.insights?.length,
      personalizedCount: extractedData.personalized_insights?.length,
      speakersCount: extractedData.speakers?.length,
      tagsCount: extractedData.tags?.length 
    });

    // Store in database
    // 1. Create or find content source
    console.log('[analyze-video] Upserting content source');
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
    console.log('[analyze-video] Upserting expert');
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
    console.log('[analyze-video] Resolving user from token');
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token || '');

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[analyze-video] User resolved:', user.id);

    // 4. Create video record
    console.log('[analyze-video] Inserting video record');
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
    console.log('[analyze-video] Inserting general insights');
    const insightsToInsert = extractedData.insights.map((insight: any) => ({
      video_id: video.id,
      category: insight.category?.toLowerCase().replace(/\s+/g, '_') || 'general',
      insight_text: insight.insight_text,
      impact_score: insight.impact_score,
      actionability_score: insight.actionability_score,
      expert_attribution: insight.expert_attribution,
      profile_used: profileUsed
    }));

    const { error: insightsError } = await supabase
      .from('insights')
      .insert(insightsToInsert);

    if (insightsError) {
      console.error('Error inserting insights:', insightsError);
    }

    // 6. Insert personalized insights if profile provided
    console.log('[analyze-video] Inserting personalized insights');
    if (userProfile && extractedData.personalized_insights?.length > 0) {
      const personalizedToInsert = extractedData.personalized_insights.map((pInsight: any) => ({
        video_id: video.id,
        profile_id: profileId,
        for_profile_context: pInsight.for_profile_context,
        insight_text: pInsight.insight_text,
        relevance_score: pInsight.relevance_score,
        action_items: Array.isArray(pInsight.action_items) ? pInsight.action_items : [],
        profile_used: profileUsed
      }));

      const { error: personalizedError } = await supabase
        .from('personalized_insights')
        .insert(personalizedToInsert);

      if (personalizedError) {
        console.error('Error inserting personalized insights:', personalizedError);
      }
    }

    console.log('[analyze-video] Success! Returning response');
    
    // Increment user's video count
    const { error: incrementError } = await supabase.rpc('increment_video_count', {
      p_user_id: user.id
    });
    
    if (incrementError) {
      console.error('Error incrementing video count:', incrementError);
      // Non-fatal, don't block the response
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