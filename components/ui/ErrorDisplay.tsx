import * as React from 'react';

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="info-message">
      <p className="info-title">No File Selected</p>
      <p>
        Please attach a file to the note to generate a podcast.
      </p>
    </div>
  );
}; 