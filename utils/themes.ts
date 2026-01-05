import { Theme, ThemeId } from '../types';

// Helper to define RGB strings
// These must be "R G B" (e.g., "255 255 255") to work with tailwind.config

export const themes: Record<ThemeId, Theme> = {
  light: {
    id: 'light',
    name: 'Basic Light',
    colors: {
      base: '248 250 252',     // #f8fafc
      card: '255 255 255',     // #ffffff
      text: '15 23 42',        // #0f172a
      muted: '100 116 139',    // #64748b
      primary: '79 70 229',    // #4f46e5
      border: '226 232 240',   // #e2e8f0
      input: '241 245 249'     // #f1f5f9
    }
  },
  dark: {
    id: 'dark',
    name: 'Basic Dark',
    colors: {
      base: '15 23 42',        // #0f172a
      card: '30 41 59',        // #1e293b
      text: '248 250 252',     // #f8fafc
      muted: '148 163 184',    // #94a3b8
      primary: '99 102 241',   // #6366f1
      border: '51 65 85',      // #334155
      input: '51 65 85'        // #334155
    }
  },
  amoled: {
    id: 'amoled',
    name: 'Amoled Night',
    colors: {
      base: '0 0 0',
      card: '10 10 10',
      text: '255 255 255',
      muted: '163 163 163',
      primary: '255 255 255',
      border: '51 51 51',
      input: '23 23 23'
    }
  },
  acidic: {
    id: 'acidic',
    name: 'Acidic',
    colors: {
      base: '10 10 10',
      card: '17 17 17',
      text: '204 255 0',       // #ccff00
      muted: '170 255 0',      // #aaff00
      primary: '217 70 239',   // #d946ef
      border: '51 51 51',
      input: '34 34 34'
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      base: '5 5 16',          // #050510
      card: '11 11 30',        // #0b0b1e
      text: '0 243 255',       // #00f3ff
      muted: '255 0 153',      // #ff0099
      primary: '252 238 10',   // #fcee0a
      border: '31 31 58',      // #1f1f3a
      input: '21 21 46'        // #15152e
    }
  },
  retro: {
    id: 'retro',
    name: 'Retro Game',
    colors: {
      base: '139 172 15',      // #8bac0f
      card: '155 188 15',      // #9bbc0f
      text: '15 56 15',        // #0f380f
      muted: '48 98 48',       // #306230
      primary: '15 56 15',     // #0f380f
      border: '48 98 48',      // #306230
      input: '139 172 15'      // #8bac0f
    }
  },
  futuristic: {
    id: 'futuristic',
    name: 'Futuristic',
    colors: {
      base: '0 18 32',         // #001220
      card: '0 30 54',         // #001e36
      text: '224 242 254',     // #e0f2fe
      muted: '125 211 252',    // #7dd3fc
      primary: '0 225 255',    // #00e1ff
      border: '0 74 124',      // #004a7c
      input: '0 43 77'         // #002b4d
    }
  },
  historical: {
    id: 'historical',
    name: 'Old Age',
    colors: {
      base: '245 230 211',     // #f5e6d3
      card: '232 220 197',     // #e8dcc5
      text: '74 59 42',        // #4a3b2a
      muted: '139 90 43',      // #8b5a2b
      primary: '139 69 19',    // #8b4513
      border: '212 197 169',   // #d4c5a9
      input: '212 197 169'     // #d4c5a9
    }
  },
  nature: {
    id: 'nature',
    name: 'Forest',
    colors: {
      base: '240 253 244',     // #f0fdf4
      card: '255 255 255',     // #ffffff
      text: '20 83 45',        // #14532d
      muted: '74 222 128',     // #4ade80
      primary: '22 163 74',    // #16a34a
      border: '187 247 208',   // #bbf7d0
      input: '220 252 231'     // #dcfce7
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      base: '236 254 255',     // #ecfeff
      card: '255 255 255',     // #ffffff
      text: '22 78 99',        // #164e63
      muted: '6 182 212',      // #06b6d4
      primary: '8 145 178',    // #0891b2
      border: '207 250 254',   // #cffafe
      input: '224 242 254'     // #e0f2fe
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      base: '255 241 242',     // #fff1f2
      card: '255 255 255',     // #ffffff
      text: '136 19 55',       // #881337
      muted: '251 113 133',    // #fb7185
      primary: '219 39 119',   // #db2777
      border: '254 205 211',   // #fecdd3
      input: '255 228 230'     // #ffe4e6
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