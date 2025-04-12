import { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { initializeOpenAI, generatePodcastScript, generatePodcastAudio } from '../apiConfig';
import { Mention } from '../types';

interface UseOpenAIProps {
  apiKey: string;
  durationMinutes: number;
}

interface UseOpenAIReturn {
  openaiInstance: OpenAI | null;
  audioUrl: string;
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
      const script = await generatePodcastScript(
        openaiInstance,
        combinedContent,
        host1Name,
        host2Name,
        durationMinutes
      );
      
      // Log the script instead of displaying it
      console.log('Generated Podcast Script:');
      console.log(script);
      
      setIsGenerating(false);
      setIsGeneratingAudio(true);
      
      // Generate audio
      const url = await generatePodcastAudio(openaiInstance, script);
      setAudioUrl(url);
      setIsGeneratingAudio(false);
      setShowAudio(true);
      
    } catch (err: any) {
      console.error('Error generating podcast:', err);
      setError(err.message || 'Failed to generate podcast');
      setIsGenerating(false);
      setIsGeneratingAudio(false);
    }
  };

  return {
    openaiInstance,
    audioUrl,
    isGenerating,
    isGeneratingAudio,
    showAudio,
    error,
    setError,
    setShowAudio,
    generatePodcast
  };
}; 