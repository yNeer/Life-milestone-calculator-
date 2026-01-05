import React, { useState } from 'react';
import { Plus, Trash2, CalendarHeart } from 'lucide-react';
import { CustomEvent, CustomEventCategory } from '../types';

interface Props {
  dob: string;
  setDob: (date: string) => void;
  tob: string;
  setTob: (time: string) => void;
  customEvents: CustomEvent[];
  addCustomEvent: (evt: CustomEvent) => void;
  removeCustomEvent: (id: string) => void;
}

const InputSection: React.FC<Props> = ({ dob, setDob, tob, setTob, customEvents, addCustomEvent, removeCustomEvent }) => {
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName || !newEventDate) return;
    
    addCustomEvent({
      id: Date.now().toString(),
      name: newEventName,
      date: new Date(newEventDate),
      category: CustomEventCategory.Personal // Default for simple UI
    });
    setNewEventName('');
    setNewEventDate('');
  };

  return (
    <div className="bg-skin-card p-6 rounded-xl shadow-sm border border-skin-border">
      <h2 className="text-xl font-bold text-skin-text mb-4 flex items-center gap-2">
        <span className="bg-skin-input text-skin-primary p-1.5 rounded-lg"><CalendarHeart className="w-5 h-5"/></span>
        Your Details
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-skin-muted mb-1">Date of Birth</label>
          <input 
            type="date" 
            value={dob} 
            onChange={(e) => setDob(e.target.value)}
            className="w-full p-2.5 bg-skin-input text-skin-text border border-skin-border rounded-lg focus:ring-2 focus:ring-skin-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-skin-muted mb-1">Time of Birth (Optional)</label>
          <input 
            type="time" 
            value={tob} 
            onChange={(e) => setTob(e.target.value)}
            className="w-full p-2.5 bg-skin-input text-skin-text border border-skin-border rounded-lg focus:ring-2 focus:ring-skin-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="border-t border-skin-border pt-4">
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-semibold text-skin-primary hover:text-skin-text flex items-center gap-1 transition-colors"
        >
            {isExpanded ? 'Hide Custom Events' : 'Add Custom Events'}
        </button>
        
        {isExpanded && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <form onSubmit={handleAddEvent} className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-xs text-skin-muted">Event Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Graduation"
                            value={newEventName}
                            onChange={(e) => setNewEventName(e.target.value)}
                            className="w-full p-2 text-sm bg-skin-input text-skin-text border border-skin-border rounded-md focus:outline-none focus:border-skin-primary"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-skin-muted">Date</label>
                        <input 
                            type="date" 
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                            className="w-full p-2 text-sm bg-skin-input text-skin-text border border-skin-border rounded-md focus:outline-none focus:border-skin-primary"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="bg-skin-primary hover:opacity-90 text-white p-2 rounded-md transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </form>

                {customEvents.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {customEvents.map(evt => (
                            <div key={evt.id} className="flex justify-between items-center bg-skin-input p-2 rounded-md border border-skin-border text-sm">
                                <span className="font-medium text-skin-text">{evt.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-skin-muted">{evt.date.toLocaleDateString()}</span>
                                    <button onClick={() => removeCustomEvent(evt.id)} className="text-skin-muted hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;