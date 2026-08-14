import React, { useState } from 'react';
import { ToothStatus, ToothSurface } from '../types';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Droplets,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface DentalChartProps {
  toothStatus: Record<number, ToothStatus>;
  onToothSelect: (toothNumber: number) => void;
  onQuickAction?: (toothNumber: number, action: 'fill' | 'extract' | 'endo' | 'clean' | 'crown' | 'healthy') => void;
  selectedToothNumber?: number | null;
  readOnly?: boolean;
}

// FDI Permanent Teeth Layout
const UPPER_JAW_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_JAW_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];

const LOWER_JAW_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_JAW_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

// Pediatric Teeth
const UPPER_PED_RIGHT = [55, 54, 53, 52, 51];
const UPPER_PED_LEFT = [61, 62, 63, 64, 65];
const LOWER_PED_RIGHT = [85, 84, 83, 82, 81];
const LOWER_PED_LEFT = [71, 72, 73, 74, 75];

export const DentalChart: React.FC<DentalChartProps> = ({
  toothStatus,
  onToothSelect,
  onQuickAction,
  selectedToothNumber,
  readOnly = false
}) => {
  const [showPediatric, setShowPediatric] = useState(false);
  const [activeMenuTooth, setActiveMenuTooth] = useState<number | null>(null);

  const getToothVisualProps = (num: number) => {
    const status = toothStatus[num] || 'healthy';
    switch (status) {
      case 'treated':
        return {
          fill: '#0284c7', // Sky 600
          stroke: '#0369a1',
          bgClass: 'bg-sky-500 text-white border-sky-600',
          label: 'Treated',
          badgeColor: 'bg-sky-500'
        };
      case 'needs-treatment':
        return {
          fill: '#f59e0b', // Amber 500
          stroke: '#d97706',
          bgClass: 'bg-amber-400 text-amber-950 border-amber-500',
          label: 'Needs Treatment',
          badgeColor: 'bg-amber-400'
        };
      case 'extracted':
        return {
          fill: '#334155', // Slate 700
          stroke: '#1e293b',
          bgClass: 'bg-slate-800 text-slate-300 border-slate-900',
          label: 'Extracted',
          badgeColor: 'bg-slate-800'
        };
      case 'endo':
        return {
          fill: '#0d9488', // Teal 600
          stroke: '#0f766e',
          bgClass: 'bg-teal-500 text-white border-teal-600',
          label: 'Endo (RCT)',
          badgeColor: 'bg-teal-500'
        };
      case 'crown':
        return {
          fill: '#9333ea', // Purple 600
          stroke: '#7e22ce',
          bgClass: 'bg-purple-500 text-white border-purple-600',
          label: 'Crown',
          badgeColor: 'bg-purple-500'
        };
      default:
        return {
          fill: '#ffffff',
          stroke: '#cbd5e1',
          bgClass: 'bg-white text-slate-800 border-slate-300 hover:border-sky-500',
          label: 'Healthy',
          badgeColor: 'bg-emerald-500'
        };
    }
  };

  const handleToothClick = (num: number) => {
    onToothSelect(num);
    if (!readOnly && onQuickAction) {
      setActiveMenuTooth(activeMenuTooth === num ? null : num);
    }
  };

  const handleApplyQuickAction = (action: 'fill' | 'extract' | 'endo' | 'clean' | 'crown' | 'healthy') => {
    if (activeMenuTooth && onQuickAction) {
      onQuickAction(activeMenuTooth, action);
      setActiveMenuTooth(null);
    }
  };

  const renderToothSVG = (num: number, isDeciduous: boolean = false) => {
    const isSelected = selectedToothNumber === num;
    const status = toothStatus[num] || 'healthy';
    const visual = getToothVisualProps(num);

    // Anatomical category
    const isMolar = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38, 55, 54, 64, 65, 85, 84, 74, 75].includes(num);
    const isPremolar = [15, 14, 24, 25, 45, 44, 34, 35].includes(num);
    const isAnterior = !isMolar && !isPremolar;

    return (
      <div key={num} className="relative group flex flex-col items-center">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => handleToothClick(num)}
          className={`relative flex flex-col items-center justify-center p-1.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
            isDeciduous ? 'w-10 sm:w-11 h-16' : 'w-11 sm:w-12 md:w-14 h-18 sm:h-20'
          } ${visual.bgClass} ${
            isSelected
              ? 'ring-4 ring-sky-500 ring-offset-2 scale-105 z-20 border-sky-600 shadow-lg'
              : 'hover:scale-102 hover:shadow-md'
          }`}
          title={`Tooth #${num} (${visual.label})`}
        >
          {/* Visual SVG Crown & Surfaces */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
            {status === 'extracted' ? (
              <span className="text-red-400 font-black text-lg">✕</span>
            ) : isMolar ? (
              // Molar Multi-Surface SVG
              <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
                <rect x="4" y="4" width="32" height="32" rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <polygon points="4,4 14,14 26,14 36,4" fill="currentColor" fillOpacity="0.2" />
                <polygon points="36,4 26,14 26,26 36,36" fill="currentColor" fillOpacity="0.3" />
                <polygon points="36,36 26,26 14,26 4,36" fill="currentColor" fillOpacity="0.2" />
                <polygon points="4,36 14,26 14,14 4,4" fill="currentColor" fillOpacity="0.3" />
                <rect x="14" y="14" width="12" height="12" rx="2" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
              </svg>
            ) : isPremolar ? (
              // Premolar Bi-cuspid SVG
              <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
                <rect x="6" y="6" width="28" height="28" rx="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <line x1="6" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="2" />
                <circle cx="20" cy="14" r="4" fill="currentColor" fillOpacity="0.4" />
                <circle cx="20" cy="26" r="4" fill="currentColor" fillOpacity="0.4" />
              </svg>
            ) : (
              // Anterior Incisor / Canine SVG
              <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
                <path d="M 10,8 C 12,6 28,6 30,8 C 32,14 30,32 20,36 C 10,32 8,14 10,8 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <line x1="12" y1="12" x2="28" y2="12" stroke="currentColor" strokeWidth="2" />
                <path d="M 14,14 L 26,14 L 20,30 Z" fill="currentColor" fillOpacity="0.3" />
              </svg>
            )}
          </div>

          {/* FDI Tooth ID */}
          <span className="font-mono font-bold text-[10px] sm:text-xs mt-1">#{num}</span>

          {/* Quick status badge */}
          {status !== 'healthy' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white bg-current"></span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Interactive Odontogram (Dental Arch)
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-400">
              Visual FDI Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any tooth to open the quick procedure action sheet or inspect history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPediatric(!showPediatric)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            showPediatric
              ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700'
              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {showPediatric ? 'Hide Pediatric (Deciduous)' : 'Show Pediatric Teeth'}
        </button>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-white border-2 border-slate-300"></span>
          <span className="text-slate-600 dark:text-slate-400">Healthy (سليم)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-sky-500"></span>
          <span className="text-sky-700 dark:text-sky-400">Treated / Filling (حشو)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-teal-500"></span>
          <span className="text-teal-700 dark:text-teal-400">Endo / RCT (عصب)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-purple-500"></span>
          <span className="text-purple-700 dark:text-purple-400">Crown (تركيبة)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-400"></span>
          <span className="text-amber-700 dark:text-amber-400">Needs Treatment (يحتاج علاج)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-800"></span>
          <span className="text-slate-700 dark:text-slate-400">Extracted (مخلوع)</span>
        </div>
      </div>

      {/* Quick Action Popup Sheet (When Tooth Clicked) */}
      {activeMenuTooth && onQuickAction && (
        <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 animate-in fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold font-mono text-xs">
                #{activeMenuTooth}
              </span>
              <span className="font-bold text-sm">Quick Action for Tooth #{activeMenuTooth}</span>
            </div>
            <button
              onClick={() => setActiveMenuTooth(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => handleApplyQuickAction('fill')}
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              🦷 Fill (حشو)
            </button>

            <button
              type="button"
              onClick={() => handleApplyQuickAction('endo')}
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              💉 Endo (عصب)
            </button>

            <button
              type="button"
              onClick={() => handleApplyQuickAction('crown')}
              className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              👑 Crown (تاج)
            </button>

            <button
              type="button"
              onClick={() => handleApplyQuickAction('extract')}
              className="py-2.5 px-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              🗜️ Extract (خلع)
            </button>

            <button
              type="button"
              onClick={() => handleApplyQuickAction('clean')}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              🧼 Clean (تنظيف)
            </button>

            <button
              type="button"
              onClick={() => handleApplyQuickAction('healthy')}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              🌿 Healthy (سليم)
            </button>
          </div>
        </div>
      )}

      {/* Main Arch Odontogram Layout */}
      <div className="space-y-8 overflow-x-auto pb-4">
        {/* UPPER ARCH (MAXILLA) */}
        <div className="space-y-2 min-w-[660px]">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 px-3">
            <span>Upper Right (Q1)</span>
            <span className="text-sky-700 dark:text-sky-400 font-bold font-mono bg-sky-50 dark:bg-sky-950/80 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              MAXILLA (Upper Jaw)
            </span>
            <span>Upper Left (Q2)</span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex gap-1 sm:gap-2">
              {UPPER_JAW_RIGHT.map((num) => renderToothSVG(num))}
            </div>

            <div className="h-16 w-0.5 bg-sky-400 mx-2 rounded-full opacity-60"></div>

            <div className="flex gap-1 sm:gap-2">
              {UPPER_JAW_LEFT.map((num) => renderToothSVG(num))}
            </div>
          </div>
        </div>

        {/* DECIDUOUS ARCHES IF TOGGLED */}
        {showPediatric && (
          <div className="space-y-3 min-w-[500px] bg-purple-50/60 dark:bg-purple-950/30 p-4 rounded-3xl border border-purple-200 dark:border-purple-800/60">
            <div className="text-center text-xs font-black text-purple-800 dark:text-purple-300 uppercase tracking-wider">
              Pediatric Primary Teeth (الأسنان اللبنية)
            </div>
            <div className="flex flex-col gap-3">
              {/* Upper Ped */}
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <div className="flex gap-1">{UPPER_PED_RIGHT.map((num) => renderToothSVG(num, true))}</div>
                <div className="h-12 w-0.5 bg-purple-400 mx-2"></div>
                <div className="flex gap-1">{UPPER_PED_LEFT.map((num) => renderToothSVG(num, true))}</div>
              </div>
              {/* Lower Ped */}
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <div className="flex gap-1">{LOWER_PED_RIGHT.map((num) => renderToothSVG(num, true))}</div>
                <div className="h-12 w-0.5 bg-purple-400 mx-2"></div>
                <div className="flex gap-1">{LOWER_PED_LEFT.map((num) => renderToothSVG(num, true))}</div>
              </div>
            </div>
          </div>
        )}

        {/* LOWER ARCH (MANDIBLE) */}
        <div className="space-y-2 min-w-[660px]">
          <div className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex gap-1 sm:gap-2">
              {LOWER_JAW_RIGHT.map((num) => renderToothSVG(num))}
            </div>

            <div className="h-16 w-0.5 bg-sky-400 mx-2 rounded-full opacity-60"></div>

            <div className="flex gap-1 sm:gap-2">
              {LOWER_JAW_LEFT.map((num) => renderToothSVG(num))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 px-3">
            <span>Lower Right (Q4)</span>
            <span className="text-sky-700 dark:text-sky-400 font-bold font-mono bg-sky-50 dark:bg-sky-950/80 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              MANDIBLE (Lower Jaw)
            </span>
            <span>Lower Left (Q3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
