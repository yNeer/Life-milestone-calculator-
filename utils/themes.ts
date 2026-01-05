import { Theme, ThemeId } from '../types';

export const themes: Record<ThemeId, Theme> = {
  light: {
    id: 'light',
    name: 'Basic Light',
    colors: {
      base: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      primary: '#4f46e5',
      border: '#e2e8f0',
      input: '#f1f5f9'
    }
  },
  dark: {
    id: 'dark',
    name: 'Basic Dark',
    colors: {
      base: '#0f172a',
      card: '#1e293b',
      text: '#f8fafc',
      muted: '#94a3b8',
      primary: '#6366f1',
      border: '#334155',
      input: '#334155'
    }
  },
  amoled: {
    id: 'amoled',
    name: 'Amoled Night',
    colors: {
      base: '#000000',
      card: '#000000',
      text: '#ffffff',
      muted: '#a3a3a3',
      primary: '#ffffff',
      border: '#333333',
      input: '#111111'
    }
  },
  acidic: {
    id: 'acidic',
    name: 'Acidic',
    colors: {
      base: '#0a0a0a',
      card: '#111111',
      text: '#ccff00',
      muted: '#aaff00',
      primary: '#d946ef',
      border: '#333333',
      input: '#222222'
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      base: '#050510',
      card: '#0b0b1e',
      text: '#00f3ff',
      muted: '#ff0099',
      primary: '#fcee0a',
      border: '#1f1f3a',
      input: '#15152e'
    }
  },
  retro: {
    id: 'retro',
    name: 'Retro Game',
    colors: {
      base: '#8bac0f',
      card: '#9bbc0f',
      text: '#0f380f',
      muted: '#306230',
      primary: '#0f380f',
      border: '#306230',
      input: '#8bac0f'
    }
  },
  futuristic: {
    id: 'futuristic',
    name: 'Futuristic',
    colors: {
      base: '#001220',
      card: '#001e36',
      text: '#e0f2fe',
      muted: '#7dd3fc',
      primary: '#00e1ff',
      border: '#004a7c',
      input: '#002b4d'
    }
  },
  historical: {
    id: 'historical',
    name: 'Old Age',
    colors: {
      base: '#f5e6d3',
      card: '#e8dcc5',
      text: '#4a3b2a',
      muted: '#8b5a2b',
      primary: '#8b4513',
      border: '#d4c5a9',
      input: '#d4c5a9'
    }
  },
  nature: {
    id: 'nature',
    name: 'Forest',
    colors: {
      base: '#f0fdf4',
      card: '#ffffff',
      text: '#14532d',
      muted: '#4ade80',
      primary: '#16a34a',
      border: '#bbf7d0',
      input: '#dcfce7'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      base: '#ecfeff',
      card: '#ffffff',
      text: '#164e63',
      muted: '#06b6d4',
      primary: '#0891b2',
      border: '#cffafe',
      input: '#e0f2fe'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      base: '#fff1f2',
      card: '#ffffff',
      text: '#881337',
      muted: '#fb7185',
      primary: '#db2777',
      border: '#fecdd3',
      input: '#ffe4e6'
    }
  }
};

export const applyTheme = (themeId: ThemeId) => {
  const theme = themes[themeId];
  const root = document.documentElement;
  
  root.style.setProperty('--color-base', theme.colors.base);
  root.style.setProperty('--color-card', theme.colors.card);
  root.style.setProperty('--color-text', theme.colors.text);
  root.style.setProperty('--color-muted', theme.colors.muted);
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-input', theme.colors.input);
};