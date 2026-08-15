import React, { useState } from 'react';
import { Patient } from '../types';
import { generateAppointmentReminderWhatsAppLink } from '../lib/whatsapp';
import { Users, Search, Plus, Phone, AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Patient Registry
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Search and manage {patients.length} patient records
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddPatientModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Patient
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, phone (+201...), or file ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200/60 text-sm font-medium text-slate-900 focus:border-slate-400 outline-none shadow-xs"
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {[
            { id: 'all', label: 'All' },
            { id: 'balance', label: 'Uncollected Debt' },
            { id: 'alerts', label: 'Medical Alerts' },
            { id: 'unscheduled', label: 'Needs Treatment' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filterType === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200/60">Patient Name</th>
                <th className="px-4 py-3 border-b border-slate-200/60">Contact</th>
                <th className="px-4 py-3 border-b border-slate-200/60">Balance</th>
                <th className="px-4 py-3 border-b border-slate-200/60">Status</th>
                <th className="px-4 py-3 border-b border-slate-200/60 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const hasAlerts = Array.isArray(patient.medicalAlerts)
                    ? patient.medicalAlerts.length > 0
                    : Boolean(patient.medicalAlerts && String(patient.medicalAlerts).trim().length > 0);
                  const needsCount = Object.values(patient.toothStatus || {}).filter((s) => s === 'needs-treatment').length;

                  return (
                    <tr 
                      key={patient.id} 
                      onClick={() => onSelectPatient(patient.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 flex items-center gap-2">
                           {patient.name}
                           {hasAlerts && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                           {patient.gender === 'Male' ? 'M' : 'F'}, {patient.age}y
                        </div>
                      </td>
                      <td className="px-4 py-3">
                         <div className="font-mono text-xs text-slate-600 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                         </div>
                      </td>
                      <td className="px-4 py-3">
                         <span className={`font-mono font-bold ${patient.balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {patient.balance > 0 ? `${patient.balance.toLocaleString()} EGP` : 'Settled'}
                         </span>
                      </td>
                      <td className="px-4 py-3">
                         {needsCount > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                               {needsCount} Untreated
                            </span>
                         ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                               Clear
                            </span>
                         )}
                      </td>
                      <td className="px-4 py-3 text-right">
                         <button className="text-slate-400 group-hover:text-slate-900 transition-colors p-1">
                            <ChevronRight className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                     <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                     <p className="font-bold text-sm text-slate-600">No patient files found.</p>
                     <p className="text-xs mt-1">Try adjusting your search or filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
