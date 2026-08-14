import React, { useState } from 'react';
import { ToothStatus, ToothSurface } from '../types';
import { Info, Sparkles, Layers } from 'lucide-react';

interface DentalChartProps {
  toothStatus: Record<number, ToothStatus>;
  onToothSelect: (toothNumber: number) => void;
  selectedToothNumber?: number | null;
  readOnly?: boolean;
}

// Standard FDI Teeth Numbers
const UPPER_PERMANENT_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_PERMANENT_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];

const LOWER_PERMANENT_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_PERMANENT_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const UPPER_DECIDUOUS_RIGHT = [55, 54, 53, 52, 51];
const UPPER_DECIDUOUS_LEFT = [61, 62, 63, 64, 65];

const LOWER_DECIDUOUS_RIGHT = [85, 84, 83, 82, 81];
const LOWER_DECIDUOUS_LEFT = [71, 72, 73, 74, 75];

export const DentalChart: React.FC<DentalChartProps> = ({
  toothStatus,
  onToothSelect,
  selectedToothNumber,
  readOnly = false
}) => {
  const [showPrimaryTeeth, setShowPrimaryTeeth] = useState(false);

  const getStatusBadge = (status?: ToothStatus) => {
    switch (status) {
      case 'treated':
        return 'bg-sky-500 text-white border-sky-600 shadow-sm';
      case 'needs-treatment':
        return 'bg-amber-400 text-amber-950 border-amber-500 font-extrabold ring-2 ring-amber-300/60 shadow-md animate-pulse';
      case 'extracted':
        return 'bg-slate-800 text-slate-300 border-slate-900 opacity-75';
      default:
        return 'bg-white text-slate-700 border-slate-300 hover:border-sky-500 hover:bg-sky-50/50';
    }
  };

  const renderToothUnit = (num: number, isDeciduous = false) => {
    const status = toothStatus[num] || 'healthy';
    const isSelected = selectedToothNumber === num;

    return (
      <button
        key={num}
        type="button"
        disabled={readOnly}
        onClick={() => onToothSelect(num)}
        className={`relative group flex flex-col items-center justify-center transition-all duration-150 rounded-xl border-2 p-1.5 ${
          isDeciduous ? 'w-10 h-14 text-xs' : 'w-11 sm:w-12 h-16 sm:h-18 text-xs sm:text-sm'
        } ${getStatusBadge(status)} ${
          isSelected ? 'ring-4 ring-sky-500 ring-offset-2 scale-105 z-10 border-sky-600 font-black' : ''
        }`}
        title={`Tooth #${num} (${status.replace('-', ' ')})`}
      >
        {/* Anatomical Tooth Visual Representation */}
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center my-1">
          {status === 'extracted' ? (
            <div className="text-red-400 font-extrabold text-base sm:text-lg">✕</div>
          ) : (
            <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow-xs">
              {/* Outer Crown contour */}
              <rect x="4" y="4" width="28" height="28" rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
              {/* Surface dividers (O, M, D, B, L) */}
              <line x1="12" y1="12" x2="24" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
              <line x1="24" y1="12" x2="12" y2="24" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
              <rect x="12" y="12" width="12" height="12" rx="2" fill="currentColor" fillOpacity="0.25" />
            </svg>
          )}
        </div>

        {/* FDI Number Badge */}
        <span className="font-mono font-bold tracking-tight text-[11px] sm:text-xs">
          #{num}
        </span>

        {/* Small Indicator Tag */}
        {status === 'needs-treatment' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-6">
      {/* Header controls & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Interactive Dental Chart (FDI System)</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
              ISO 3950
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any tooth to view procedure history, upload X-rays, or record treatments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPrimaryTeeth(!showPrimaryTeeth)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            showPrimaryTeeth
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {showPrimaryTeeth ? 'Hide Primary Teeth' : 'Show Primary Teeth (Pediatric)'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-white border-2 border-slate-300"></span>
          <span className="text-slate-600">Healthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-sky-500 border-2 border-sky-600"></span>
          <span className="text-slate-700 font-semibold">Treated / Restored</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-400 border-2 border-amber-500"></span>
          <span className="text-slate-700 font-semibold">Needs Treatment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-800 border-2 border-slate-900"></span>
          <span className="text-slate-700 font-semibold">Extracted / Missing</span>
        </div>
      </div>

      {/* Main FDI Dental Chart Grid */}
      <div className="space-y-8 overflow-x-auto pb-2">
        {/* UPPER JAW (Maxilla) */}
        <div className="space-y-2 min-w-[620px]">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            <span>Upper Right (Q1)</span>
            <span className="text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded">MAXILLA (Upper Arch)</span>
            <span>Upper Left (Q2)</span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
            {/* Q1 Permanent */}
            <div className="flex gap-1 sm:gap-1.5">
              {UPPER_PERMANENT_RIGHT.map((num) => renderToothUnit(num))}
            </div>

            {/* Midline Divider */}
            <div className="h-14 w-0.5 bg-sky-400 mx-1.5 rounded-full opacity-60"></div>

            {/* Q2 Permanent */}
            <div className="flex gap-1 sm:gap-1.5">
              {UPPER_PERMANENT_LEFT.map((num) => renderToothUnit(num))}
            </div>
          </div>
        </div>

        {/* DECIDUOUS UPPER (If toggled) */}
        {showPrimaryTeeth && (
          <div className="space-y-1.5 min-w-[400px] bg-purple-50/50 p-3 rounded-xl border border-purple-100">
            <div className="text-center text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Upper Deciduous Teeth (Pediatric)
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="flex gap-1">{UPPER_DECIDUOUS_RIGHT.map((num) => renderToothUnit(num, true))}</div>
              <div className="h-10 w-0.5 bg-purple-300 mx-1"></div>
              <div className="flex gap-1">{UPPER_DECIDUOUS_LEFT.map((num) => renderToothUnit(num, true))}</div>
            </div>
          </div>
        )}

        {/* DECIDUOUS LOWER (If toggled) */}
        {showPrimaryTeeth && (
          <div className="space-y-1.5 min-w-[400px] bg-purple-50/50 p-3 rounded-xl border border-purple-100">
            <div className="flex items-center justify-center gap-1">
              <div className="flex gap-1">{LOWER_DECIDUOUS_RIGHT.map((num) => renderToothUnit(num, true))}</div>
              <div className="h-10 w-0.5 bg-purple-300 mx-1"></div>
              <div className="flex gap-1">{LOWER_DECIDUOUS_LEFT.map((num) => renderToothUnit(num, true))}</div>
            </div>
            <div className="text-center text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Lower Deciduous Teeth (Pediatric)
            </div>
          </div>
        )}

        {/* LOWER JAW (Mandible) */}
        <div className="space-y-2 min-w-[620px]">
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
            {/* Q4 Permanent */}
            <div className="flex gap-1 sm:gap-1.5">
              {LOWER_PERMANENT_RIGHT.map((num) => renderToothUnit(num))}
            </div>

            {/* Midline Divider */}
            <div className="h-14 w-0.5 bg-sky-400 mx-1.5 rounded-full opacity-60"></div>

            {/* Q3 Permanent */}
            <div className="flex gap-1 sm:gap-1.5">
              {LOWER_PERMANENT_LEFT.map((num) => renderToothUnit(num))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            <span>Lower Right (Q4)</span>
            <span className="text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded">MANDIBLE (Lower Arch)</span>
            <span>Lower Left (Q3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
