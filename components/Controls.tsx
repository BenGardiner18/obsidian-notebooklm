import * as React from 'react';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious 
}) => {
  return (
    <div className="controls flex justify-center items-center space-x-8 my-4">
      {/* Previous Button */}
      <button 
        onClick={onPrevious}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        aria-label="Previous track"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"></path>
        </svg>
      </button>
      
      {/* Play/Pause Button */}
      <button 
        onClick={onPlayPause}
        className="p-3 bg-green-500 rounded-full hover:bg-green-400 transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
          </svg>
        ) : (
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        )}
      </button>
      
      {/* Next Button */}
      <button 
        onClick={onNext}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        aria-label="Next track"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18 14.5 12 6 6v12zm8 0h2V6h-2v12z"></path>
        </svg>
      </button>
    </div>
  );
}; 