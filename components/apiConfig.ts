import OpenAI from 'openai';
import { PODCAST_HOSTS } from './constants';

// Initialize the OpenAI configuration
// NOTE: You should replace this with a secure way to store API keys
// For production, consider using environment variables or secure storage
export const initializeOpenAI = (apiKey: string): OpenAI => {
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // This is needed for client-side usage
  });
};

// Generate podcast script
export const generatePodcastScript = async (
  openai: OpenAI,
  content: string,
  host1Name = PODCAST_HOSTS.HOST1_NAME,
  host2Name = PODCAST_HOSTS.HOST2_NAME,
  durationMinutes = 3
): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI that creates podcast scripts for two hosts (${host1Name} and ${host2Name}) 
          discussing an article. The conversation should sound natural, with hosts sharing insights, asking questions, 
          and occasionally disagreeing on points. The podcast should be about ${durationMinutes} minutes long 
          when read at a normal speaking pace (approximately ${durationMinutes * 150} words).
          Format the output as a dialogue script with clearly labeled speakers.`
        },
        {
          role: "user",
          content: `Create a podcast script for ${host1Name} and ${host2Name} discussing this article: 
          
          ${content}
          
          Make it feel like a natural conversation between two knowledgeable hosts.`
        }
      ],
      temperature: 0.7,
      max_tokens: durationMinutes * 500, // Approximately (500 tokens per minute)
    });

    return response.choices[0]?.message?.content || "Failed to generate podcast script.";
  } catch (error) {
    console.error("Error generating podcast script:", error);
    throw error;
  }
};

// Generate audio from script
export const generatePodcastAudio = async (
  openai: OpenAI,
  script: string
): Promise<string> => {
  try {
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx",
      input: script,
    });
    
    // Convert the response to a blob URL that can be played in an audio element
    const audioBlob = await speechResponse.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return audioUrl;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
}; 