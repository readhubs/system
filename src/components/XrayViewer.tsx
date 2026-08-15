import React, { useState } from 'react';
import { ImageType } from '../types';
import { Sliders, Sun, Contrast, RotateCcw, ZoomIn, ZoomOut, Maximize2, Eye, FileImage, Trash2 } from 'lucide-react';

interface XrayViewerProps {
  imageUrl: string;
  imageType: ImageType;
  toothNumber?: number;
  fileName?: string;
  date?: string;
  onDelete?: () => void;
  onClose?: () => void;
}

export const XrayViewer: React.FC<XrayViewerProps> = ({
  imageUrl,
  imageType,
  toothNumber,
  fileName,
  date,
  onDelete,
  onClose
}) => {
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [sharpen, setSharpen] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setSharpen(0);
    setZoom(100);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to permanently delete this radiograph / image?')) {
      onDelete();
      if (onClose) onClose();
    }
  };

  const filterStyle: React.CSSProperties = {
    filter: `
      brightness(${brightness}%)
      contrast(${contrast + sharpen * 20}%)
      ${invert ? 'invert(100%)' : 'invert(0%)'}
    `,
    transform: `scale(${zoom / 100})`,
    transition: 'filter 0.1s ease, transform 0.15s ease'
  };

  return (
    <div className="flex flex-col bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-950 text-sky-400 border border-sky-800/60 rounded-xl">
            <FileImage className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">{imageType}</span>
              {toothNumber && (
                <span className="text-xs bg-sky-600/30 text-sky-300 font-mono px-2 py-0.5 rounded-md border border-sky-500/40">
                  Tooth #{toothNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {fileName || 'Radiograph'} {date ? `• ${date}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/50 hover:bg-rose-900 hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 text-xl font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Image Stage View */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[480px] bg-black flex items-center justify-center p-4 overflow-hidden select-none">
        <img
          src={imageUrl}
          alt={fileName || 'X-Ray Image'}
          style={filterStyle}
          className="max-h-[70vh] max-w-full object-contain rounded-md shadow-2xl"
        />

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-2 py-1.5 rounded-xl shadow-lg">
          <button
            type="button"
            onClick={() => setZoom(Math.max(50, zoom - 25))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-sky-400 px-2">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(300, zoom + 25))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zero-Cost Browser CSS Filters Panel */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span>Radiograph Enhancement Tools (Browser Canvas)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
          {/* Brightness */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Brightness
              </span>
              <span className="font-mono text-sky-400">{brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-sky-400" /> Contrast
              </span>
              <span className="font-mono text-sky-400">{contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="250"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Sharpening */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> Sharpening
              </span>
              <span className="font-mono text-emerald-400">{sharpen}x</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={sharpen}
              onChange={(e) => setSharpen(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Invert X-Ray Colors Toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Eye className="w-3.5 h-3.5 text-purple-400" /> Invert Colors
            </span>
            <button
              type="button"
              onClick={() => setInvert(!invert)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                invert
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {invert ? 'Inverted' : 'Normal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
