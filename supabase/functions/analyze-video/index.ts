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

// Tier 3 fallback: Use Perplexity to analyze video directly
async function fetchPerplexityAnalysis(videoUrl: string, videoTitle: string): Promise<string> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityKey) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }
  
  console.log('[analyze-video] Using Perplexity as fallback for video analysis');
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content analyst. Analyze YouTube videos and extract detailed transcripts or summaries of the key points discussed.'
        },
        {
          role: 'user',
          content: `Analyze this YouTube video and provide a comprehensive summary of all key points, insights, and topics discussed:\n\nTitle: ${videoTitle}\nURL: ${videoUrl}\n\nProvide a detailed summary that captures the main ideas, arguments, and examples as if transcribing the video content.`
        }
      ],
      temperature: 0.2,
      max_tokens: 4000,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content;
  
  if (!summary) {
    throw new Error('No content returned from Perplexity');
  }
  
  console.log('[analyze-video] Perplexity analysis complete, length:', summary.length);
  return summary;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[analyze-video] Received request');
    const { videoUrl, profileId, isRefresh, existingVideoId } = await req.json();
    
    console.log('[analyze-video] Analyzing video:', videoUrl, 'with profile:', profileId, 'isRefresh:', isRefresh);

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
    
    // Tier 1: Try youtube-transcript library
    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = transcriptData.map((item: any) => item.text).join(' ');
      transcriptSource = 'youtube-transcript';
      console.log('[analyze-video] Transcript fetched via youtube-transcript, length:', transcript.length);
    } catch (transcriptError) {
      console.log('[analyze-video] Tier 1 (youtube-transcript) failed, trying Tier 2');
      
      // Tier 2: Try timedtext API
      try {
        transcript = await fetchTimedTextTranscript(videoId);
        transcriptSource = 'timedtext';
      } catch (timedtextError) {
        console.log('[analyze-video] Tier 2 (timedtext) failed, trying Tier 3');
        
        // Tier 3: Try Perplexity analysis
        try {
          transcript = await fetchPerplexityAnalysis(videoUrl, videoTitle);
          transcriptSource = 'perplexity';
        } catch (perplexityError) {
          console.log('[analyze-video] Tier 3 (Perplexity) failed:', perplexityError);
          
          // Tier 4: Metadata-only analysis (last resort)
          console.log('[analyze-video] Using metadata-only analysis');
          transcript = `Video Title: ${videoTitle}\nChannel: ${channelName}\nURL: ${videoUrl}\n\nNote: No transcript available. This is a metadata-only analysis.`;
          transcriptSource = 'metadata-only';
        }
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
   - Categories: Choose the BEST-FIT category when clearly applicable. Prefer these when confident:
     • "business" (entrepreneurship, startups, sales, marketing, leadership)
     • "sports" (athletics, performance, training, competition)
     • "health_fitness" (nutrition, exercise, wellness, longevity)
     • "technology" (software, AI, innovation, engineering)
     • "personal_development" (mindset, habits, psychology, self-improvement)
     • "finance" (investing, money management, wealth building)
     • "entertainment" (media, content creation, storytelling)
     • "education" (learning, teaching, skills development)
     • "general" (catch-all for multi-disciplinary, unclear, or non-standard topics)
   - If uncertain or the insight spans multiple domains, use "general"

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

    // Call Lovable AI without tool calling (Phase 0 hotfix to avoid Gemini schema errors)
    console.log('[analyze-video] Calling Lovable AI API (no-tools mode)');
    
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
          { role: 'user', content: userPrompt + '\n\nIMPORTANT: Return valid JSON with this exact structure:\n{"source_name": "...", "expert": {"name": "...", "domain": "..."}, "speakers": [...], "tags": [...], "insights": [...], "personalized_insights": [...]}' }
        ]
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

    // Defensive parsing of AI response (no-tools mode)
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
    let extractedData: any;
    
    // Parse JSON from content (no tool calls in Phase 0)
    console.log('[analyze-video] Parsing JSON from content');
    const content = msg.content || '';
    
    // Try to find JSON in fenced code block first
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        extractedData = JSON.parse(jsonMatch[1]);
        console.log('[analyze-video] Parsed JSON from code fence');
      } catch (e) {
        console.log('[analyze-video] Failed to parse JSON from code block, trying raw content');
      }
    }
    
    // Fallback: try parsing entire content as JSON
    if (!extractedData) {
      try {
        extractedData = JSON.parse(content);
        console.log('[analyze-video] Parsed JSON from raw content');
      } catch (e) {
        console.error('[analyze-video] Failed to parse content as JSON:', e);
        return new Response(
          JSON.stringify({ 
            error: 'AI returned unstructured data',
            error_code: 'AI_NO_TOOL_CALL'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Validate and sanitize extracted data with clamps
    console.log('[analyze-video] Raw data before sanitization:', {
      insightsCount: extractedData.insights?.length,
      personalizedCount: extractedData.personalized_insights?.length
    });
    
    // Helper: coerce score to 1-10 range
    const coerceScore = (val: any, defaultVal = 7): number => {
      const num = parseInt(val, 10);
      if (isNaN(num)) return defaultVal;
      return Math.max(1, Math.min(10, num));
    };
    
    // Helper: extract expert name from "— Name" pattern if missing
    const extractExpertName = (text: string, fallback: string): string => {
      const match = text.match(/—\s*([^—\n]+?)(?:\n|$)/);
      return match ? match[1].trim() : fallback;
    };
    
    // Clamp and sanitize insights array
    if (!Array.isArray(extractedData.insights)) {
      console.error('[analyze-video] insights is not an array');
      return new Response(
        JSON.stringify({ 
          error: 'AI returned invalid insights structure',
          error_code: 'AI_INVALID_STRUCTURE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Clamp to max 10 insights
    extractedData.insights = extractedData.insights.slice(0, 10).map((insight: any) => {
      const sanitized: any = {
        insight_text: (insight.insight_text || '').trim(),
        category: (insight.category || 'general').toLowerCase().replace(/\s+/g, '_'),
        impact_score: coerceScore(insight.impact_score),
        actionability_score: coerceScore(insight.actionability_score),
        expert_attribution: insight.expert_attribution || extractExpertName(insight.insight_text || '', channelName)
      };
      return sanitized;
    });
    
    // Clamp and sanitize personalized insights if present
    if (Array.isArray(extractedData.personalized_insights)) {
      extractedData.personalized_insights = extractedData.personalized_insights.slice(0, 10).map((pInsight: any) => {
        // Ensure action_items is array with up to 3 items
        let actionItems = Array.isArray(pInsight.action_items) ? pInsight.action_items : [];
        actionItems = actionItems.slice(0, 3).map((item: any) => String(item).trim());
        
        return {
          for_profile_context: (pInsight.for_profile_context || '').trim(),
          insight_text: (pInsight.insight_text || '').trim(),
          action_items: actionItems,
          relevance_score: coerceScore(pInsight.relevance_score),
          impact_score: coerceScore(pInsight.impact_score),
          actionability_score: coerceScore(pInsight.actionability_score)
        };
      });
    } else {
      extractedData.personalized_insights = [];
    }
    
    // Ensure other required fields have defaults
    extractedData.source_name = extractedData.source_name || channelName;
    extractedData.expert = extractedData.expert || { name: channelName, domain: 'general' };
    extractedData.speakers = Array.isArray(extractedData.speakers) ? extractedData.speakers : [{ name: channelName, role: 'host' }];
    extractedData.tags = Array.isArray(extractedData.tags) ? extractedData.tags.slice(0, 7) : [];
    
    console.log('[analyze-video] Sanitized data:', { 
      insightsCount: extractedData.insights.length,
      personalizedCount: extractedData.personalized_insights.length,
      speakersCount: extractedData.speakers.length,
      tagsCount: extractedData.tags.length 
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

    // Handle refresh mode - delete old insights and update video record
    let video: any;
    if (isRefresh && existingVideoId) {
      console.log('[analyze-video] Refresh mode: updating existing video', existingVideoId);
      
      // Delete existing insights for this video
      const { error: deleteInsightsError } = await supabase
        .from('insights')
        .delete()
        .eq('video_id', existingVideoId);
      
      if (deleteInsightsError) {
        console.error('[analyze-video] Error deleting old insights:', deleteInsightsError);
      }
      
      const { error: deletePersonalizedError } = await supabase
        .from('personalized_insights')
        .delete()
        .eq('video_id', existingVideoId);
      
      if (deletePersonalizedError) {
        console.error('[analyze-video] Error deleting old personalized insights:', deletePersonalizedError);
      }
      
      // Update video record with new analyzed_at timestamp and profile_used
      const { data: updatedVideo, error: updateError } = await supabase
        .from('videos')
        .update({
          analyzed_at: new Date().toISOString(),
          profile_used: profileUsed,
          source_id: sourceId,
          expert_id: expertId,
          speakers: extractedData.speakers || [],
          tags: extractedData.tags || [],
        })
        .eq('id', existingVideoId)
        .select('id')
        .single();
      
      if (updateError) {
        console.error('[analyze-video] Error updating video:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update video' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      video = updatedVideo;
      console.log('[analyze-video] Video updated successfully');
    } else {
      // 4. Create video record
      console.log('[analyze-video] Inserting video record');
      const { data: newVideo, error: videoError } = await supabase
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
      
      video = newVideo;
    }

    // 5. Insert insights with defensive validation
    console.log('[analyze-video] Inserting general insights');
    const validCategories = ['business', 'sports', 'health_fitness', 'technology', 'personal_development', 'finance', 'entertainment', 'education', 'general'];
    
    const insightsToInsert = extractedData.insights.map((insight: any) => {
      let category = insight.category || 'general';
      
      // Normalize category to valid enum value (already done in sanitization, but double-check)
      if (!validCategories.includes(category)) {
        console.log(`[analyze-video] Category "${category}" normalized to "general"`);
        category = 'general';
      }
      
      return {
        video_id: video.id,
        category,
        insight_text: insight.insight_text,
        impact_score: insight.impact_score,
        actionability_score: insight.actionability_score,
        expert_attribution: insight.expert_attribution,
        profile_used: profileUsed
      };
    });

    const { error: insightsError } = await supabase
      .from('insights')
      .insert(insightsToInsert);

    if (insightsError) {
      console.error('[analyze-video] Error inserting insights:', insightsError);
      // Log but don't throw - try to continue with partial results
      console.error('[analyze-video] Insight insertion failed, but continuing...');
    }
    
    // Verify insertions worked
    const { count: insightsCount, error: countError } = await supabase
      .from('insights')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', video.id);
    
    if (countError) {
      console.error('[analyze-video] Error counting insights:', countError);
    }
    
    const finalInsightCount = insightsCount || 0;
    console.log(`[analyze-video] Successfully inserted ${finalInsightCount} insights`);

    // 6. Insert personalized insights if profile provided
    console.log('[analyze-video] Inserting personalized insights');
    let personalizedCount = 0;
    
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
        console.error('[analyze-video] Error inserting personalized insights:', personalizedError);
        throw new Error(`Failed to save personalized insights: ${personalizedError.message}`);
      }
      
      // Verify personalized insertions worked
      const { count: pCount, error: pCountError } = await supabase
        .from('personalized_insights')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', video.id);
      
      if (pCountError) {
        console.error('[analyze-video] Error counting personalized insights:', pCountError);
      } else {
        personalizedCount = pCount || 0;
        console.log(`[analyze-video] Successfully inserted ${personalizedCount} personalized insights`);
      }
    }

    console.log('[analyze-video] Success! Returning response');
    
    // Increment user's video count only if not a refresh
    if (!isRefresh) {
      const { error: incrementError } = await supabase.rpc('increment_video_count', {
        p_user_id: user.id
      });
      
      if (incrementError) {
        console.error('Error incrementing video count:', incrementError);
        // Non-fatal, don't block the response
      }
    } else {
      console.log('[analyze-video] Skipping video count increment for refresh operation');
    }
    
    // Build warnings array
    const warnings = [];
    if (transcriptSource === 'metadata-only') {
      warnings.push('Analysis based on metadata only - transcript unavailable');
    } else if (transcriptSource === 'perplexity') {
      warnings.push('Analysis generated using AI fallback method');
    }
    if (finalInsightCount < 10) {
      warnings.push(`Generated ${finalInsightCount} insights (target: 10)`);
    }
    if (userProfile && personalizedCount < 10) {
      warnings.push(`Generated ${personalizedCount} personalized insights (target: 10)`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        videoId: video.id,
        insightCount: finalInsightCount,
        personalizedCount: personalizedCount,
        transcriptSource: transcriptSource,
        warnings: warnings.length > 0 ? warnings : undefined
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