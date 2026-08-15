import React from 'react';
import { UserPlus, Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  label = '+ New Patient'
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 no-print animate-in fade-in slide-in-from-bottom-5 duration-200">
      <button
        type="button"
        onClick={onClick}
        className="group relative flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 active:scale-95 text-white rounded-full font-black text-xs shadow-2xl shadow-sky-600/50 hover:shadow-sky-500/60 border border-sky-400/30 transition-all duration-150 cursor-pointer"
        aria-label="Add New Patient"
      >
        <div className="p-1 bg-white/20 rounded-full group-hover:rotate-90 transition-transform duration-200">
          <Plus className="w-4 h-4 text-white" />
        </div>
        <span className="tracking-wide">{label}</span>
      </button>
    </div>
  );
};
