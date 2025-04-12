import * as React from 'react';
import { useState, useEffect } from 'react';

interface SettingsProps {
  plugin: any;
  onSettingChange: (setting: string, value: any) => void;
  settings: {
    mySetting: string;
    openaiApiKey: string;
    podcastDurationMinutes: number;
  };
}

export const SettingsComponent: React.FC<SettingsProps> = ({ 
  plugin, 
  onSettingChange, 
  settings 
}) => {
  const [apiKey, setApiKey] = useState(settings.openaiApiKey);
  const [duration, setDuration] = useState(settings.podcastDurationMinutes.toString());

  useEffect(() => {
    setApiKey(settings.openaiApiKey);
    setDuration(settings.podcastDurationMinutes.toString());
  }, [settings]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setApiKey(newValue);
    onSettingChange('openaiApiKey', newValue);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDuration(newValue);
    onSettingChange('podcastDurationMinutes', parseInt(newValue) || 3);
  };

  return (
    <div className="settings-container">
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">OpenAI API Key</div>
          <div className="setting-item-description">Your OpenAI API key for generating podcasts</div>
        </div>
        <div className="setting-item-control">
          <input 
            type="password" 
            value={apiKey} 
            onChange={handleApiKeyChange}
            placeholder="sk-..."
            className="w-full px-2 py-1 border rounded"
          />
        </div>
      </div>

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Podcast Duration (minutes)</div>
          <div className="setting-item-description">Target length of generated podcast</div>
        </div>
        <div className="setting-item-control">
          <input 
            type="number" 
            value={duration} 
            onChange={handleDurationChange}
            min="1"
            max="10"
            className="w-20 px-2 py-1 border rounded"
          />
        </div>
      </div>
    </div>
  );
}; 