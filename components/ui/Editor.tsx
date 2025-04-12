import * as React from 'react';
import { useRef, useEffect } from 'react';
import { EditorProps } from '../types';

export const Editor: React.FC<EditorProps> = ({
  editorContent,
  setEditorContent,
  mentions,
  suggestedFiles,
  showFileSuggestions,
  addFileToMentions,
  placeholder,
  handleEditorChange,
  handleEditorKeyDown
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editorOverlayRef = useRef<HTMLDivElement>(null);

  // Update the highlighted content when editor content or mentions change
  useEffect(() => {
    if (!editorOverlayRef.current) return;
    
    let content = editorContent;
    
    // Replace all @mentions with highlighted versions
    mentions.forEach(mention => {
      const regex = new RegExp(`@${mention.display}\\b`, 'g');
      content = content.replace(regex, `<span class="mention-highlight">@${mention.display}</span>`);
    });
    
    // Handle line breaks
    content = content.replace(/\n/g, '<br>');
    
    // Add a space at the end to ensure cursor space at the end of the content
    if (content.length > 0) {
      content += '&nbsp;';
    }
    
    editorOverlayRef.current.innerHTML = content || '&nbsp;';
  }, [editorContent, mentions]);

  return (
    <div className="cursor-editor relative mb-2 flex-grow">

      <textarea
        ref={editorRef}
        value={editorContent}
        onChange={handleEditorChange}
        onKeyDown={handleEditorKeyDown}
        placeholder={placeholder}
        className="w-full h-32 p-3 border rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono text-sm text-transparent bg-transparent caret-gray-700"
      />
      
      {showFileSuggestions && suggestedFiles.length > 0 && (
        <div className="file-suggestions absolute left-0 mt-1 bg-white border rounded shadow-lg z-10 w-full max-h-40 overflow-y-auto">
          {suggestedFiles.map(file => (
            <div 
              key={file} 
              className="suggestion p-2 hover:bg-gray-100 cursor-pointer text-sm truncate"
              onClick={() => addFileToMentions(file)}
            >
              {file}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 