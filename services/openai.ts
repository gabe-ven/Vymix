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
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"]
}

The playlist name should be creative and short (1-4 words). Avoid generic names like "My Playlist" or "Chill Vibes".

The description should be one engaging sentence that captures the music's mood and atmosphere.

For the color palette, generate 5 vibrant, contrasting colors in hex format. Include both warm and cool tones for visual interest. Examples: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]`;

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
        colorPalette: parsed.colorPalette || ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9"],
      };
    } catch (parseError) {
      // If JSON parsing fails, extract name and description from text
      const lines = content.split('\n').filter((line: string) => line.trim());
      const name = lines.find((line: string) => line.includes('name') || line.includes('Name'))?.split(':')[1]?.trim().replace(/"/g, '') || 'My Playlist';
      const description = lines.find((line: string) => line.includes('description') || line.includes('Description'))?.split(':')[1]?.trim().replace(/"/g, '') || 'A great mix of songs';
      
      return { name, description, colorPalette: ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9"] };
    }
  } catch (error) {
    if (error instanceof OpenAIError) {
      throw error;
    }
    throw new OpenAIError(`Failed to generate playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 