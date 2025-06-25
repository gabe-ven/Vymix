import { OPENAI_API_KEY } from '../env';

interface PlaylistGenerationRequest {
  emojis: string[];
  songCount: number;
  vibe: string;
}

interface PlaylistGenerationResponse {
  name: string;
  description: string;
  colorPalette: string[];
  keywords: string[];
}

export class OpenAIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export const generatePlaylistInfo = async (
  request: PlaylistGenerationRequest
): Promise<PlaylistGenerationResponse> => {
  if (!OPENAI_API_KEY) {
    throw new OpenAIError('OpenAI API key is not configured');
  }

  const { emojis, songCount, vibe } = request;
  
  const emojiString = emojis.join(' ');
  
  const prompt = `Create a music playlist name, description, and color palette based on:
- These emojis: ${emojiString}
- Number of songs: ${songCount}
- User's vibe/mood: "${vibe}"

Please respond with a JSON object in this exact format:
{
  "name": "Creative playlist name here",
  "description": "A single compelling sentence that captures the playlist's mood and vibe",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

The playlist name should be extremely unique, creative, and different from typical playlist names. 
Use only one or two words. It should be lowercase. Avoid generic or common phrases and do NOT use words like "Rage", "Chill", "Vibes", "Energy", "Party", "Focus", "Mood", "Mix", "Playlist", or any other common playlist terms.
Invent a new word, use poetic language, or combine words in an unexpected way. 
Examples of good names: "nightglow", "vaporhaze", "glasswave", "solstice", "dreamtide", "pulsefield", "lumen", "aether", "velvetine", "mistline".

Description guidelines:
- Be poetic, artistic, or emotionally resonant — avoid clichés and generic phrases
- Capture the vibe using tone, feeling, or imagery — not specific genres or instruments
- Keep the sentence under 20 words
- No hashtags, emojis, or lists — just one strong sentence

The name should be catchy and reflect the vibe. 
The description should feel fresh and thoughtful — not robotic or overly promotional.
End with a period.

For the color palette, generate 3 vibrant, contrasting colors in hex format based on the vibe. 
IMPORTANT: Do NOT use black (#000000), white (#FFFFFF), or any very dark (#111111, #222222) or very light (#FEFEFE, #EEEEEE) colors. 
Choose rich, saturated colors that are visually distinct from each other and match the mood.

For the keywords, generate 3-5 specific music-related terms that would help find songs on Spotify. These should be:
- Genre names (e.g., "indie rock", "electronic", "jazz")
- Mood descriptors (e.g., "energetic", "chill", "romantic")
- Tempo indicators (e.g., "upbeat", "slow", "dance")
- Era or style (e.g., "80s", "acoustic", "synthwave")
- Artist types (e.g., "female vocalists", "instrumental")

Examples: ["indie pop", "energetic", "summer vibes"] or ["jazz", "chill", "late night"]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OpenAIError(
        errorData.error?.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenAIError('No response content from OpenAI');
    }

    // Try to parse the JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        name: parsed.name || 'My Playlist',
        description: parsed.description || 'A great mix of songs',
        colorPalette: parsed.colorPalette || ["#6366f1", "#8b5cf6", "#a855f7"],
        keywords: parsed.keywords || ["keyword1", "keyword2", "keyword3"],
      };
    } catch (parseError) {
      // If JSON parsing fails, extract name and description from text
      const lines = content.split('\n').filter((line: string) => line.trim());
      const name = lines.find((line: string) => line.includes('name') || line.includes('Name'))?.split(':')[1]?.trim().replace(/"/g, '') || 'My Playlist';
      const description = lines.find((line: string) => line.includes('description') || line.includes('Description'))?.split(':')[1]?.trim().replace(/"/g, '') || 'A great mix of songs';
      
      return { name, description, colorPalette: ["#6366f1", "#8b5cf6", "#a855f7"], keywords: ["keyword1", "keyword2", "keyword3"] };
    }
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError(`Failed to generate playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generatePlaylistCover = async (
  emojis: string[],
  vibe: string,
  playlistName: string,
  colorPalette: string[]
): Promise<string> => {
  if (!OPENAI_API_KEY) {
    throw new OpenAIError('OpenAI API key is not configured');
  }
  
  const colorString = colorPalette.join(', ');
  const prompt = `Create a high-quality album cover that completely fills a 1024x1024 canvas with no borders, frames, or empty areas. The style should be abstract, emotional, and inspired by the vibe "${vibe}" and the playlist name "${playlistName}".

Instructions:
- Use the following colors prominently in the composition: ${colorString}
- The artwork should feature soft gradients, painterly textures, and blurred organic shapes
- Incorporate a subtle grainy, analog film texture overlay throughout the entire canvas
- Avoid any sharp lines, symbols, objects, text, or recognizable forms
- The composition should feel hand-painted, artistic, and emotionally resonant
- Prioritize balance, aesthetic harmony, and atmospheric depth

Style:
- Abstract expressionism meets modern minimalism
- Think oil-on-canvas or watercolor with a digital twist
- Soft brush strokes, gradient blends, moody ambient textures

Mood:
- Evocative, immersive, tasteful, clean

Final Output:
- Square (1024x1024)
- Edge-to-edge artwork with no empty space
- Must look like a professional, organic, natural album cover rather than AI-generated art`;


  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OpenAIError(
        errorData.error?.message || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new OpenAIError('No image URL received from DALL-E');
    }

    return imageUrl;
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError(`Failed to generate playlist cover: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 