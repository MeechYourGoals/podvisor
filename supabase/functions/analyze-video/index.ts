import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { YoutubeTranscript } from 'https://esm.sh/youtube-transcript@1.0.6';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Score clamping helper (same as Startup Advisor)
const clampScore = (val: any): number => Math.max(1, Math.min(10, Math.round(Number(val) || 7)));

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

  // Comprehensive error wrapper for mobile debugging
  try {
    console.log('[analyze-video] Received request');
    
    // Security: Validate all inputs with strict schema
    const analyzeVideoSchema = z.object({
      videoUrl: z.string()
        .url({ message: 'Invalid URL format' })
        .regex(/^https:\/\/(?:(?:www|m)\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/, {
          message: 'Only YouTube video URLs are supported'
        })
        .max(500, 'URL too long')
        .optional(),
      audioUpload: z.object({
        filename: z.string().max(255),
        storagePath: z.string().max(500).optional(),
        audioBase64: z.string().optional(),
        durationSeconds: z.number().optional(),
      }).optional(),
      profileId: z.string().uuid().optional().nullable(),
      isRefresh: z.boolean().optional(),
      existingVideoId: z.string().uuid().optional().nullable(),
      migrateData: z.boolean().optional(),
      isAnonymous: z.boolean().optional(),
      anonymousProfile: z.string().max(1000).optional(),
      cachedData: z.object({
        insights: z.array(z.any()).max(50).optional(),
        personalizedInsights: z.array(z.any()).max(50).optional(),
        videoMetadata: z.object({
          title: z.string().max(500),
          video_id: z.string().max(20),
          speakers: z.array(z.any()).max(20).optional(),
          tags: z.array(z.string().max(50)).max(20).optional(),
          thumbnail_url: z.string().url().optional(),
        }).optional(),
      }).optional(),
    }).refine(data => data.videoUrl || data.audioUpload, {
      message: 'Either videoUrl or audioUpload must be provided'
    });

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = analyzeVideoSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('[analyze-video] Input validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input parameters',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { videoUrl, audioUpload, profileId, isRefresh, existingVideoId, migrateData, cachedData, isAnonymous, anonymousProfile } = validationResult.data;
    
    console.log('[analyze-video] Request details:', { 
      videoUrl, 
      audioUpload: audioUpload ? { filename: audioUpload.filename, hasStorage: !!audioUpload.storagePath } : null,
      profileId, 
      isRefresh, 
      migrateData, 
      isAnonymous, 
      hasAnonymousProfile: !!anonymousProfile,
      anonymousProfileLength: anonymousProfile?.length || 0
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    // Validate required environment variables
    if (!supabaseUrl || !supabaseKey) {
      console.error('[analyze-video] Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing Supabase credentials',
          error_code: 'MISSING_ENV_VARS'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      console.error('[analyze-video] Missing LOVABLE_API_KEY');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing AI API key',
          error_code: 'MISSING_AI_KEY'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let transcript = '';
    let transcriptSource = 'none';
    let videoMetadata: any = {};
    let videoId = '';

    // Handle audio upload vs YouTube video
    if (audioUpload) {
      console.log('[analyze-video] Processing audio upload:', audioUpload.filename);
      
      // Check subscription tier for authenticated users (Pro/Annual only)
      if (!isAnonymous) {
        const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(authHeader || '');
        
        if (user) {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('tier')
            .eq('user_id', user.id)
            .single();
          
          if (subscription?.tier !== 'pro' && subscription?.tier !== 'annual') {
            console.log('[analyze-video] Non-Pro user attempted audio upload');
            return new Response(
              JSON.stringify({ 
                error: 'Audio upload requires Pro subscription',
                error_code: 'UPGRADE_REQUIRED' 
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
      
      // Fetch audio file (either from storage or base64)
      let audioData: Uint8Array;
      
      if (audioUpload.storagePath && !isAnonymous) {
        // Authenticated user - fetch from storage
        const { data: audioFile, error: storageError } = await supabase.storage
          .from('audio-uploads')
          .download(audioUpload.storagePath);
        
        if (storageError) {
          console.error('[analyze-video] Storage fetch error:', storageError);
          throw new Error('Failed to fetch audio file from storage');
        }
        
        audioData = new Uint8Array(await audioFile.arrayBuffer());
      } else if (audioUpload.audioBase64) {
        // Anonymous user - decode base64
        const binaryString = atob(audioUpload.audioBase64);
        audioData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i);
        }
      } else {
        throw new Error('No audio data provided (storagePath or audioBase64 required)');
      }
      
      // Convert audio to base64 for Gemini API
      const audioBase64 = btoa(String.fromCharCode(...audioData));
      
      // Determine MIME type from filename
      const extension = audioUpload.filename.split('.').pop()?.toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        'mp3': 'audio/mpeg',
        'm4a': 'audio/mp4',
        'wav': 'audio/wav',
        'webm': 'audio/webm',
        'ogg': 'audio/ogg',
        'flac': 'audio/flac',
        'aac': 'audio/aac',
      };
      const mimeType = mimeTypeMap[extension || 'mp3'] || 'audio/mpeg';
      
      console.log('[analyze-video] Audio prepared:', {
        filename: audioUpload.filename,
        mimeType,
        sizeKB: Math.round(audioData.length / 1024)
      });
      
      // Call Gemini to transcribe AND extract metadata in one shot
      const transcriptionPrompt = `You are analyzing an audio file. Please:
1. Provide a complete transcript of the audio
2. Extract metadata: title (if mentioned or infer from content), speaker names, key topics/tags
3. Provide a brief summary

Return structured data.`;

      const transcriptionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: transcriptionPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${audioBase64}`
                  }
                }
              ]
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'extract_audio_metadata',
                description: 'Extract transcript and metadata from audio',
                parameters: {
                  type: 'object',
                  properties: {
                    transcript: { type: 'string', description: 'Full transcript of audio' },
                    title: { type: 'string', description: 'Title or main topic of audio' },
                    speakers: { 
                      type: 'array', 
                      items: { type: 'string' },
                      description: 'Names of speakers if identified'
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Key topics or tags (3-5 items)'
                    },
                    summary: { type: 'string', description: 'Brief summary of content' }
                  },
                  required: ['transcript', 'title', 'tags', 'summary'],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'extract_audio_metadata' } }
        }),
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('[analyze-video] Gemini transcription error:', errorText);
        throw new Error('Transcription failed');
      }

      const transcriptionResult = await transcriptionResponse.json();
      const toolCall = transcriptionResult.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!toolCall) {
        throw new Error('No transcription data returned from Gemini');
      }

      const audioMetadata = JSON.parse(toolCall.function.arguments);
      transcript = audioMetadata.transcript;
      transcriptSource = 'gemini-audio';
      
      videoMetadata = {
        title: audioMetadata.title || audioUpload.filename.replace(/\.[^/.]+$/, ''),
        video_id: crypto.randomUUID(),
        thumbnail_url: null,
        speakers: (audioMetadata.speakers || []).map((name: string) => ({ name, role: 'speaker' })),
        tags: audioMetadata.tags || ['audio-upload'],
        description: audioMetadata.summary || '',
      };
      
      videoId = videoMetadata.video_id;
      
      console.log('[analyze-video] Audio transcribed:', {
        transcriptLength: transcript.length,
        title: videoMetadata.title,
        speakers: videoMetadata.speakers.length
      });
      
    } else if (videoUrl) {
      // Extract YouTube video ID
      videoId = extractYouTubeId(videoUrl);
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
          console.log('[analyze-video] Tier 2 (timedtext) failed, using metadata-only analysis');
          
          // Tier 3: Metadata-only analysis
          console.log('[analyze-video] Using metadata-only analysis');
          transcript = `Video Title: ${videoTitle}\nChannel: ${channelName}\nURL: ${videoUrl}\n\nNote: No transcript available. This is a metadata-only analysis.`;
          transcriptSource = 'metadata-only';
        }
      }
      
      console.log(`[analyze-video] Transcript source: ${transcriptSource}, length: ${transcript.length}`);
      
      videoMetadata = {
        title: videoTitle,
        video_id: videoId,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    }


    // Get user profile if provided, otherwise get default profile
    console.log('[analyze-video] Resolving user profile');
    let userProfile = null;
    let profileUsed = 'default';
    
    if (anonymousProfile && anonymousProfile.trim()) {
      // Use anonymous profile provided by user
      userProfile = {
        profile_name: 'Your Profile',
        category: 'general',
        role_description: anonymousProfile.trim(),
        experience_level: 'varied',
        goals: 'Personalized learning based on context',
        challenges: 'Various'
      };
      profileUsed = 'anonymous';
      console.log('[analyze-video] Using anonymous profile - length:', anonymousProfile.trim().length);
    } else if (profileId) {
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

    // Build AI prompt with flexibility for metadata-only mode
    const systemPrompt = `You are an elite insight extraction AI analyzing expert content across ALL domains - business, sports, health, education, creative, technology, finance, personal development, and more.

CRITICAL OUTPUT REQUIREMENTS:

1. **Top Lessons (EXACTLY 10 Required)**:
   - Each insight: 4-5 sentences with specific examples, concrete advice, and context
   ${transcriptSource === 'metadata-only' 
     ? '- METADATA-ONLY MODE: Make informed inferences based on video title, channel, and topic. Be transparent about inference vs. direct quotes.'
     : '- Base insights on ACTUAL TRANSCRIPT content with specific examples from the video'}
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
   ${transcriptSource === 'metadata-only'
     ? '- METADATA-ONLY MODE: Focus on how the video topic relates to their profile. Make strategic inferences about likely content.'
     : '- Connect specific video content to their unique situation and goals'}
   - Impact and Actionability scores (1-10)
   - EXACTLY 3 numbered action items formatted as:
     "1. [Specific action with timeline and measurable outcome]"
     "2. [Second action with concrete steps and resources needed]"
     "3. [Third action with implementation details and success metrics]"
   - Relevance score: X/10 (how relevant is this to their specific context?)

3. **Expert Attribution**:
   - Every insight must end with "— [Expert Name]" or "— [Speaker Name]"
   - Use the actual speaker's name from the video or channel

${transcriptSource === 'metadata-only' 
  ? `
METADATA-ONLY MODE GUIDELINES:
- Generate 10 universal insights based on what experts in this domain typically discuss
- If profile provided, generate 10 personalized insights connecting the topic to their goals
- Be strategic and inference-based while remaining valuable and actionable
- Frame insights as "likely topics covered" or "key considerations in this domain"
- Maintain high quality standards but acknowledge the limited data available`
  : `
QUALITY STANDARDS (FULL TRANSCRIPT MODE):
- NO generic advice - every insight must be specific and actionable
- Include numbers, frameworks, or step-by-step processes when mentioned
- Reference specific examples or stories from the video
- Connect insights to real-world application
- Base all insights on ACTUAL TRANSCRIPT content`}`;

    const userPrompt = `${transcript && transcriptSource !== 'metadata-only' ? `FULL TRANSCRIPT:\n${transcript.slice(0, 50000)}\n\n` : ''}VIDEO METADATA:
Title: ${videoTitle}
Source: ${channelName}
URL: ${videoUrl}${transcriptSource === 'metadata-only' ? `\n\nIMPORTANT: No transcript available. Generate insights based on the video title, channel expertise, and typical content in this domain.` : ''}

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
${transcriptSource === 'metadata-only' 
  ? '- Make informed inferences about what this video likely covers based on the title and source'
  : '- Use specific numbers, frameworks, and examples from the video transcript'}
- Make insights tactical and immediately actionable`;

    // Call Lovable AI with tool calling (Startup Advisor pattern)
    console.log('[analyze-video] Calling Lovable AI API with tool calling');
    console.log('[analyze-video] Profile state:', {
      hasUserProfile: !!userProfile,
      profileUsed,
      willGeneratePersonalized: !!userProfile
    });
    
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
        tools: [
          {
            type: "function",
            function: {
              name: "extract_video_insights",
              description: "Extract structured insights from video content",
              parameters: {
                type: "object",
                properties: {
                  source_name: { type: "string" },
                  expert: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      domain: { type: "string" }
                    },
                    required: ["name"]
                  },
                  speakers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        role: { type: "string" }
                      }
                    }
                  },
                  tags: { type: "array", items: { type: "string" } },
                  insights: {
                    type: "array",
                    description: "Exactly 10 universal insights",
                    minItems: 10,
                    maxItems: 10,
                    items: {
                      type: "object",
                      properties: {
                        insight_text: { type: "string" },
                        impact_score: { type: "integer", minimum: 1, maximum: 10 },
                        actionability_score: { type: "integer", minimum: 1, maximum: 10 },
                        category: { type: "string" },
                        expert_attribution: { type: "string" }
                      },
                      required: ["insight_text", "impact_score", "actionability_score", "category"]
                    }
                  },
                  personalized_insights: {
                    type: "array",
                    description: "Exactly 10 personalized insights if profile provided",
                    items: {
                      type: "object",
                      properties: {
                        for_profile_context: { type: "string" },
                        insight_text: { type: "string" },
                        relevance_score: { type: "integer", minimum: 1, maximum: 10 },
                        action_items: { type: "array", items: { type: "string" } }
                      },
                      required: ["insight_text"]
                    }
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_video_insights" } }
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
    
    // Extract from tool calls (Startup Advisor pattern)
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('[analyze-video] No tool call in response:', aiData);
      return new Response(
        JSON.stringify({ 
          error: 'AI did not return structured data. Please try again.',
          error_code: 'AI_NO_TOOL_CALL'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let extractedData: any;
    try {
      extractedData = JSON.parse(toolCall.function.arguments);
      console.log('[analyze-video] Parsed analysis from tool call:', {
        insightCount: extractedData.insights?.length,
        personalizedCount: extractedData.personalized_insights?.length
      });
    } catch (parseError) {
      console.error('[analyze-video] Error parsing tool call arguments:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'AI returned invalid JSON structure.',
          error_code: 'AI_INVALID_STRUCTURE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Validate structure
    if (!extractedData.insights || !Array.isArray(extractedData.insights)) {
      return new Response(
        JSON.stringify({ 
          error: 'AI did not return insights array.',
          error_code: 'AI_INVALID_STRUCTURE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Normalize insights data (clamp to max 10)
    const normalizedInsights = extractedData.insights.slice(0, 10).map((insight: any) => {
      // Extract expert name from text if not provided
      let expertName = insight.expert_attribution || extractedData.expert?.name || channelName;
      if (!expertName && insight.insight_text) {
        const match = insight.insight_text.match(/—\s*(.+)$/);
        if (match) expertName = match[1].trim();
      }
      
      // Normalize category to lowercase snake_case
      let category = (insight.category || 'general')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      // Map to known categories or default to "general"
      const validCategories = [
        'business', 'sports', 'health_fitness', 'technology',
        'personal_development', 'finance', 'entertainment', 'education', 'general'
      ];
      if (!validCategories.includes(category)) {
        console.log(`[analyze-video] Category "${insight.category}" not in list, defaulting to "general"`);
        category = 'general';
      }
      
      return {
        insight_text: insight.insight_text,
        impact_score: clampScore(insight.impact_score),
        actionability_score: clampScore(insight.actionability_score),
        category: category,
        expert_attribution: expertName
      };
    });
    
    // Normalize personalized insights if present (clamp to max 10)
    let normalizedPersonalized: any[] = [];
    if (userProfile && extractedData.personalized_insights && Array.isArray(extractedData.personalized_insights)) {
      normalizedPersonalized = extractedData.personalized_insights.slice(0, 10).map((pi: any) => {
        // Ensure action_items is an array with max 3 items
        let actionItems: string[] = [];
        if (Array.isArray(pi.action_items)) {
          actionItems = pi.action_items.slice(0, 3);
        } else if (typeof pi.action_items === 'string') {
          // If AI returned string, try to split by newlines/numbers
          actionItems = pi.action_items
            .split(/\n+/)
            .filter((item: string) => item.trim())
            .slice(0, 3);
        }
        
        return {
          for_profile_context: pi.for_profile_context || `For Your ${userProfile.profile_name}`,
          insight_text: pi.insight_text,
          relevance_score: clampScore(pi.relevance_score),
          action_items: actionItems
        };
      });
    }
    
    // Ensure other required fields have defaults
    const source_name = extractedData.source_name || channelName;
    const expert = extractedData.expert || { name: channelName, domain: 'general' };
    const speakers = Array.isArray(extractedData.speakers) ? extractedData.speakers : [{ name: channelName, role: 'host' }];
    const tags = Array.isArray(extractedData.tags) ? extractedData.tags.slice(0, 7) : [];
    
    console.log('[analyze-video] Normalized data:', { 
      insightsCount: normalizedInsights.length,
      personalizedCount: normalizedPersonalized.length,
      speakersCount: speakers.length,
      tagsCount: tags.length 
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
          source_name: source_name
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
      .eq('name', expert.name)
      .single();

    let expertId = existingExpert?.id;
    if (!expertId) {
      const { data: newExpert } = await supabase
        .from('experts')
        .insert({
          name: expert.name,
          credentials: expert.credentials,
          domain: expert.domain
        })
        .select('id')
        .single();
      expertId = newExpert?.id;
    }

    // 3. Get user ID from auth header
    console.log('[analyze-video] Resolving user from token');
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId: string | null = null;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // MIGRATION PATH: Save cached data to DB for new users
    if (migrateData && userId && cachedData) {
      console.log('[analyze-video] Migration mode: saving cached data for user', userId);
      
      try {
        // Insert video record
        const { data: videoRecord, error: videoError } = await supabase
          .from('videos')
          .insert({
            user_id: userId,
            youtube_url: videoUrl,
            video_id: cachedData.videoMetadata?.video_id || '',
            title: cachedData.videoMetadata?.title || 'Untitled Video',
            thumbnail_url: cachedData.videoMetadata?.thumbnail_url,
            source_id: sourceId,
            expert_id: expertId,
            speakers: cachedData.videoMetadata?.speakers || [],
            tags: cachedData.videoMetadata?.tags || [],
            profile_used: 'default',
          })
          .select('id')
          .single();

        if (videoError) throw videoError;

        // Insert insights
        if (cachedData.insights && Array.isArray(cachedData.insights)) {
          const insightsToInsert = cachedData.insights.map((insight: any) => ({
            video_id: videoRecord.id,
            insight_text: insight.insight_text,
            impact_score: insight.impact_score,
            actionability_score: insight.actionability_score,
            category: insight.category,
            expert_attribution: insight.expert_attribution,
            profile_used: 'default',
          }));

          await supabase.from('insights').insert(insightsToInsert);
        }

        // Insert personalized insights
        if (cachedData.personalizedInsights && Array.isArray(cachedData.personalizedInsights)) {
          const personalizedToInsert = cachedData.personalizedInsights.map((pi: any) => ({
            video_id: videoRecord.id,
            insight_text: pi.insight_text,
            for_profile_context: pi.for_profile_context,
            relevance_score: pi.relevance_score,
            action_items: pi.action_items,
            profile_used: 'default',
          }));

          await supabase.from('personalized_insights').insert(personalizedToInsert);
        }

        console.log('[analyze-video] Migration successful for video:', videoRecord.id);
        
        return new Response(
          JSON.stringify({ success: true, videoId: videoRecord.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (migrationError) {
        console.error('[analyze-video] Migration error:', migrationError);
        return new Response(
          JSON.stringify({ error: 'Migration failed', details: migrationError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ANONYMOUS PATH: Return insights without DB write
    if (!userId && !migrateData) {
      console.log('[analyze-video] Anonymous request - will return insights without saving to DB');
      
      // Continue with analysis, but skip DB writes later
      // We'll handle this after AI processing
    }

    // AUTHENTICATED PATH: Check user authorization
    if (!userId && !isAnonymous) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (userId) {
      console.log('[analyze-video] User resolved:', userId);
    }

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
          speakers: speakers,
          tags: tags,
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
    } else if (userId) {
      // 4. Create video record (only for authenticated users)
      console.log('[analyze-video] Inserting video record');
      const { data: newVideo, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: userId,
          title: videoTitle,
          youtube_url: videoUrl,
          video_id: videoId,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          source_id: sourceId,
          expert_id: expertId,
          status: 'completed',
          profile_used: profileUsed,
          speakers: speakers,
          tags: tags,
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

    // 5. Insert insights (only for authenticated users with valid video record)
    let finalInsightCount = 0;
    let personalizedCount = 0;
    
    if (userId && video) {
      console.log('[analyze-video] Inserting general insights');
      
      const insightsToInsert = normalizedInsights.map((insight: any) => ({
        video_id: video.id,
        category: insight.category,
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
      
      finalInsightCount = insightsCount || 0;
      console.log(`[analyze-video] Successfully inserted ${finalInsightCount} insights`);

      // 6. Insert personalized insights if profile provided
      console.log('[analyze-video] Inserting personalized insights');
      
      if (userProfile && normalizedPersonalized.length > 0) {
        const personalizedToInsert = normalizedPersonalized.map((pInsight: any) => ({
          video_id: video.id,
          profile_id: profileId || null, // Allow null for anonymous profile descriptions
          for_profile_context: pInsight.for_profile_context,
          insight_text: pInsight.insight_text,
          relevance_score: pInsight.relevance_score,
          action_items: pInsight.action_items,
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
    } else {
      console.log('[analyze-video] Anonymous user - skipping database insertion');
      // For anonymous users, use the normalized counts from AI response
      finalInsightCount = normalizedInsights.length;
      personalizedCount = normalizedPersonalized.length;
    }

    console.log('[analyze-video] Success! Returning response');
    
    // Increment user's video count only if not a refresh and user is authenticated
    if (!isRefresh && userId) {
      const { error: incrementError } = await supabase.rpc('increment_video_count', {
        p_user_id: userId
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
    if (finalInsightCount < 10) {
      warnings.push(`Generated ${finalInsightCount} insights (target: 10)`);
    }
    if (userProfile && personalizedCount < 10) {
      warnings.push(`Generated ${personalizedCount} personalized insights (target: 10)`);
    }
    if (transcriptSource === 'perplexity') {
      warnings.push('Used AI analysis fallback (transcript unavailable)');
    }
    if (transcriptSource === 'metadata-only') {
      warnings.push('Limited analysis - metadata only (no transcript available)');
    }
    
    // For anonymous users, return insights directly without DB write
    if (!userId) {
      console.log('[analyze-video] Anonymous mode: returning insights without DB write');
      return new Response(
        JSON.stringify({
          success: true,
          videoId: crypto.randomUUID(),
          insights: normalizedInsights,
          personalizedInsights: normalizedPersonalized,
          videoMetadata: {
            title: videoTitle,
            video_id: videoId,
            thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            speakers: speakers,
            tags: tags
          },
          insightCount: finalInsightCount,
          personalizedCount: personalizedCount,
          transcriptSource: transcriptSource,
          warnings: warnings.length > 0 ? warnings : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[analyze-video] Final results:', {
      videoId: video?.id,
      insightCount: finalInsightCount,
      personalizedCount: personalizedCount,
      transcriptSource: transcriptSource,
      warningCount: warnings.length
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        videoId: video?.id,
        insightCount: finalInsightCount,
        personalizedCount: personalizedCount,
        transcriptSource: transcriptSource,
        warnings: warnings.length > 0 ? warnings : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[analyze-video] CRITICAL ERROR:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error occurred',
        error_code: 'UNEXPECTED_ERROR',
        details: error?.stack || 'No stack trace available'
      }),
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