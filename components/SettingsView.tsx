import React from 'react';
import { themes } from '../utils/themes';
import { ThemeId } from '../types';
import { Palette } from 'lucide-react';

interface Props {
  currentTheme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const SettingsView: React.FC<Props> = ({ currentTheme, setTheme }) => {
  return (
    <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border p-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-skin-text mb-6 flex items-center gap-2">
        <Palette className="w-5 h-5 text-skin-primary" />
        Appearance & Themes
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.values(themes).map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all text-left group
              ${currentTheme === theme.id 
                ? 'border-skin-primary ring-2 ring-skin-primary/20' 
                : 'border-skin-border hover:border-skin-muted/50'}
            `}
            style={{ backgroundColor: theme.colors.card }}
          >
            {/* Color Preview Swatches */}
            <div className="flex gap-2 mb-3">
              <div 
                className="w-6 h-6 rounded-full border shadow-sm"
                style={{ backgroundColor: theme.colors.base, borderColor: theme.colors.border }}
              />
              <div 
                className="w-6 h-6 rounded-full border shadow-sm"
                style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.border }}
              />
              <div 
                className="w-6 h-6 rounded-full border shadow-sm"
                style={{ backgroundColor: theme.colors.text, borderColor: theme.colors.border }}
              />
            </div>
            
            <div className="font-semibold" style={{ color: theme.colors.text }}>{theme.name}</div>
            <div className="text-xs mt-1" style={{ color: theme.colors.muted }}>
              {theme.id === 'amoled' ? 'True Black' : 'Preset'}
            </div>

            {currentTheme === theme.id && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-skin-primary"></div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-skin-base rounded-lg border border-skin-border text-skin-muted text-sm">
        Select a theme to instantly apply colors across the entire application. 
        Your preference is saved for this session.
      </div>
    </div>
  );
};

export default SettingsView;