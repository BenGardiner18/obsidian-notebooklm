import * as React from 'react';
import { MentionBadgesProps } from '../types';
import { X } from 'lucide-react';

export const MentionBadges: React.FC<MentionBadgesProps> = ({
  mentions,
  removeMention
}) => {
  if (mentions.length === 0) return null;
  
  return (
    <div className="mentioned-files">
      {mentions.map(mention => (
        <button 
          key={mention.path}
          onClick={() => removeMention(mention.path)}
          className="mention-badge"
          title="Click to remove this file"
        >
          <span className="mention-text">{mention.display}</span>
          <X className="mention-remove-icon" />
        </button>
      ))}
    </div>
  );
}; 