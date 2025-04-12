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

// Add host voice configuration
export const HOST_VOICES = {
  HOST1: "onyx", // Male voice
  HOST2: "nova", // Female voice
};

// Generate podcast script as structured JSON
export const generatePodcastScript = async (
  openai: OpenAI,
  content: string,
  host1Name = PODCAST_HOSTS.HOST1_NAME,
  host2Name = PODCAST_HOSTS.HOST2_NAME,
  durationMinutes = 3
): Promise<string> => {
  try {
    console.log("Generating podcast script with structured format...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI that creates podcast scripts for two hosts (${host1Name} and ${host2Name}) 
          discussing an article. The conversation should sound natural, with hosts sharing insights, asking questions, 
          and occasionally disagreeing on points. The podcast should be about ${durationMinutes} minutes long 
          when read at a normal speaking pace (approximately ${durationMinutes * 150} words).
          
          Return your response as an array of dialog objects, each with 'speaker' and 'text' fields:
          [
            {"speaker": "${host1Name}", "text": "Hello and welcome to the show..."},
            {"speaker": "${host2Name}", "text": "Thanks for having me..."},
            ...
          ]
          
          Make the response valid JSON. Start with the array directly.`
        },
        {
          role: "user",
          content: `Create a podcast script for ${host1Name} and ${host2Name} discussing this article: 
          
          ${content}
          
          Make it feel like a natural conversation between two knowledgeable hosts. Format it as a valid JSON array of dialog objects.`
        }
      ],
      temperature: 0.7,
      max_tokens: durationMinutes * 500, // Approximately (500 tokens per minute)
    });

    const responseContent = response.choices[0]?.message?.content || "[]";
    console.log("Raw API response:", responseContent);
    
    // Try to parse the JSON response
    try {
      // First, check if the response is a valid JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(responseContent);
      } catch (initialParseError) {
        // If direct parsing fails, try to extract JSON array from text
        const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not extract valid JSON from response");
        }
      }
      
      // Convert the content to an array of dialog entries
      let dialogArray;
      
      if (Array.isArray(parsedContent)) {
        // If it's already an array, use it directly
        dialogArray = parsedContent;
      } else if (parsedContent && typeof parsedContent === 'object') {
        // If it's an object with nested arrays like {dialog: [...]} or {transcript: [...]}
        if (Array.isArray(parsedContent.dialog)) {
          dialogArray = parsedContent.dialog;
        } else if (Array.isArray(parsedContent.transcript)) {
          dialogArray = parsedContent.transcript;
        } else if (Array.isArray(parsedContent.conversations)) {
          dialogArray = parsedContent.conversations;
        } else {
          // If we find a single entry object with speaker/text fields
          if (parsedContent.speaker && parsedContent.text) {
            dialogArray = [parsedContent];
          } else {
            // Try to convert the object to an array of entries
            dialogArray = Object.values(parsedContent).filter(entry => 
              entry && typeof entry === 'object' && 'speaker' in entry && 'text' in entry
            );
          }
        }
      }
      
      // Validate that dialogArray exists and has entries
      if (!dialogArray || !Array.isArray(dialogArray) || dialogArray.length === 0) {
        console.error("Could not extract dialog array from:", parsedContent);
        
        // Last resort: manually parse the text into dialog format
        if (typeof responseContent === 'string' && responseContent.includes(':')) {
          const manualDialogArray = convertTextToDialogFormat(responseContent, host1Name, host2Name);
          if (manualDialogArray.length > 0) {
            console.log("Using manually parsed dialog from text");
            return JSON.stringify(manualDialogArray, null, 2);
          }
        }
        
        throw new Error("Could not parse valid dialog structure");
      }
      
      // Validate that each entry has speaker and text fields
      const validatedDialog = dialogArray.filter(entry => 
        entry && typeof entry === 'object' && 
        'speaker' in entry && typeof entry.speaker === 'string' &&
        'text' in entry && typeof entry.text === 'string'
      );
      
      if (validatedDialog.length === 0) {
        throw new Error("No valid dialog entries found");
      }
      
      // Return the validated dialog array
      console.log("Successfully parsed dialog with", validatedDialog.length, "entries");
      return JSON.stringify(validatedDialog, null, 2);
      
    } catch (parseError) {
      console.error("Error parsing script JSON:", parseError);
      
      // Fallback: try to convert text to dialog format
      if (typeof responseContent === 'string') {
        const manualDialogArray = convertTextToDialogFormat(responseContent, host1Name, host2Name);
        if (manualDialogArray.length > 0) {
          console.log("Using fallback: manually parsed dialog from text");
          return JSON.stringify(manualDialogArray, null, 2);
        }
      }
      
      throw new Error("Failed to parse script into valid format");
    }
  } catch (error) {
    console.error("Error generating podcast script:", error);
    throw error;
  }
};

// Helper function to convert text responses to dialog format
function convertTextToDialogFormat(text: string, host1Name: string, host2Name: string) {
  const lines = text.split('\n');
  const dialogArray = [];
  let currentSpeaker = "";
  let currentText = "";
  
  const hostNames = [host1Name, host2Name, "Host1", "Host2", "HOST1", "HOST2"];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check if line starts with a speaker indicator
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex > 0) {
      const possibleSpeaker = trimmedLine.substring(0, colonIndex).trim();
      
      // Save previous speaker's text if we have one
      if (currentSpeaker && currentText) {
        dialogArray.push({
          speaker: currentSpeaker,
          text: currentText.trim()
        });
      }
      
      // Determine if this is actually a speaker
      const isSpeaker = hostNames.some(name => 
        possibleSpeaker.toLowerCase().includes(name.toLowerCase())
      );
      
      if (isSpeaker) {
        currentSpeaker = possibleSpeaker;
        currentText = trimmedLine.substring(colonIndex + 1).trim();
      } else {
        // Not a recognized speaker, continue with current speaker
        if (currentSpeaker) {
          currentText += " " + trimmedLine;
        } else {
          // If no current speaker, assume first host
          currentSpeaker = host1Name;
          currentText = trimmedLine;
        }
      }
    } else {
      // Continue with current speaker's text
      if (currentSpeaker) {
        currentText += " " + trimmedLine;
      } else {
        // If no current speaker, assume first host
        currentSpeaker = host1Name;
        currentText = trimmedLine;
      }
    }
  }
  
  // Add the last speaker's text
  if (currentSpeaker && currentText) {
    dialogArray.push({
      speaker: currentSpeaker,
      text: currentText.trim()
    });
  }
  
  return dialogArray;
}

// Update the TTS configuration to use dynamic voice selection
export const getTTSConfig = (text: string, voice: string) => ({
  model: "tts-1",
  voice: voice,
  input: text,
});

// Generate audio from script using JSON structure
export const generatePodcastAudio = async (
  openai: OpenAI,
  scriptJson: string
): Promise<string> => {
  try {
    console.log("Starting audio generation with JSON script");
    
    // Check if script is empty
    if (!scriptJson || scriptJson.trim() === "") {
      throw new Error("Empty script provided");
    }
    
    // Parse JSON script
    let dialogArray;
    try {
      dialogArray = JSON.parse(scriptJson);
      console.log(`Parsed script with ${dialogArray.length} dialog entries`);
    } catch (parseError) {
      console.error("Error parsing script JSON:", parseError);
      // Fallback to text parsing if JSON parsing fails
      return generateLegacyAudio(openai, scriptJson);
    }
    
    // Check if dialogArray is valid
    if (!Array.isArray(dialogArray) || dialogArray.length === 0) {
      console.error("Invalid dialog array structure:", dialogArray);
      return generateLegacyAudio(openai, scriptJson);
    }
    
    // Map host names to voice types
    const voiceMap = new Map();
    
    // Audio blobs for each speaker
    const audioChunks: Blob[] = [];
    
    // Process each dialog entry
    for (const entry of dialogArray) {
      // Skip invalid entries
      if (!entry.speaker || !entry.text) {
        console.warn("Skipping invalid dialog entry:", entry);
        continue;
      }
      
      // Determine which voice to use based on speaker name
      let voice = HOST_VOICES.HOST1; // Default
      
      // Normalize speaker name for comparison
      const speakerNormalized = entry.speaker.toLowerCase();
      
      // First, check if we've already assigned a voice to this speaker
      if (voiceMap.has(speakerNormalized)) {
        voice = voiceMap.get(speakerNormalized);
      } else {
        // Assign voice based on speaker patterns
        if (speakerNormalized.includes("host1") || 
            speakerNormalized.includes("jordan")) {
          voice = HOST_VOICES.HOST1;
          voiceMap.set(speakerNormalized, HOST_VOICES.HOST1);
        } else if (speakerNormalized.includes("host2") || 
                  speakerNormalized.includes("alex")) {
          voice = HOST_VOICES.HOST2;
          voiceMap.set(speakerNormalized, HOST_VOICES.HOST2);
        } else {
          // For unknown speakers, alternate voices based on order
          voice = voiceMap.size % 2 === 0 ? HOST_VOICES.HOST1 : HOST_VOICES.HOST2;
          voiceMap.set(speakerNormalized, voice);
        }
      }
      
      // Generate audio for this dialog line
      try {
        console.log(`Generating audio for ${entry.speaker} with voice ${voice}`);
        
        // Limit text length to avoid API errors
        const limitedText = entry.text.substring(0, 4096);
        
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice,
          input: limitedText,
        });
        
        const audioBlob = await response.blob();
        audioChunks.push(audioBlob);
      } catch (error) {
        console.error(`Error generating audio for ${entry.speaker}:`, error);
        // Add an empty blob to maintain sequence
        audioChunks.push(new Blob([], { type: 'audio/mpeg' }));
      }
    }
    
    // Handle case where no audio was generated
    if (audioChunks.length === 0) {
      throw new Error("Failed to generate any audio clips");
    }
    
    // Create combined audio blob
    console.log(`Created ${audioChunks.length} audio chunks`);
    const combinedBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(combinedBlob);
    
    return audioUrl;
  } catch (error) {
    console.error("Error generating audio with JSON script:", error);
    throw error;
  }
};

// Legacy audio generation (fallback)
async function generateLegacyAudio(openai: OpenAI, script: string): Promise<string> {
  console.log("Falling back to legacy audio generation");
  // Process script to extract dialogue by host
  const scriptParts = parseScriptByHost(script);
  
  // For debugging - use a single voice if parsing fails
  if (scriptParts.host1.length === 0 && scriptParts.host2.length === 0) {
    console.log("Using single voice generation");
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: HOST_VOICES.HOST1,
      input: script.substring(0, 4096), // Limit input length
    });
    
    // Return single audio URL
    const audioBlob = await speechResponse.blob();
    return URL.createObjectURL(audioBlob);
  }
  
  // Original implementation for non-JSON scripts
  console.log("Using multi-voice legacy generation");
  // Generate audio for each host
  console.log("Generating audio for Host 1");
  const host1Blobs = await Promise.all(
    scriptParts.host1.map(async (text) => {
      try {
        // Limit text length to avoid API errors
        const limitedText = text.substring(0, 4096);
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: HOST_VOICES.HOST1,
          input: limitedText,
        });
        return await response.blob();
      } catch (error) {
        console.error("Error generating Host 1 audio:", error);
        // Return an empty blob on error to maintain sequence
        return new Blob([], { type: 'audio/mpeg' });
      }
    })
  );
  
  console.log("Generating audio for Host 2");
  const host2Blobs = await Promise.all(
    scriptParts.host2.map(async (text) => {
      try {
        // Limit text length to avoid API errors
        const limitedText = text.substring(0, 4096);
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: HOST_VOICES.HOST2,
          input: limitedText,
        });
        return await response.blob();
      } catch (error) {
        console.error("Error generating Host 2 audio:", error);
        // Return an empty blob on error to maintain sequence
        return new Blob([], { type: 'audio/mpeg' });
      }
    })
  );
  
  console.log("Combining audio clips");
  // Combine audio clips in sequence
  const audioChunks = [];
  let host1Index = 0;
  let host2Index = 0;
  
  for (const part of scriptParts.sequence) {
    if (part === 'HOST1' && host1Index < host1Blobs.length) {
      audioChunks.push(host1Blobs[host1Index]);
      host1Index++;
    } else if (part === 'HOST2' && host2Index < host2Blobs.length) {
      audioChunks.push(host2Blobs[host2Index]);
      host2Index++;
    }
  }
  
  // Create combined audio blob
  console.log(`Created ${audioChunks.length} audio chunks`);
  const combinedBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(combinedBlob);
  
  return audioUrl;
}

// Helper function to parse script by host
function parseScriptByHost(script: string) {
  const lines = script.split('\n');
  const host1Lines: string[] = [];
  const host2Lines: string[] = [];
  const sequence: ('HOST1' | 'HOST2')[] = [];
  
  // Names that might appear in the script (case insensitive)
  const host1Patterns = ['host1:', 'jordan:', 'alex:'];
  const host2Patterns = ['host2:', 'alex:', 'jordan:'];
  
  let currentHost: 'HOST1' | 'HOST2' | null = null;
  let currentText = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check for speaker change
    const lowerLine = trimmedLine.toLowerCase();
    const isHost1Line = host1Patterns.some(pattern => lowerLine.startsWith(pattern.toLowerCase()));
    const isHost2Line = host2Patterns.some(pattern => lowerLine.startsWith(pattern.toLowerCase()));
    
    if (isHost1Line || isHost2Line) {
      // Save previous speaker's text
      if (currentHost && currentText) {
        if (currentHost === 'HOST1') {
          host1Lines.push(currentText);
        } else {
          host2Lines.push(currentText);
        }
      }
      
      // Set new speaker
      currentHost = isHost1Line ? 'HOST1' : 'HOST2';
      sequence.push(currentHost);
      
      // Extract text after colon
      const colonIndex = trimmedLine.indexOf(':');
      currentText = colonIndex > -1 ? trimmedLine.substring(colonIndex + 1).trim() : '';
    } else if (currentHost) {
      // Continue current speaker's text
      currentText += ' ' + trimmedLine;
    }
  }
  
  // Add the last speaker's text
  if (currentHost && currentText) {
    if (currentHost === 'HOST1') {
      host1Lines.push(currentText);
    } else {
      host2Lines.push(currentText);
    }
  }
  
  return { host1: host1Lines, host2: host2Lines, sequence };
} 