import React, { useState, useRef } from 'react';
import { UserProfile, CustomEvent, CustomEventCategory, ThemeId } from '../types';
import { themes } from '../utils/themes';
import { User, Calendar, Clock, Plus, Trash2, Save, Camera, Upload, Download, CheckCircle, Smartphone, Palette } from 'lucide-react';

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
        
        {/* Install App Section */}
        {(canInstallPwa || isPwaInstalled) && (
            <div className="bg-gradient-to-r from-skin-primary to-indigo-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">
                                {isPwaInstalled ? "Enjoy your life events 🎉" : "Install App"}
                            </h3>
                            <p className="text-indigo-100 text-sm opacity-90">
                                {isPwaInstalled 
                                    ? "App is installed and ready to use offline." 
                                    : "Add to your home screen for the best experience."}
                            </p>
                        </div>
                    </div>
                    
                    {!isPwaInstalled && (
                        <button 
                            onClick={installPwa}
                            className="bg-white text-skin-primary px-6 py-2.5 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <Download size={18} /> Install Now
                        </button>
                    )}
                    {isPwaInstalled && (
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">
                            <CheckCircle size={16} /> Installed
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-skin-text flex items-center gap-2">
                    <User className="text-skin-primary" />
                    Personal Details
                </h2>
                {isDirty && <span className="text-xs text-emerald-500 font-bold flex items-center gap-1"><Save size={12}/> Saved</span>}
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3 mx-auto md:mx-0">
                    <div 
                        className="relative w-32 h-32 rounded-full bg-skin-input border-4 border-skin-border overflow-hidden cursor-pointer group shadow-inner"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {profile.avatar ? (
                            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-skin-muted">
                                <User size={48} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
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
                        className="text-xs font-bold text-skin-primary hover:underline flex items-center gap-1"
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
                            className="w-full p-3 bg-skin-input text-skin-text border border-skin-border rounded-xl focus:ring-2 focus:ring-skin-primary focus:outline-none transition-all"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-skin-muted uppercase tracking-wider mb-2">Date of Birth</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-skin-muted w-4 h-4" />
                            <input 
                                type="date" 
                                value={profile.dob} 
                                onChange={(e) => handleChange('dob', e.target.value)}
                                className="w-full p-3 pl-10 bg-skin-input text-skin-text border border-skin-border rounded-xl focus:ring-2 focus:ring-skin-primary focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-skin-muted uppercase tracking-wider mb-2">Time of Birth</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3.5 text-skin-muted w-4 h-4" />
                            <input 
                                type="time" 
                                value={profile.tob} 
                                onChange={(e) => handleChange('tob', e.target.value)}
                                className="w-full p-3 pl-10 bg-skin-input text-skin-text border border-skin-border rounded-xl focus:ring-2 focus:ring-skin-primary focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Theme Selector (In Profile) */}
        <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border p-6">
            <h2 className="text-xl font-bold text-skin-text mb-4 flex items-center gap-2">
                <Palette className="text-skin-primary" />
                App Theme
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                 {Object.values(themes).map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => handleChange('theme', theme.id)}
                        className={`
                        p-3 rounded-lg border text-left text-xs font-medium transition-all flex items-center gap-2
                        ${profile.theme === theme.id 
                            ? 'border-skin-primary ring-1 ring-skin-primary bg-skin-input' 
                            : 'border-skin-border hover:bg-skin-base'}
                        `}
                    >
                        <div 
                            className="w-4 h-4 rounded-full border shadow-sm flex-shrink-0"
                            style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.border }}
                        />
                        <span className="truncate">{theme.name}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Custom Events Manager */}
        <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border p-6">
             <h2 className="text-xl font-bold text-skin-text mb-6 flex items-center gap-2">
                <Calendar className="text-skin-primary" />
                Custom Life Events
            </h2>
            
            <form onSubmit={handleAddEvent} className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-skin-base p-4 rounded-xl border border-skin-border">
                <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-skin-muted mb-1 block">Event Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Wedding, Graduation, First Job"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full p-2 text-sm bg-skin-card text-skin-text border border-skin-border rounded-lg focus:outline-none focus:border-skin-primary"
                    />
                </div>
                <div className="w-full md:w-auto">
                     <label className="text-xs font-semibold text-skin-muted mb-1 block">Date</label>
                    <input 
                        type="date" 
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full p-2 text-sm bg-skin-card text-skin-text border border-skin-border rounded-lg focus:outline-none focus:border-skin-primary"
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full md:w-auto bg-skin-primary hover:opacity-90 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" /> Add Event
                </button>
            </form>

            <div className="space-y-3">
                {customEvents.length === 0 ? (
                    <div className="text-center py-8 text-skin-muted border-2 border-dashed border-skin-border rounded-xl">
                        No custom events added yet.
                    </div>
                ) : (
                    customEvents.map(evt => (
                        <div key={evt.id} className="flex justify-between items-center bg-skin-input p-4 rounded-xl border border-skin-border group hover:border-skin-primary/30 transition-colors">
                            <div>
                                <div className="font-bold text-skin-text">{evt.name}</div>
                                <div className="text-xs text-skin-muted">{new Date(evt.date).toLocaleDateString()}</div>
                            </div>
                            <button 
                                onClick={() => removeCustomEvent(evt.id)} 
                                className="p-2 text-skin-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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