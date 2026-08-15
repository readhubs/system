import React, { useState } from 'react';
import { Doctor, ToothRecord, ToothSurface } from '../types';
import { Stethoscope, DollarSign, UserCheck, Shield, FileText } from 'lucide-react';

interface AddProcedureModalProps {
  toothNumber: number;
  doctors: Doctor[];
  onSubmit: (procedure: Omit<ToothRecord, 'id'>) => void;
  onClose: () => void;
}

const COMMON_DENTAL_PROCEDURES = [
  "Root Canal Treatment (Endo)",
  "Composite Filling (Class I / II / V)",
  "Zirconia Crown Restoration",
  "Porcelain Laminate Veneer",
  "Surgical Tooth Extraction",
  "Straumann Dental Implant Placement",
  "Post & Core Restoration",
  "Scaling & Polishing",
  "Teeth Whitening (Bleaching)"
];

const SURFACES: ToothSurface[] = ['O', 'M', 'D', 'B', 'L'];

export const AddProcedureModal: React.FC<AddProcedureModalProps> = ({
  toothNumber,
  doctors,
  onSubmit,
  onClose
}) => {
  const [procedureName, setProcedureName] = useState(COMMON_DENTAL_PROCEDURES[0]);
  const [customProcedure, setCustomProcedure] = useState('');
  const [cost, setCost] = useState<string>('');
  const [performingDoctorId, setPerformingDoctorId] = useState<string>(
    doctors.find((d) => d.type === 'in-house')?.id || ''
  );
  const [contributingDoctorId, setContributingDoctorId] = useState<string>('');
  const [commissionPercent, setCommissionPercent] = useState<string>('0');
  const [status, setStatus] = useState<'completed' | 'planned'>('completed');
  const [notes, setNotes] = useState('');
  const [selectedSurfaces, setSelectedSurfaces] = useState<ToothSurface[]>(['O']);

  const toggleSurface = (surf: ToothSurface) => {
    if (selectedSurfaces.includes(surf)) {
      setSelectedSurfaces(selectedSurfaces.filter((s) => s !== surf));
    } else {
      setSelectedSurfaces([...selectedSurfaces, surf]);
    }
  };

  const handleDoctorChange = (docId: string) => {
    setContributingDoctorId(docId);
    const doc = doctors.find((d) => d.id === docId);
    if (doc) {
      setCommissionPercent(String(doc.defaultCommissionPercent || 0));
    } else {
      setCommissionPercent('0');
    }
  };

  const numCost = parseFloat(cost) || 0;
  const numCommission = parseFloat(commissionPercent) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProcedureName = procedureName === 'Other' ? customProcedure : procedureName;
    if (!finalProcedureName) return;

    const performingDoc = doctors.find((d) => d.id === performingDoctorId);
    const contributingDoc = doctors.find((d) => d.id === contributingDoctorId);

    onSubmit({
      toothNumber,
      procedureName: finalProcedureName,
      date: new Date().toISOString().split('T')[0],
      cost: numCost,
      performingDoctorId,
      performingDoctorName: performingDoc?.name,
      contributingDoctorId: contributingDoctorId || undefined,
      contributingDoctorName: contributingDoc?.name || undefined,
      commissionPercent: contributingDoctorId ? numCommission : 0,
      status,
      notes: notes.trim(),
      surfaces: selectedSurfaces
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">Record Treatment</h2>
                <span className="text-xs bg-sky-600 text-white font-mono font-bold px-2.5 py-0.5 rounded-full">
                  Tooth #{toothNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">Record clinical procedure and financial commission split</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 text-xl font-bold rounded-xl hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
          {/* Procedure Name Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Procedure Name *
            </label>
            <select
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none font-bold text-slate-800 bg-white"
            >
              {COMMON_DENTAL_PROCEDURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="Other">Other / Custom Procedure...</option>
            </select>

            {procedureName === 'Other' && (
              <input
                type="text"
                required
                placeholder="Enter custom procedure name"
                value={customProcedure}
                onChange={(e) => setCustomProcedure(e.target.value)}
                className="w-full mt-2 p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400 text-sm font-medium"
              />
            )}
          </div>

          {/* Tooth Surfaces Selector */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tooth Surfaces Involved
            </label>
            <div className="flex gap-2">
              {SURFACES.map((surf) => {
                const active = selectedSurfaces.includes(surf);
                return (
                  <button
                    key={surf}
                    type="button"
                    onClick={() => toggleSurface(surf)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-extrabold border transition-colors ${
                      active
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {surf}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cost & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Total Cost (EGP) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="e.g. 500 or any custom amount"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none font-mono font-bold text-emerald-600 text-base"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Treatment Status</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border ${
                    status === 'completed'
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('planned')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border ${
                    status === 'planned'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Planned
                </button>
              </div>
            </div>
          </div>

          {/* Performing Doctor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" /> Performing In-House Doctor *
            </label>
            <select
              value={performingDoctorId}
              onChange={(e) => setPerformingDoctorId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none bg-white text-slate-900 font-medium"
            >
              {doctors
                .filter((d) => d.type === 'in-house')
                .map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Referral / Contributing Doctor & Commission */}
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-3">
            <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-600" /> Contributing / Referral Doctor (Commission Split)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={contributingDoctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-amber-300 focus:border-amber-500 outline-none bg-white text-slate-900 font-medium"
                >
                  <option value="">None (No external referral commission)</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.type === 'external-referral' ? 'External Referral' : 'Specialist'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  placeholder="Comm. %"
                  disabled={!contributingDoctorId}
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-amber-300 focus:border-amber-500 outline-none font-mono font-bold bg-white text-amber-900 placeholder:text-amber-600/60 disabled:opacity-50"
                />
              </div>
            </div>

            {contributingDoctorId && (
              <p className="text-[11px] font-semibold text-amber-800">
                Commission Owed:{' '}
                <span className="font-mono font-black text-amber-950">
                  {((numCost * numCommission) / 100).toFixed(0)} EGP
                </span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-sky-600" /> Clinical Notes
            </label>
            <textarea
              rows={2}
              placeholder="Instrumentation details, materials used, shade, prognosis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none text-slate-900 bg-white placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-extrabold hover:bg-sky-700 shadow-md transition-colors"
            >
              Save Treatment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
