import * as React from 'react';
import { useState, useEffect } from 'react';
import { PodcastGeneratorProps } from './types';
import { PODCAST_HOSTS } from './constants';
import { useMentions } from './hooks/useMentions';
import { useOpenAI } from './hooks/useOpenAI';
import { Editor } from './ui/Editor';
import { MentionBadges } from './ui/MentionBadges';
import { AudioPlayer } from './ui/AudioPlayer';
import { GenerateButton } from './ui/GenerateButton';
import { ErrorDisplay } from './ui/ErrorDisplay';

export const PodcastGenerator: React.FC<PodcastGeneratorProps> = ({
  apiKey,
  durationMinutes,
  currentFileContent,
  currentFileName,
  app
}) => {
  const [editorContent, setEditorContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const host1Name = PODCAST_HOSTS.HOST1_NAME;
  const host2Name = PODCAST_HOSTS.HOST2_NAME;
  
  const SAMPLE_PROMPT_PLACEHOLDER = `e.g the hosts should use gen z slang.`;

  // OpenAI integration
  const {
    audioUrl,
    isGenerating,
    isGeneratingAudio,
    showAudio,
    error,
    generatePodcast
  } = useOpenAI({ apiKey, durationMinutes });

  // File mentions handling
  const {
    mentions,
    suggestedFiles,
    showFileSuggestions,
    setMentionSearchTerm,
    searchFiles,
    addFileToMentions,
    removeMention,
    setShowFileSuggestions,
    initializeWithCurrentFile
  } = useMentions({
    app,
    currentFileName,
    currentFileContent,
    editorContent,
    setEditorContent,
    cursorPosition
  });

  // Initialize with current file if available
  useEffect(() => {
    if (currentFileName && currentFileContent && !isInitialized) {
      const initializeAsync = async () => {
        await initializeWithCurrentFile();
        setIsInitialized(true);
      };
      
      initializeAsync();
    }
  }, [currentFileName, currentFileContent, isInitialized, initializeWithCurrentFile]);

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEditorContent(text);
    setCursorPosition(e.target.selectionStart);
    
    // Check for @ symbol to trigger file suggestions
    const lastAtIndex = text.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1 && lastAtIndex < text.length && !text.substring(lastAtIndex, cursorPosition).includes(' ')) {
      const searchTerm = text.substring(lastAtIndex + 1, cursorPosition).trim();
      setMentionSearchTerm(searchTerm);
      searchFiles(searchTerm);
      setShowFileSuggestions(true);
    } else {
      setShowFileSuggestions(false);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard navigation in suggestions
    if (showFileSuggestions && suggestedFiles.length > 0) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (suggestedFiles.length > 0) {
          addFileToMentions(suggestedFiles[0]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowFileSuggestions(false);
      }
    }
  };

  const handleGenerateClick = async () => {
    try {
      await generatePodcast(mentions, editorContent, host1Name, host2Name);
    } catch (err: any) {
      console.error('Error in handleGenerateClick:', err);
    }
  };

  return (
    <div className="podcast-generator p-2 flex flex-col">
      <ErrorDisplay error={error} />
      
      <Editor
        editorContent={editorContent}
        setEditorContent={setEditorContent}
        mentions={mentions}
        suggestedFiles={suggestedFiles}
        showFileSuggestions={showFileSuggestions}
        addFileToMentions={addFileToMentions}
        placeholder={SAMPLE_PROMPT_PLACEHOLDER}
        handleEditorChange={handleEditorChange}
        handleEditorKeyDown={handleEditorKeyDown}
      />
        
      
      <MentionBadges 
        mentions={mentions} 
        removeMention={removeMention} 
      />
      
      <GenerateButton 
        onClick={handleGenerateClick}
        disabled={isGenerating || isGeneratingAudio || !apiKey}
        isGenerating={isGenerating}
        isGeneratingAudio={isGeneratingAudio}
      />
      
      <AudioPlayer 
        audioUrl={audioUrl}
        show={showAudio}
      />
    </div>
  );
}; 