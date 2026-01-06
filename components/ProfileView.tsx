import React, { useState, useRef } from 'react';
import { UserProfile, CustomEvent, CustomEventCategory } from '../types';
import { themes } from '../utils/themes';
import { User, Calendar, Clock, Plus, Trash2, Save, Camera, Upload, Download, CheckCircle, Smartphone, Palette, Grid, X, ChevronRight } from 'lucide-react';
import Logo from './Logo';

interface Props {
  profile: UserProfile;
  updateProfile: (p: Partial<UserProfile>) => void;
  customEvents: CustomEvent[];
  addCustomEvent: (evt: CustomEvent) => void;
  removeCustomEvent: (id: string) => void;
  installPwa: () => void;
  isPwaInstalled: boolean;
  canInstallPwa: boolean;
}

const ProfileView: React.FC<Props> = ({ 
    profile, updateProfile, customEvents, addCustomEvent, removeCustomEvent,
    installPwa, isPwaInstalled, canInstallPwa
}) => {
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showWidgetHelp, setShowWidgetHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof UserProfile, value: string) => {
      updateProfile({ [field]: value });
      setIsDirty(true);
      setTimeout(() => setIsDirty(false), 2000); 
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) {
          alert("Image is too large. Please select an image under 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventDate) return;
    
    addCustomEvent({
      id: Date.now().toString(),
      name: newEventName,
      date: new Date(newEventDate),
      category: CustomEventCategory.Personal
    });
    setNewEventName('');
    setNewEventDate('');
  };

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
        
        {/* Widget Help Modal */}
        {showWidgetHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowWidgetHelp(false)}>
                <div className="bg-skin-card p-6 rounded-[2rem] max-w-sm w-full shadow-2xl border border-white/20 relative" onClick={e => e.stopPropagation()}>
                    <button className="absolute top-4 right-4 text-skin-muted hover:text-skin-text" onClick={() => setShowWidgetHelp(false)}><X size={20}/></button>
                    <div className="w-12 h-12 bg-skin-primary/10 rounded-full flex items-center justify-center text-skin-primary mb-4">
                        <Grid size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-skin-text mb-2">Add to Home Screen</h3>
                    <p className="text-skin-muted text-sm mb-4 leading-relaxed">
                        To add the Life Milestones widget to your Android home screen:
                    </p>
                    <ol className="text-sm text-skin-text space-y-3 mb-6 pl-4 list-decimal marker:text-skin-primary font-medium">
                        <li>Ensure the app is <strong>Installed</strong>.</li>
                        <li>Go to your home screen.</li>
                        <li><strong>Long press</strong> the Life Milestones app icon.</li>
                        <li>Tap <strong>Widgets</strong> in the popup menu.</li>
                        <li>Drag your preferred widget (Total Existence, Countdown, or List) to your screen.</li>
                    </ol>
                    <button onClick={() => setShowWidgetHelp(false)} className="w-full py-3 bg-skin-primary text-white font-bold rounded-xl">Got it</button>
                </div>
            </div>
        )}

        {/* Install App Section - Always visible to promote app */}
        <div className="bg-gradient-to-br from-skin-primary to-violet-600 rounded-[2rem] shadow-xl p-6 text-white relative overflow-hidden border border-white/20 group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="bg-white p-3.5 rounded-2xl shadow-lg shadow-black/10 flex-shrink-0 transform group-hover:scale-105 transition-transform duration-500">
                        <Logo className="w-10 h-10" />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="font-black text-xl tracking-tight leading-tight">
                            Life Milestones
                        </h3>
                        <p className="text-indigo-100 text-sm font-medium opacity-90 mt-0.5">
                            {isPwaInstalled 
                                ? "App is installed & ready for offline use." 
                                : "Install locally for the best experience."}
                        </p>
                    </div>
                </div>
                
                {/* 
                   Display Logic:
                   1. If installable (deferredPrompt exists) AND not installed -> Show Install Button
                   2. If installed -> Show Installed Badge
                   3. If not installable (e.g. iOS or prompt blocked) AND not installed -> Show fallback info
                */}
                
                {canInstallPwa && !isPwaInstalled && (
                    <button 
                        onClick={installPwa}
                        className="bg-white text-skin-primary px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer z-20"
                    >
                        <Download size={20} />
                        <span>Install App</span>
                    </button>
                )}
                
                {isPwaInstalled && (
                    <div className="flex items-center gap-2 bg-white/20 px-5 py-2.5 rounded-xl backdrop-blur-md font-bold text-sm border border-white/10 shadow-sm">
                        <CheckCircle size={18} className="text-emerald-300" />
                        <span>Installed</span>
                    </div>
                )}

                {/* Fallback for environments where programmatic install isn't possible (e.g. iOS) */}
                {!canInstallPwa && !isPwaInstalled && (
                    <div className="hidden md:flex items-center gap-2 opacity-80 text-xs font-medium bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                       <Smartphone size={14} /> Tap Share → Add to Home
                    </div>
                )}
            </div>
        </div>

        {/* Widgets Section */}
        {isPwaInstalled && (
             <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 p-6 flex items-center justify-between group cursor-pointer hover:bg-skin-card/60 transition-colors" onClick={() => setShowWidgetHelp(true)}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                        <Grid size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-skin-text">Android Widgets</h3>
                        <p className="text-xs text-skin-muted font-bold uppercase tracking-wide">3 Styles Available</p>
                    </div>
                </div>
                <div className="bg-skin-primary/10 text-skin-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    How to Add <ChevronRight size={16} />
                </div>
            </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-skin-text flex items-center gap-3">
                    <div className="p-2 bg-skin-primary/10 rounded-xl text-skin-primary">
                        <User size={20} />
                    </div>
                    Personal Details
                </h2>
                {isDirty && <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full"><Save size={12}/> Saved</span>}
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-start">
                
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4 mx-auto md:mx-0">
                    <div 
                        className="relative w-36 h-36 rounded-full bg-skin-input/50 border-4 border-white/20 overflow-hidden cursor-pointer group shadow-xl"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-skin-muted/50">
                                <User size={48} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <Camera className="text-white" size={28} />
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-skin-primary bg-skin-primary/10 px-3 py-1.5 rounded-lg hover:bg-skin-primary/20 transition-colors flex items-center gap-1.5"
                    >
                        <Upload size={12} /> Change Photo
                    </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-skin-muted uppercase tracking-wider mb-2">Display Name</label>
                        <input 
                            type="text" 
                            value={profile.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Enter your name"
                            className="w-full p-4 bg-skin-input/40 text-skin-text border border-white/10 rounded-2xl focus:ring-2 focus:ring-skin-primary focus:outline-none transition-all backdrop-blur-sm shadow-sm"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-skin-muted uppercase tracking-wider mb-2">Date of Birth</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-4 text-skin-muted w-4 h-4 opacity-50" />
                            <input 
                                type="date" 
                                value={profile.dob} 
                                onChange={(e) => handleChange('dob', e.target.value)}
                                className="w-full p-4 pl-12 bg-skin-input/40 text-skin-text border border-white/10 rounded-2xl focus:ring-2 focus:ring-skin-primary focus:outline-none transition-all backdrop-blur-sm shadow-sm"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-skin-muted uppercase tracking-wider mb-2">Time of Birth</label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-4 text-skin-muted w-4 h-4 opacity-50" />
                            <input 
                                type="time" 
                                value={profile.tob} 
                                onChange={(e) => handleChange('tob', e.target.value)}
                                className="w-full p-4 pl-12 bg-skin-input/40 text-skin-text border border-white/10 rounded-2xl focus:ring-2 focus:ring-skin-primary focus:outline-none transition-all backdrop-blur-sm shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Theme Selector (In Profile) */}
        <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 p-8">
            <h2 className="text-xl font-bold text-skin-text mb-6 flex items-center gap-3">
                <div className="p-2 bg-skin-primary/10 rounded-xl text-skin-primary">
                    <Palette size={20} />
                </div>
                Quick Theme
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                 {Object.values(themes).map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => handleChange('theme', theme.id)}
                        className={`
                        p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2
                        ${profile.theme === theme.id 
                            ? 'border-skin-primary ring-2 ring-skin-primary/20 bg-skin-card shadow-md' 
                            : 'border-white/10 hover:bg-skin-base/30 bg-skin-base/20'}
                        `}
                    >
                        <div 
                            className="w-4 h-4 rounded-full border border-black/5 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: `rgb(${theme.colors.primary})` }}
                        />
                        <span className="truncate">{theme.name}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Custom Events Manager */}
        <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 p-8">
             <h2 className="text-xl font-bold text-skin-text mb-6 flex items-center gap-3">
                <div className="p-2 bg-skin-primary/10 rounded-xl text-skin-primary">
                    <Calendar size={20} />
                </div>
                Custom Life Events
            </h2>
            
            <form onSubmit={handleAddEvent} className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-skin-base/30 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-skin-muted mb-1.5 block uppercase tracking-wider">Event Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Wedding, Graduation, First Job"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full p-3 text-sm bg-skin-card/50 text-skin-text border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-skin-primary"
                    />
                </div>
                <div className="w-full md:w-auto">
                     <label className="text-xs font-bold text-skin-muted mb-1.5 block uppercase tracking-wider">Date</label>
                    <input 
                        type="date" 
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full p-3 text-sm bg-skin-card/50 text-skin-text border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-skin-primary"
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full md:w-auto bg-skin-primary hover:opacity-90 text-white p-3 rounded-xl transition-all shadow-lg shadow-skin-primary/20 flex items-center justify-center gap-2 font-bold text-sm"
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </form>

            <div className="space-y-3">
                {customEvents.length === 0 ? (
                    <div className="text-center py-12 text-skin-muted border-2 border-dashed border-white/10 rounded-2xl font-medium">
                        No custom events added yet.
                    </div>
                ) : (
                    customEvents.map(evt => (
                        <div key={evt.id} className="flex justify-between items-center bg-skin-card/40 p-4 rounded-2xl border border-white/10 group hover:border-skin-primary/20 transition-all backdrop-blur-md">
                            <div>
                                <div className="font-bold text-skin-text">{evt.name}</div>
                                <div className="text-xs text-skin-muted font-medium mt-0.5">{new Date(evt.date).toLocaleDateString()}</div>
                            </div>
                            <button 
                                onClick={() => removeCustomEvent(evt.id)} 
                                className="p-2 text-skin-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                title="Remove Event"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default ProfileView;