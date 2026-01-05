import React from 'react';
import { Share2 } from 'lucide-react';

interface Props {
  title: string;
  text: string;
  className?: string;
  iconSize?: number;
  onClick?: (e: React.MouseEvent) => void;
}

const ShareButton: React.FC<Props> = ({ title, text, className = "", iconSize = 18, onClick }) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If external handler provided, use it (opens modal)
    if (onClick) {
        onClick(e);
        return;
    }

    // Default native share fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${title}\n${text}`);
        alert('Copied to clipboard!');
      } catch (err) {
        // Fallback
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className={`p-2 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10 ${className}`}
      title="Share"
    >
      <Share2 size={iconSize} />
    </button>
  );
};

export default ShareButton;