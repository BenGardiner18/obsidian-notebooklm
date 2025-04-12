import { useState } from 'react';
import { App, TFile } from 'obsidian';
import { Mention } from '../types';

interface UseMentionsProps {
  app: App;
  currentFileName: string;
  currentFileContent: string;
  editorContent: string;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
  cursorPosition: number;
}

interface UseMentionsReturn {
  mentions: Mention[];
  suggestedFiles: string[];
  showFileSuggestions: boolean;
  mentionSearchTerm: string;
  setMentionSearchTerm: (term: string) => void;
  searchFiles: (query: string) => Promise<void>;
  addFileToMentions: (filePath: string, content?: string) => Promise<void>;
  removeMention: (path: string) => void;
  setShowFileSuggestions: (show: boolean) => void;
  initializeWithCurrentFile: () => Promise<void>;
}

export const useMentions = ({
  app,
  currentFileName,
  currentFileContent,
  editorContent,
  setEditorContent,
  cursorPosition
}: UseMentionsProps): UseMentionsReturn => {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [suggestedFiles, setSuggestedFiles] = useState<string[]>([]);
  const [showFileSuggestions, setShowFileSuggestions] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');

  const searchFiles = async (query: string): Promise<void> => {
    try {
      const files = app.vault.getMarkdownFiles();
      const results = files
        .filter(file => 
          query === '' || 
          file.path.toLowerCase().includes(query.toLowerCase()) || 
          file.basename.toLowerCase().includes(query.toLowerCase())
        )
        .map(file => file.path)
        .slice(0, 5); // Limit to 5 results for performance
        
      setSuggestedFiles(results);
    } catch (err) {
      console.error('Error searching files:', err);
      setSuggestedFiles([]);
    }
  };

  const addFileToMentions = async (filePath: string, content?: string): Promise<void> => {
    try {
      // If content is not provided, read it from the file
      let fileContent = content;
      if (!fileContent) {
        const file = app.vault.getAbstractFileByPath(filePath);
        if (!file || !(file instanceof TFile)) {
          throw new Error(`File not found or not a file: ${filePath}`);
        }
        fileContent = await app.vault.read(file);
      }
      
      // Create a shorthand display name (just the filename without extension)
      const displayName = filePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || filePath;
      
      // Add to mentions
      const newMention: Mention = {
        path: filePath,
        content: fileContent,
        display: displayName
      };
      
      setMentions(prev => {
        // Don't add duplicates
        if (prev.some(m => m.path === filePath)) return prev;
        return [...prev, newMention];
      });
      
      // Replace the @mention in the editor with the display name if this is from user typing
      if (mentionSearchTerm) {
        const atIndex = editorContent.lastIndexOf('@', cursorPosition);
        if (atIndex !== -1) {
          const newText = editorContent.substring(0, atIndex) + 
                          `@${displayName} ` + 
                          editorContent.substring(cursorPosition);
          setEditorContent(newText);
        }
      }
      
      setShowFileSuggestions(false);
      
    } catch (err) {
      console.error('Error adding file to mentions:', err);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  };

  // Handle removing mentions from both the list and editor content
  const removeMention = (path: string): void => {
    // Find the mention to remove
    const mentionToRemove = mentions.find(m => m.path === path);
    if (!mentionToRemove) return;
    
    // Remove from mentions array
    setMentions(prev => prev.filter(m => m.path !== path));
    
    // Remove from editor content
    const regex = new RegExp(`@${mentionToRemove.display}\\s*`, 'g');
    setEditorContent(prev => prev.replace(regex, ''));
  };

  const initializeWithCurrentFile = async (): Promise<void> => {
    if (currentFileName && currentFileContent) {
      const displayName = currentFileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || currentFileName;
      
      // Add the file to mentions
      await addFileToMentions(currentFileName, currentFileContent);
      
      // Update the editor content to show the mention
      setEditorContent(`@${displayName} `);
    }
  };

  return {
    mentions,
    suggestedFiles,
    showFileSuggestions,
    mentionSearchTerm,
    setMentionSearchTerm,
    searchFiles,
    addFileToMentions,
    removeMention,
    setShowFileSuggestions,
    initializeWithCurrentFile
  };
}; 