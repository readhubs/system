import React, { useState } from 'react';
import { Patient } from '../types';
import { User, AlertTriangle, Phone, Calendar, HeartPulse, ShieldAlert, Trash2 } from 'lucide-react';

interface PatientHeaderProps {
  patient: Patient;
  onEditPatient?: () => void;
  onDeletePatient?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onEditPatient,
  onDeletePatient
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> DOB: {patient.birthDate}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Stat & Quick Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-right px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient Balance</p>
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

          {onDeletePatient && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              title="Delete Patient Record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Delete Patient File?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete <strong>{patient.name}</strong> and all associated clinical history?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeletePatient();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-700 shadow-md shadow-rose-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
