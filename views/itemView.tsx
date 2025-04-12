import { App, ItemView, MarkdownView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PodcastGenerator } from '../components/PodcastGenerator';
import { PODCAST_HOSTS } from '../components/constants';

export const VIEW_TYPE_EXAMPLE = 'example-view';

// PlayerView component (now included directly in this file)
interface PlayerViewProps {
  apiKey: string;
  podcastDurationMinutes: number;
  app: App; // Obsidian app instance
}

const PlayerView: React.FC<PlayerViewProps> = ({
  apiKey,
  podcastDurationMinutes,
  app
}) => {
  const { HOST1_NAME, HOST2_NAME } = PODCAST_HOSTS;
  const [currentFile, setCurrentFile] = React.useState<{ name: string; content: string } | null>(null);
  
  // Get the current file when the component mounts or app changes
  React.useEffect(() => {
    const getCurrentFile = async () => {
      // Get the currently active leaf
      const activeLeaf = app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeLeaf) {
        setCurrentFile(null);
        return;
      }
      
      try {
        // Get the file from the active leaf
        const file = activeLeaf.file;
        if (!file) {
          setCurrentFile(null);
          return;
        }
        
        // Read the file content
        const content = await app.vault.read(file);
        setCurrentFile({
          name: file.path,
          content
        });
      } catch (err) {
        console.error('Error reading current file:', err);
        setCurrentFile(null);
      }
    };
    
    getCurrentFile();
    
    // Set up event listener for file changes
    const onFileOpen = () => {
      getCurrentFile();
    };
    
    app.workspace.on('file-open', onFileOpen);
    
    return () => {
      app.workspace.off('file-open', onFileOpen);
    };
  }, [app]);
  
  return (
    <div className="podcast-player-container">
      <div className="podcast-header">
        <h1>AI Podcast Generator</h1>
        {/* <p>
          Transform your notes into an engaging podcast conversation 
          between {HOST1_NAME} and {HOST2_NAME}.
        </p> */}
      </div>
      
      {!apiKey ? (
        <div className="warning-message">
          <p className="warning-title">OpenAI API Key Required</p>
          <p>
            Please add your OpenAI API key in the plugin settings to generate podcasts.
            Go to Settings &gt; Plugin Options &gt; AI Podcast Generator.
          </p>
        </div>
      // ) : !currentFile?.content ? (
      //   <div className="info-message">
      //     <p className="info-title">No File Selected</p>
      //     <p>
      //       Please open a markdown file in Obsidian to generate a podcast from its content.
      //     </p>
      //   </div>
      ) : (
        <PodcastGenerator
          apiKey={apiKey}
          durationMinutes={podcastDurationMinutes}
          currentFileContent={currentFile?.content || ''}
          currentFileName={currentFile?.name || ''}
          app={app}
        />
      )}
    </div>
  );
};

// ExampleView class
export class ExampleView extends ItemView {
  private root: Root | null = null;
  private plugin: any;

  constructor(leaf: WorkspaceLeaf, plugin: any) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'AI Podcast Generator';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    
    // Create a div that React will render into
    const reactContainer = container.createDiv();
    reactContainer.addClass('podcast-generator-container');
    
    // Create a root and render the React component with plugin settings
    this.root = createRoot(reactContainer);
    
    // Pass plugin settings and app instance to PlayerView
    this.root.render(
      React.createElement(PlayerView, {
        apiKey: this.plugin.settings.openaiApiKey,
        podcastDurationMinutes: this.plugin.settings.podcastDurationMinutes,
        app: this.app
      })
    );
    
    // Add CSS for full height container
    this.containerEl.addClass('podcast-generator-view');
  }

  async onClose() {
    // Clean up React component
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    
    this.containerEl.removeClass('podcast-generator-view');
  }
} 