import * as React from 'react';
import { useRef } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentTime, 
  duration, 
  onSeek 
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const progressPercentage = (currentTime / duration) * 100;
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = clickPosition / rect.width;
      const newTime = Math.max(0, Math.min(duration, duration * percentage));
      onSeek(newTime);
    }
  };

  return (
    <div className="progress-container mt-4 mb-2">
      <div 
        ref={progressRef}
        className="progress-bar h-1 bg-gray-700 rounded-full cursor-pointer"
        onClick={handleSeek}
      >
        <div 
          className="progress-filled h-full bg-green-500 rounded-full"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="time-display flex justify-between text-xs text-gray-400 mt-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}; 