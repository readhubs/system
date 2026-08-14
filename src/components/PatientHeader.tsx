import React from 'react';
import { Patient } from '../types';
import { User, AlertTriangle, Phone, Calendar, HeartPulse, ShieldAlert } from 'lucide-react';

interface PatientHeaderProps {
  patient: Patient;
  onEditPatient?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ patient, onEditPatient }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Patient Demographics */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 bg-sky-100 text-sky-700 rounded-2xl border border-sky-200 shadow-xs shrink-0">
            <User className="w-8 h-8" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{patient.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {patient.gender}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 mt-1">
              <span className="flex items-center gap-1 text-slate-700 font-mono">
                <Phone className="w-3.5 h-3.5 text-sky-600" /> {patient.phone}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> DOB: {patient.birthDate}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Stat & Quick Action */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Balance</p>
            <p
              className={`text-lg font-black font-mono ${
                patient.balance > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {patient.balance > 0 ? `${patient.balance.toLocaleString()} EGP (Owes)` : '0 EGP (Settled)'}
            </p>
          </div>

          {onEditPatient && (
            <button
              type="button"
              onClick={onEditPatient}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Edit File
            </button>
          )}
        </div>
      </div>

      {/* High-Priority Medical Alerts & Warnings */}
      {patient.medicalAlerts && patient.medicalAlerts.length > 0 ? (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 animate-pulse text-red-600" />
            <span>High-Priority Medical Alerts (Clinical Risk Factors)</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {patient.medicalAlerts.map((alert) => (
              <span
                key={alert}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-red-50 text-red-700 border border-red-200/80 shadow-2xs animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                {alert}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-100 text-xs font-medium text-emerald-700 flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-emerald-600" /> No severe systemic medical alerts reported.
        </div>
      )}

      {/* Detailed Clinical Medical Notes */}
      {patient.medicalNotes && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
          <strong className="font-bold text-amber-950">Clinical Notes: </strong>
          {patient.medicalNotes}
        </div>
      )}
    </div>
  );
};
