import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { ThreeDot } from 'react-loading-indicators';
interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isGenerating: boolean;
  isGeneratingAudio: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  disabled,
  isGenerating,
  isGeneratingAudio
}) => {
  const getButtonIcon = () => {
    if (isGenerating || isGeneratingAudio) {
      return (
        <ThreeDot color="#000000" size="small" text="" textColor="" />
      );
    }
    
    
    
    // Default microphone icon
    return (
      <Sparkles className="icon-size" />
    );
  };

  const getStatusText = () => {
    if (isGenerating) return "Generating script...";
    if (isGeneratingAudio) return "Converting to audio...";
    return "Ready to generate";
  };

  const getButtonClass = () => {
    if (isGenerating || isGeneratingAudio) {
      return 'podcast-button podcast-button-active';
    }
    if (disabled) {
      return 'podcast-button podcast-button-disabled';
    }
    return 'podcast-button podcast-button-default';
  };

  return (
    <div className="podcast-button-container">
      <div className="podcast-status-text">
        {getStatusText()}
      </div>
      
      <button
        onClick={onClick}
        disabled={disabled}
        className={getButtonClass()}
        title="Generate Podcast"
      >
        {getButtonIcon()}
      </button>
    </div>
  );
}; 