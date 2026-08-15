import React, { useState } from 'react';
import { DentalLabsPage } from './DentalLabsPage';
import { FollowUpsPage } from './FollowUpsPage';
import { SmartScheduler } from './SmartScheduler';
import { Patient, Appointment, Doctor, DentalLabOrder, ClinicSettings } from '../types';
import { Layers, MessageCircle, Sparkles } from 'lucide-react';

interface OperationsHubProps {
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
  labOrders: DentalLabOrder[];
  clinicSettings: ClinicSettings;
  clinicId: string;
  onSelectPatient: (patientId: string) => void;
}

export const OperationsHub: React.FC<OperationsHubProps> = ({
  patients,
  appointments,
  doctors,
  labOrders,
  clinicSettings,
  clinicId,
  onSelectPatient
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'labs' | 'whatsapp' | 'radar'>('labs');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Operations
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Manage dental labs, patient communications, and treatment planning
        </p>
      </div>

      {/* Modern Tabs */}
      <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('labs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'labs'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="w-4 h-4" /> Dental Labs
        </button>
        <button
          onClick={() => setActiveSubTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'whatsapp'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp CRM
        </button>
        <button
          onClick={() => setActiveSubTab('radar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'radar'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Smart Radar
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6">
        {activeSubTab === 'labs' && (
          <DentalLabsPage
            labOrders={labOrders}
            patients={patients}
            doctors={doctors}
            clinicSettings={clinicSettings}
            clinicId={clinicId}
            onSelectPatient={(p) => onSelectPatient(p.id)}
          />
        )}
        {activeSubTab === 'whatsapp' && (
          <FollowUpsPage
            patients={patients}
            appointments={appointments}
            clinicSettings={clinicSettings}
            onSelectPatient={onSelectPatient}
          />
        )}
        {activeSubTab === 'radar' && (
          <SmartScheduler
            patients={patients}
            appointments={appointments}
            onBookForPatient={onSelectPatient}
          />
        )}
      </div>
    </div>
  );
};
