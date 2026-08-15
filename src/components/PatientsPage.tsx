import React, { useState } from 'react';
import { Patient } from '../types';
import { generateAppointmentReminderWhatsAppLink } from '../lib/whatsapp';
import { Users, Search, Plus, Phone, AlertTriangle, MessageSquare, ChevronRight, UserCheck, DollarSign, Trash2 } from 'lucide-react';

interface PatientsPageProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatientModal: () => void;
  onDeletePatient?: (patientId: string) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({
  patients,
  onSelectPatient,
  onOpenAddPatientModal,
  onDeletePatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'balance' | 'alerts' | 'unscheduled'>('all');

  const filteredPatients = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(query);
    const phoneMatch = p.phone.includes(query);
    const idMatch = p.id.toLowerCase().includes(query);
    const matchesQuery = nameMatch || phoneMatch || idMatch;

    if (!matchesQuery) return false;

    if (filterType === 'balance') return p.balance > 0;
    if (filterType === 'alerts') {
      return Array.isArray(p.medicalAlerts)
        ? p.medicalAlerts.length > 0
        : Boolean(p.medicalAlerts && String(p.medicalAlerts).trim().length > 0);
    }
    if (filterType === 'unscheduled') {
      const hasUntreated = Object.values(p.toothStatus || {}).some((s) => s === 'needs-treatment');
      return hasUntreated;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> Patient Files & Demographic Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search patient database by name, phone number, or clinical ID
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddPatientModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Patient File
        </button>
      </div>

      {/* Search Bar & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by name, phone (+201...), or file ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:border-sky-500 outline-none shadow-2xs"
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {[
            { id: 'all', label: `All (${patients.length})` },
            { id: 'balance', label: 'Uncollected Debt' },
            { id: 'alerts', label: 'Medical Alerts' },
            { id: 'unscheduled', label: 'Needs Treatment' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id as any)}
              className={`px-3.5 py-2.5 rounded-xl border whitespace-nowrap transition-colors ${
                filterType === f.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => {
            const hasAlerts = Array.isArray(patient.medicalAlerts)
              ? patient.medicalAlerts.length > 0
              : Boolean(patient.medicalAlerts && String(patient.medicalAlerts).trim().length > 0);
            const treatedCount = Object.values(patient.toothStatus || {}).filter((s) => s === 'treated').length;
            const needsCount = Object.values(patient.toothStatus || {}).filter((s) => s === 'needs-treatment').length;

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 cursor-pointer transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base group-hover:text-sky-600 transition-colors">
                          {patient.name}
                        </h3>
                        <span className="text-[10px] font-mono font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {patient.gender === 'male' ? 'M' : 'F'}, {patient.age}y
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-sky-600" /> {patient.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {onDeletePatient && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete patient file for "${patient.name}"? This cannot be undone.`)) {
                              onDeletePatient(patient.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Medical Alerts Pill */}
                  {hasAlerts && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 font-bold flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {Array.isArray(patient.medicalAlerts)
                          ? patient.medicalAlerts.join(', ')
                          : String(patient.medicalAlerts)}
                      </span>
                    </div>
                  )}

                  {/* Dental Status Snapshot */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-1">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Treated Teeth</span>
                      <p className="font-mono font-extrabold text-emerald-600">{treatedCount} Teeth</p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Needs Treatment</span>
                      <p className="font-mono font-extrabold text-amber-600">{needsCount} Teeth</p>
                    </div>
                  </div>
                </div>

                {/* Footer Balance */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-400 uppercase text-[10px]">Account Balance</span>
                  <span className={patient.balance > 0 ? 'text-amber-600 font-mono font-black' : 'text-emerald-600 font-mono'}>
                    {patient.balance > 0 ? `${patient.balance.toLocaleString()} EGP` : 'Settled (0 EGP)'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">No patient files found matching "{searchQuery}"</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms or add a new patient.</p>
          </div>
        )}
      </div>
    </div>
  );
};
