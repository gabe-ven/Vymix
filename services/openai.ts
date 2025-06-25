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
Use only one or two words. Avoid generic or common phrases and do NOT use words like "Rage", "Chill", "Vibes", "Energy", "Party", "Focus", "Mood", "Mix", "Playlist", or any other common playlist terms.
Invent a new word, use poetic language, or combine words in an unexpected way. 
Examples of good names: "Nightglow", "Vaporhaze", "Glasswave", "Solstice", "Dreamtide", "Pulsefield", "Lumen", "Aether", "Velvetine", "Mistline".

The description should be one engaging sentence that captures the music's mood and atmosphere. End with a period.

For the color palette, generate 3 vibrant, contrasting colors in hex format based on the vibe. 
IMPORTANT: Do NOT use black (#000000), white (#FFFFFF), or any very dark (#111111, #222222) or very light (#FEFEFE, #EEEEEE) colors. 
Choose rich, saturated colors that are visually distinct from each other and match the mood.
Examples of good color palettes: ["#FF6B6B", "#4ECDC4", "#45B7D1"] or ["#A8E6CF", "#DCEDC1", "#FFD3B6"] or ["#FF9A9E", "#FECFEF", "#FECFEF"].

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
  
  const prompt = `Create a playlist album cover that completely fills a 1024x1024 square canvas. The artwork should be inspired by the feeling "${vibe}" and the playlist name "${playlistName}".

CRITICAL REQUIREMENTS:
- The artwork MUST fill the ENTIRE 1024x1024 canvas from edge to edge with no borders, frames, or empty space
- Use these specific colors in the design: ${colorString}
- Create a blurry, grainy, painted environment style that evokes mood and atmosphere
- NO specific scenes, objects, symbols, text, or recognizable imagery
- Only soft, blurred, painterly shapes, gradients, and textures using the provided colors
- Strong grainy film texture overlay throughout the entire image
- Modern, unique, and visually clean aesthetic
- The image should feel like a tasteful, understated, artistic album cover

Style: Abstract, atmospheric, mood-based, painterly, grainy, blurred gradients and shapes that fill the entire canvas using the specified color palette.`;

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