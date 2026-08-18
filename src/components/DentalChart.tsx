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

// FDI Permanent Teeth Layout (Anatomical: Patient's Right is on Viewer's Left)
const UPPER_JAW_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_JAW_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];

const LOWER_JAW_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_JAW_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

// Pediatric Teeth
const UPPER_PED_RIGHT = [55, 54, 53, 52, 51];
const UPPER_PED_LEFT = [61, 62, 63, 64, 65];
const LOWER_PED_RIGHT = [85, 84, 83, 82, 81];
const LOWER_PED_LEFT = [71, 72, 73, 74, 75];

// Tooth classification helper for anatomical fidelity
const getToothAnatomy = (num: number) => {
  // Permanent teeth
  if ([18, 28, 38, 48].includes(num)) {
    return { type: 'wisdom', label: 'M3 (Wisdom)', short: 'M3', fullName: '3rd Molar (Wisdom)' };
  }
  if ([17, 27, 37, 47].includes(num)) {
    return { type: 'molar2', label: 'M2 (2nd Molar)', short: 'M2', fullName: '2nd Molar' };
  }
  if ([16, 26, 36, 46].includes(num)) {
    return { type: 'molar1', label: 'M1 (1st Molar)', short: 'M1', fullName: '1st Molar' };
  }
  if ([15, 25, 35, 45].includes(num)) {
    return { type: 'premolar2', label: 'P2 (2nd Premolar)', short: 'P2', fullName: '2nd Premolar' };
  }
  if ([14, 24, 34, 44].includes(num)) {
    return { type: 'premolar1', label: 'P1 (1st Premolar)', short: 'P1', fullName: '1st Premolar' };
  }
  if ([13, 23, 33, 43].includes(num)) {
    return { type: 'canine', label: 'C (Canine)', short: 'C', fullName: 'Canine' };
  }
  if ([12, 22, 32, 42].includes(num)) {
    return { type: 'incisor_lateral', label: 'I2 (Lateral Incisor)', short: 'I2', fullName: 'Lateral Incisor' };
  }
  if ([11, 21, 31, 41].includes(num)) {
    return { type: 'incisor_central', label: 'I1 (Central Incisor)', short: 'I1', fullName: 'Central Incisor' };
  }
  // Deciduous
  if ([55, 65, 75, 85].includes(num)) {
    return { type: 'molar2', label: 'Primary 2nd Molar', short: 'm2', fullName: 'Deciduous 2nd Molar' };
  }
  if ([54, 64, 74, 84].includes(num)) {
    return { type: 'molar1', label: 'Primary 1st Molar', short: 'm1', fullName: 'Deciduous 1st Molar' };
  }
  if ([53, 63, 73, 83].includes(num)) {
    return { type: 'canine', label: 'Primary Canine', short: 'c', fullName: 'Deciduous Canine' };
  }
  if ([52, 62, 72, 82].includes(num)) {
    return { type: 'incisor_lateral', label: 'Primary Lateral', short: 'i2', fullName: 'Deciduous Lateral' };
  }
  return { type: 'incisor_central', label: 'Primary Central', short: 'i1', fullName: 'Deciduous Central' };
};

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
          bgClass: 'bg-sky-500 text-white border-sky-600 shadow-sky-500/20',
          label: 'Treated (Filling)',
          badgeColor: 'bg-sky-500'
        };
      case 'needs-treatment':
        return {
          fill: '#f59e0b', // Amber 500
          stroke: '#d97706',
          bgClass: 'bg-amber-400 text-amber-950 border-amber-500 shadow-amber-500/20',
          label: 'Needs Treatment',
          badgeColor: 'bg-amber-400'
        };
      case 'extracted':
        return {
          fill: '#334155', // Slate 700
          stroke: '#1e293b',
          bgClass: 'bg-slate-800 text-slate-200 border-slate-900',
          label: 'Extracted',
          badgeColor: 'bg-slate-800'
        };
      case 'endo':
        return {
          fill: '#0d9488', // Teal 600
          stroke: '#0f766e',
          bgClass: 'bg-teal-500 text-white border-teal-600 shadow-teal-500/20',
          label: 'Endo (RCT)',
          badgeColor: 'bg-teal-500'
        };
      case 'crown':
        return {
          fill: '#9333ea', // Purple 600
          stroke: '#7e22ce',
          bgClass: 'bg-purple-500 text-white border-purple-600 shadow-purple-500/20',
          label: 'Crown (Prosthesis)',
          badgeColor: 'bg-purple-500'
        };
      default:
        return {
          fill: '#ffffff',
          stroke: '#cbd5e1',
          bgClass: 'bg-white text-slate-800 border-slate-300 hover:border-sky-500 shadow-xs',
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

  // Render dedicated anatomical SVG based on tooth classification
  const renderAnatomicalIcon = (num: number, status: ToothStatus) => {
    if (status === 'extracted') {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-rose-400 font-black text-base sm:text-lg leading-none">✕</span>
        </div>
      );
    }

    const anatomy = getToothAnatomy(num);

    switch (anatomy.type) {
      case 'wisdom': // Teeth 18, 28, 38, 48 (3rd Molars / Wisdom)
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
            {/* Outer occlusal table with rounded contour */}
            <rect x="5" y="5" width="30" height="30" rx="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
            {/* 4-cusp developmental grooves with central fossa */}
            <line x1="5" y1="20" x2="35" y2="20" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1 1" />
            <line x1="20" y1="5" x2="20" y2="35" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1 1" />
            {/* Occlusal surface highlights */}
            <polygon points="5,5 15,15 25,15 35,5" fill="currentColor" fillOpacity="0.22" />
            <polygon points="35,5 25,15 25,25 35,35" fill="currentColor" fillOpacity="0.32" />
            <polygon points="35,35 25,25 15,25 5,35" fill="currentColor" fillOpacity="0.22" />
            <polygon points="5,35 15,25 15,15 5,5" fill="currentColor" fillOpacity="0.32" />
            {/* Central pit */}
            <circle cx="20" cy="20" r="3.5" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1" />
          </svg>
        );

      case 'molar2': // Teeth 17, 27, 37, 47 (2nd Molars)
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
            {/* 4-cusp Quad Molar Morphology (MB, DB, ML, DL) */}
            <rect x="4" y="4" width="32" height="32" rx="7" fill="none" stroke="currentColor" strokeWidth="2.4" />
            {/* Cruciate developmental fissure */}
            <line x1="4" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="1.8" />
            <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="1.8" />
            {/* Four anatomical cusps */}
            <polygon points="4,4 14,14 26,14 36,4" fill="currentColor" fillOpacity="0.2" />
            <polygon points="36,4 26,14 26,26 36,36" fill="currentColor" fillOpacity="0.3" />
            <polygon points="36,36 26,26 14,26 4,36" fill="currentColor" fillOpacity="0.2" />
            <polygon points="4,36 14,26 14,14 4,4" fill="currentColor" fillOpacity="0.3" />
            {/* Central fossa pit */}
            <rect x="15" y="15" width="10" height="10" rx="2" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />
          </svg>
        );

      case 'molar1': // Teeth 16, 26, 36, 46 (1st Molars - 5 cusps)
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
            {/* 5-cusp Pentagonal/Rhomboid Molar Morphology with Cusp of Carabelli */}
            <rect x="4" y="4" width="32" height="32" rx="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <polygon points="4,4 13,13 27,13 36,4" fill="currentColor" fillOpacity="0.25" />
            <polygon points="36,4 27,13 27,27 36,36" fill="currentColor" fillOpacity="0.35" />
            <polygon points="36,36 27,27 13,27 4,36" fill="currentColor" fillOpacity="0.25" />
            <polygon points="4,36 13,27 13,13 4,4" fill="currentColor" fillOpacity="0.35" />
            {/* 5th Cusp / Carabelli lobe indication */}
            <circle cx="9" cy="9" r="2.5" fill="currentColor" fillOpacity="0.5" />
            <rect x="13" y="13" width="14" height="14" rx="3" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        );

      case 'premolar1':
      case 'premolar2': // Teeth 14, 15, 24, 25, 34, 35, 44, 45 (Bicuspids)
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
            {/* Bicuspid Oval with 2 distinct cusps and central groove */}
            <rect x="6" y="5" width="28" height="30" rx="11" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <line x1="6" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="2" />
            {/* Buccal and Lingual cusp lobes */}
            <ellipse cx="20" cy="13" rx="7" ry="4.5" fill="currentColor" fillOpacity="0.35" />
            <ellipse cx="20" cy="27" rx="7" ry="4.5" fill="currentColor" fillOpacity="0.35" />
            <circle cx="20" cy="20" r="2" fill="currentColor" />
          </svg>
        );

      case 'canine': // Teeth 13, 23, 33, 43 (Cuspids)
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
            {/* Pointed Canine Diamond Cusp with Labial Ridge */}
            <path d="M 20,4 L 34,18 L 28,36 L 12,36 L 6,18 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <line x1="20" y1="4" x2="20" y2="36" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 1" />
            <polygon points="20,8 30,19 20,32 10,19" fill="currentColor" fillOpacity="0.3" />
            <circle cx="20" cy="19" r="3" fill="currentColor" fillOpacity="0.5" />
          </svg>
        );

      case 'incisor_lateral': // Teeth 12, 22, 32, 42 (Lateral Incisors)
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
            {/* Slender Chisel Lateral Incisal Edge */}
            <path d="M 10,7 C 12,5 28,5 30,7 C 33,14 30,33 20,36 C 10,33 7,14 10,7 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <line x1="12" y1="10" x2="28" y2="10" stroke="currentColor" strokeWidth="2.2" />
            <path d="M 13,13 L 27,13 L 20,30 Z" fill="currentColor" fillOpacity="0.3" />
          </svg>
        );

      default: // Teeth 11, 21, 31, 41 (Central Incisors)
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-xs">
            {/* Broad Chisel Central Incisal Edge with 3 Mamelon Ridges */}
            <path d="M 8,6 C 11,4 29,4 32,6 C 35,14 32,34 20,37 C 8,34 5,14 8,6 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <line x1="9" y1="9" x2="31" y2="9" stroke="currentColor" strokeWidth="2.5" />
            <line x1="15" y1="9" x2="15" y2="16" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
            <line x1="25" y1="9" x2="25" y2="16" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
            <path d="M 12,12 L 28,12 L 20,31 Z" fill="currentColor" fillOpacity="0.35" />
          </svg>
        );
    }
  };

  const renderToothItem = (num: number, isDeciduous: boolean = false) => {
    const isSelected = selectedToothNumber === num;
    const status = toothStatus[num] || 'healthy';
    const visual = getToothVisualProps(num);
    const anatomy = getToothAnatomy(num);

    return (
      <div key={num} className="relative group flex flex-col items-center shrink-0">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => handleToothClick(num)}
          className={`relative flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer shrink-0 ${
            isDeciduous
              ? 'w-9 sm:w-10 h-16'
              : 'w-9 sm:w-10 md:w-11 lg:w-11 h-17 sm:h-19'
          } ${visual.bgClass} ${
            isSelected
              ? 'ring-4 ring-sky-500 ring-offset-2 scale-105 z-20 border-sky-600 shadow-lg'
              : 'hover:scale-103 hover:shadow-md'
          }`}
          title={`Tooth #${num}: ${anatomy.fullName} — Status: ${visual.label}`}
        >
          {/* Anatomical Icon Header (Custom SVG per tooth type) */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0 mt-0.5">
            {renderAnatomicalIcon(num, status)}
          </div>

          {/* FDI Tooth ID & Classification Badge */}
          <div className="flex flex-col items-center leading-none mt-1">
            <span className="font-mono font-black text-[11px] sm:text-xs tracking-tight">#{num}</span>
            <span className="text-[8px] sm:text-[9px] font-extrabold uppercase opacity-75 mt-0.5">
              {anatomy.short}
            </span>
          </div>

          {/* Quick status indicator dot if not healthy */}
          {status !== 'healthy' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white bg-current"></span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Interactive Odontogram (Dental Arch)
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
              32-Teeth FDI System
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full anatomical view (#18 to #48). Click any tooth to record procedures or view history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPediatric(!showPediatric)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            showPediatric
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {showPediatric ? 'Hide Pediatric (Deciduous)' : 'Show Pediatric Teeth'}
        </button>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-white border-2 border-slate-300"></span>
          <span className="text-slate-700 font-bold">Healthy (سليم)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-sky-500"></span>
          <span className="text-sky-800 font-bold">Treated (حشو)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-teal-500"></span>
          <span className="text-teal-800 font-bold">Endo / RCT (عصب)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-purple-500"></span>
          <span className="text-purple-800 font-bold">Crown (تركيبة)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-400"></span>
          <span className="text-amber-900 font-bold">Needs Treatment (يحتاج علاج)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-800"></span>
          <span className="text-slate-800 font-bold">Extracted (مخلوع)</span>
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
              <div>
                <span className="font-bold text-sm">Quick Action for Tooth #{activeMenuTooth}</span>
                <span className="text-xs text-slate-400 ml-2">({getToothAnatomy(activeMenuTooth).fullName})</span>
              </div>
            </div>
            <button
              onClick={() => setActiveMenuTooth(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
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
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
            >
              🌿 Healthy (سليم)
            </button>
          </div>
        </div>
      )}

      {/* Main Arch Odontogram Layout */}
      <div className="space-y-8 overflow-x-auto pb-4 pt-1">
        {/* UPPER ARCH (MAXILLA) */}
        <div className="space-y-2 min-w-[620px]">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 px-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Upper Right (Q1: #18–#11)
            </span>
            <span className="text-sky-800 font-extrabold font-mono bg-sky-100 px-3 py-1 rounded-full border border-sky-300">
              MAXILLA (Upper Jaw)
            </span>
            <span className="flex items-center gap-1.5">
              Upper Left (Q2: #21–#28)
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            </span>
          </div>

          <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 bg-slate-50 p-3 sm:p-4 rounded-3xl border border-slate-200">
            {/* Q1: 18, 17, 16, 15, 14, 13, 12, 11 */}
            <div className="flex gap-1 sm:gap-1.5">
              {UPPER_JAW_RIGHT.map((num) => renderToothItem(num))}
            </div>

            {/* Midline Divider */}
            <div className="h-16 w-0.5 bg-sky-500 mx-1.5 sm:mx-2 rounded-full opacity-60 shrink-0"></div>

            {/* Q2: 21, 22, 23, 24, 25, 26, 27, 28 */}
            <div className="flex gap-1 sm:gap-1.5">
              {UPPER_JAW_LEFT.map((num) => renderToothItem(num))}
            </div>
          </div>
        </div>

        {/* DECIDUOUS ARCHES IF TOGGLED */}
        {showPediatric && (
          <div className="space-y-3 min-w-[500px] bg-purple-50 p-4 rounded-3xl border border-purple-200">
            <div className="text-center text-xs font-black text-purple-900 uppercase tracking-wider">
              Pediatric Primary Teeth (الأسنان اللبنية: #55–#51 | #61–#65 & #85–#81 | #71–#75)
            </div>
            <div className="flex flex-col gap-3">
              {/* Upper Ped */}
              <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5">
                <div className="flex gap-1">{UPPER_PED_RIGHT.map((num) => renderToothItem(num, true))}</div>
                <div className="h-12 w-0.5 bg-purple-400 mx-2 shrink-0"></div>
                <div className="flex gap-1">{UPPER_PED_LEFT.map((num) => renderToothItem(num, true))}</div>
              </div>
              {/* Lower Ped */}
              <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5">
                <div className="flex gap-1">{LOWER_PED_RIGHT.map((num) => renderToothItem(num, true))}</div>
                <div className="h-12 w-0.5 bg-purple-400 mx-2 shrink-0"></div>
                <div className="flex gap-1">{LOWER_PED_LEFT.map((num) => renderToothItem(num, true))}</div>
              </div>
            </div>
          </div>
        )}

        {/* LOWER ARCH (MANDIBLE) */}
        <div className="space-y-2 min-w-[620px]">
          <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 bg-slate-50 p-3 sm:p-4 rounded-3xl border border-slate-200">
            {/* Q4: 48, 47, 46, 45, 44, 43, 42, 41 */}
            <div className="flex gap-1 sm:gap-1.5">
              {LOWER_JAW_RIGHT.map((num) => renderToothItem(num))}
            </div>

            {/* Midline Divider */}
            <div className="h-16 w-0.5 bg-sky-500 mx-1.5 sm:mx-2 rounded-full opacity-60 shrink-0"></div>

            {/* Q3: 31, 32, 33, 34, 35, 36, 37, 38 */}
            <div className="flex gap-1 sm:gap-1.5">
              {LOWER_JAW_LEFT.map((num) => renderToothItem(num))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 px-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Lower Right (Q4: #48–#41)
            </span>
            <span className="text-sky-800 font-extrabold font-mono bg-sky-100 px-3 py-1 rounded-full border border-sky-300">
              MANDIBLE (Lower Jaw)
            </span>
            <span className="flex items-center gap-1.5">
              Lower Left (Q3: #31–#38)
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
