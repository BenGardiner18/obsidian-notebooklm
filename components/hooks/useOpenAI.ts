import { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { initializeOpenAI, generatePodcastScript, generatePodcastAudio } from '../apiConfig';
import { Mention } from '../types';

// Define interface for dialog entry
interface DialogEntry {
  speaker: string;
  text: string;
}

interface UseOpenAIProps {
  apiKey: string;
  durationMinutes: number;
}

interface UseOpenAIReturn {
  openaiInstance: OpenAI | null;
  audioUrl: string;
  dialogData: DialogEntry[];
  isGenerating: boolean;
  isGeneratingAudio: boolean;
  showAudio: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setShowAudio: React.Dispatch<React.SetStateAction<boolean>>;
  generatePodcast: (mentions: Mention[], additionalInstructions: string, host1Name: string, host2Name: string) => Promise<void>;
}

export const useOpenAI = ({
  apiKey,
  durationMinutes
}: UseOpenAIProps): UseOpenAIReturn => {
  const [openaiInstance, setOpenaiInstance] = useState<OpenAI | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [dialogData, setDialogData] = useState<DialogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [error, setError] = useState('');

  // Initialize OpenAI instance when API key changes
  useEffect(() => {
    if (apiKey) {
      try {
        const openai = initializeOpenAI(apiKey);
        setOpenaiInstance(openai);
        setError('');
      } catch (err) {
        console.error('Error initializing OpenAI:', err);
        setError('Invalid API key format');
      }
    } else {
      setOpenaiInstance(null);
    }
  }, [apiKey]);

  const generatePodcast = async (
    mentions: Mention[],
    additionalInstructions: string,
    host1Name: string,
    host2Name: string
  ): Promise<void> => {
    if (!openaiInstance) {
      setError('Please enter a valid OpenAI API key in settings');
      return;
    }
    
    if (mentions.length === 0) {
      setError('Please mention at least one file using @filename');
      return;
    }
    
    setError('');
    setIsGenerating(true);
    setShowAudio(false);
    setAudioUrl('');
    setDialogData([]);
    
    let scriptJson = '';
    
    try {
      // Combine mentions content
      let combinedContent = '';
      mentions.forEach(mention => {
        combinedContent += `# ${mention.path}\n${mention.content}\n\n`;
      });
      
      // Add editor content as additional context/instructions
      if (additionalInstructions.trim()) {
        combinedContent += `\nAdditional instructions:\n${additionalInstructions.trim()}\n`;
      }
      
      // Generate script
      console.log("Generating podcast script...");
      scriptJson = await generatePodcastScript(
        openaiInstance,
        combinedContent,
        host1Name,
        host2Name,
        durationMinutes
      );
      
      // Parse the JSON dialog
      try {
        const parsedDialog = JSON.parse(scriptJson) as DialogEntry[];
        
        if (parsedDialog && Array.isArray(parsedDialog) && parsedDialog.length > 0) {
          setDialogData(parsedDialog);
          console.log(`Successfully loaded ${parsedDialog.length} dialog entries`);
        } else {
          console.warn('Dialog parsed but appears invalid:', parsedDialog);
        }
      } catch (parseErr) {
        console.error('Error parsing dialog JSON:', parseErr);
        // Don't set an error yet - continue with audio generation as we may still have valid content
      }
      
      setIsGenerating(false);
      setIsGeneratingAudio(true);
      
      // Generate audio with robust error handling
      try {
        console.log("Generating podcast audio...");
        const url = await generatePodcastAudio(openaiInstance, scriptJson);
        setAudioUrl(url);
        setIsGeneratingAudio(false);
        setShowAudio(true);
      } catch (audioErr: any) {
        console.error('Error generating audio:', audioErr);
        setError(`Audio generation failed: ${audioErr.message || 'Unknown error'}`);
        setIsGeneratingAudio(false);
        
        // Try fallback audio generation if needed
        if (scriptJson) {
          console.log("Attempting fallback audio generation...");
          try {
            // Try parsing as JSON one more time in case it's valid but not in our expected format
            let textToConvert = scriptJson;
            try {
              const parsedJson = JSON.parse(scriptJson);
              if (typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
                // If it's a single object, extract its text content
                textToConvert = Object.values(parsedJson)
                  .filter(val => typeof val === 'string')
                  .join('\n');
              }
            } catch (e) {
              // If parsing fails, use the script text directly
            }
            
            // Limit the text length for the API
            const limitedText = textToConvert.substring(0, 4000);
            
            const fallbackResponse = await openaiInstance.audio.speech.create({
              model: "tts-1",
              voice: "alloy", // Neutral fallback voice
              input: limitedText,
            });
            
            const audioBlob = await fallbackResponse.blob();
            const fallbackUrl = URL.createObjectURL(audioBlob);
            setAudioUrl(fallbackUrl);
            setShowAudio(true);
            setError("Used fallback audio generation with a single voice");
          } catch (fallbackErr) {
            console.error("Fallback audio generation also failed:", fallbackErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Error generating podcast:', err);
      setError(`Podcast generation failed: ${err.message || 'Unknown error'}`);
      setIsGenerating(false);
      setIsGeneratingAudio(false);
    }
  };

  return {
    openaiInstance,
    audioUrl,
    dialogData,
    isGenerating,
    isGeneratingAudio,
    showAudio,
    error,
    setError,
    setShowAudio,
    generatePodcast
  };
}; 