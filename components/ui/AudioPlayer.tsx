import * as React from 'react';
import { useRef } from 'react';
import { AudioPlayerProps } from '../types';

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  show
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  if (!show || !audioUrl) return null;
  
  return (
    <div className="audio-player mt-4 transition-all duration-500 ease-in-out transform">
      <audio 
        ref={audioRef}
        controls
        src={audioUrl}
        className="w-full rounded"
      />
    </div>
  );
}; 