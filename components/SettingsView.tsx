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
    <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 p-8 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-skin-text mb-6 flex items-center gap-3">
        <div className="p-2 bg-skin-primary/10 rounded-xl text-skin-primary">
            <Palette className="w-5 h-5" />
        </div>
        Appearance
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.values(themes).map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={`
              relative p-5 rounded-2xl border-2 transition-all text-left group
              ${currentTheme === theme.id 
                ? 'border-skin-primary ring-4 ring-skin-primary/10 bg-skin-card shadow-lg' 
                : 'border-white/10 hover:border-skin-muted/30 bg-skin-card/40 hover:bg-skin-card/60'}
            `}
          >
            {/* Color Preview Swatches */}
            <div className="flex gap-2 mb-4">
              <div 
                className="w-8 h-8 rounded-full border border-black/5 shadow-sm"
                style={{ backgroundColor: `rgb(${theme.colors.base})` }}
              />
              <div 
                className="w-8 h-8 rounded-full border border-black/5 shadow-sm"
                style={{ backgroundColor: `rgb(${theme.colors.primary})` }}
              />
              <div 
                className="w-8 h-8 rounded-full border border-black/5 shadow-sm"
                style={{ backgroundColor: `rgb(${theme.colors.text})` }}
              />
            </div>
            
            <div className="font-bold text-lg" style={{ color: `rgb(${theme.colors.text})` }}>{theme.name}</div>
            <div className="text-xs font-medium mt-1 uppercase tracking-wide opacity-70" style={{ color: `rgb(${theme.colors.muted})` }}>
              {theme.id === 'amoled' ? 'True Black' : 'Theme'}
            </div>

            {currentTheme === theme.id && (
              <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-skin-primary shadow-sm ring-2 ring-white"></div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-5 bg-skin-base/30 rounded-2xl border border-white/10 text-skin-muted text-sm font-medium backdrop-blur-md">
        Select a theme to instantly apply colors across the entire application. 
        Your preference is saved automatically.
      </div>
    </div>
  );
};

export default SettingsView;