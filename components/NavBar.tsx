import React, { useState } from 'react';
import { LayoutDashboard, BarChart2, List, Settings, UserCircle, Menu, X, Share2, Github, Info, Image, Video } from 'lucide-react';
import Logo from './Logo';

interface Props {
  currentView: 'dashboard' | 'visualizations' | 'list' | 'settings' | 'profile' | 'about';
  setView: (view: 'dashboard' | 'visualizations' | 'list' | 'settings' | 'profile' | 'about') => void;
  onShareApp: () => void;
}

const NavBar: React.FC<Props> = ({ currentView, setView, onShareApp }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Strict 4-button bottom layout
  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'visualizations', label: 'Graphs', icon: BarChart2 },
    { id: 'list', label: 'List', icon: List },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ] as const;

  const handleNavClick = (view: any) => {
      setView(view);
      setIsMenuOpen(false);
  };

  return (
    <>
      {/* --- Top Navigation Bar (Header) --- */}
      <div className="sticky top-0 z-40 bg-skin-base/90 backdrop-blur-md border-b border-skin-border px-4 py-3 flex justify-between items-center transition-all duration-300">
         
         {/* Left: Menu & Logo */}
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl hover:bg-skin-input text-skin-text transition-colors border border-transparent hover:border-skin-border"
                aria-label="Menu"
             >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
             </button>
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
                <Logo className="w-7 h-7" />
                <span className="font-bold text-lg text-skin-text tracking-tight hidden sm:block">
                  Life<span className="text-skin-primary">Milestones</span>
                </span>
             </div>
         </div>

         {/* Right: Quick Actions */}
         <div className="flex items-center gap-2">
             <button 
                onClick={onShareApp}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-skin-input hover:bg-skin-border rounded-full text-xs font-bold text-skin-text transition-all"
             >
                <Share2 size={16} /> Share App
             </button>
             <button 
                onClick={onShareApp}
                className="sm:hidden p-2 rounded-full bg-skin-input text-skin-primary"
             >
                <Share2 size={20} />
             </button>
         </div>

         {/* Dropdown Menu / Drawer */}
         {isMenuOpen && (
             <div className="absolute top-full left-0 m-2 w-64 bg-skin-card border border-skin-border shadow-2xl rounded-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                 <div className="p-2 mb-2 text-xs font-bold text-skin-muted uppercase tracking-wider border-b border-skin-border">
                    Navigation
                 </div>
                 <button onClick={() => handleNavClick('dashboard')} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-skin-input text-left text-sm font-medium text-skin-text transition-colors">
                    <LayoutDashboard size={18} className="text-skin-primary" /> Dashboard
                 </button>
                 <button onClick={() => handleNavClick('visualizations')} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-skin-input text-left text-sm font-medium text-skin-text transition-colors">
                    <BarChart2 size={18} className="text-skin-primary" /> Analysis & Graphs
                 </button>
                 <button onClick={() => handleNavClick('list')} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-skin-input text-left text-sm font-medium text-skin-text transition-colors">
                    <List size={18} className="text-skin-primary" /> Full Milestone List
                 </button>
                 <button onClick={() => handleNavClick('profile')} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-skin-input text-left text-sm font-medium text-skin-text transition-colors">
                    <UserCircle size={18} className="text-skin-primary" /> Profile & Settings
                 </button>

                 <div className="p-2 mt-2 mb-2 text-xs font-bold text-skin-muted uppercase tracking-wider border-b border-skin-border">
                    App Info
                 </div>
                 <button 
                    onClick={() => handleNavClick('settings')}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-skin-input text-left text-sm font-medium text-skin-text transition-colors"
                 >
                    <Settings size={18} className="text-skin-muted" />
                    Appearance
                 </button>
                 <button 
                    onClick={() => handleNavClick('about')}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-skin-input text-left text-sm font-medium text-skin-text transition-colors"
                 >
                    <Info size={18} className="text-skin-muted" />
                    About Developer
                 </button>
                 <div className="h-px bg-skin-border my-2" />
                 <a 
                    href="https://github.com/yNeer" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-skin-input text-left text-sm font-medium text-skin-text transition-colors"
                 >
                    <Github size={18} className="text-skin-muted" />
                    Source Code
                 </a>
             </div>
         )}
      </div>

      {/* --- Floating Bottom Navigation Bar --- */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-skin-card/90 backdrop-blur-xl border border-skin-border shadow-2xl rounded-full px-2 py-2 flex items-center gap-1 sm:gap-2 max-w-md w-full justify-between sm:justify-center">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-full transition-all duration-300 relative overflow-hidden group flex-1 sm:flex-none ${
                  isActive 
                    ? 'text-white bg-skin-primary shadow-lg shadow-skin-primary/30' 
                    : 'text-skin-muted hover:bg-skin-input hover:text-skin-text'
                }`}
              >
                <Icon size={20} className={isActive ? 'fill-current' : ''} />
                {isActive && (
                    <span className="text-sm font-bold hidden sm:inline animate-in fade-in slide-in-from-right-2 duration-300 whitespace-nowrap">
                        {item.label}
                    </span>
                )}
                {/* Mobile Active Dot */}
                {isActive && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white sm:hidden" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default NavBar;