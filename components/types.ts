import { App } from 'obsidian';

export interface PodcastGeneratorProps {
  apiKey: string;
  durationMinutes: number;
  currentFileContent: string;
  currentFileName: string;
  app: App;
}

export interface Mention {
  path: string;
  content: string;
  display: string;
}

export interface EditorProps {
  editorContent: string;
  setEditorContent: (content: string) => void;
  mentions: Mention[];
  suggestedFiles: string[];
  showFileSuggestions: boolean;
  addFileToMentions: (filePath: string) => void;
  placeholder: string;
  handleEditorChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleEditorKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export interface MentionBadgesProps {
  mentions: Mention[];
  removeMention: (path: string) => void;
}

export interface AudioPlayerProps {
  audioUrl: string;
  show: boolean;
} 