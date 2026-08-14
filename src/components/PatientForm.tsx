import React, { useState } from 'react';
import { Patient } from '../types';
import { UserPlus, AlertTriangle, ShieldCheck, Phone, User, Calendar, FileText } from 'lucide-react';

interface PatientFormProps {
  onSubmit: (patientData: Omit<Patient, 'id' | 'createdAt' | 'balance' | 'hasPendingTreatment' | 'toothStatus'>) => void;
  onClose: () => void;
  initialData?: Patient;
}

const COMMON_CONDITIONS = [
  "Diabetes (Sokkar)",
  "Hypertension (Daght)",
  "Heart Condition",
  "Blood Thinners (Aspirin/Marivan)",
  "Hepatitis B/C",
  "Penicillin Allergy",
  "Pregnancy",
  "Latex Allergy"
];

export const PatientForm: React.FC<PatientFormProps> = ({ onSubmit, onClose, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(initialData?.gender || 'Male');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '1990-01-01');
  const [medicalAlerts, setMedicalAlerts] = useState<string[]>(initialData?.medicalAlerts || []);
  const [medicalNotes, setMedicalNotes] = useState(initialData?.medicalNotes || '');

  const toggleAlert = (condition: string) => {
    if (medicalAlerts.includes(condition)) {
      setMedicalAlerts(medicalAlerts.filter((c) => c !== condition));
    } else {
      setMedicalAlerts([...medicalAlerts, condition]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      gender,
      birthDate,
      medicalAlerts,
      medicalNotes: medicalNotes.trim(),
      clinicId: initialData?.clinicId || 'clinic_cairo_1'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {initialData ? 'Edit Patient File' : 'New Patient Intake Form'}
              </h2>
              <p className="text-xs text-slate-500">Record demographics and medical alert conditions</p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-600" /> Full Patient Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ahmed Mohamed El-Khatib"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-sky-600" /> Mobile Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm font-mono"
              />
            </div>
          </div>

          {/* DOB & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" /> Date of Birth
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gender</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors ${
                    gender === 'Male'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors ${
                    gender === 'Female'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          {/* Medical Alerts Toggle Tags */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Common Medical History Alerts
              </label>
              <span className="text-[10px] text-slate-400">Select all that apply</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_CONDITIONS.map((condition) => {
                const isSelected = medicalAlerts.includes(condition);
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleAlert(condition)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {condition} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Medical Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-sky-600" /> Detailed Clinical Medical Notes
            </label>
            <textarea
              rows={3}
              placeholder="List surgical history, specific drug allergies, cardiac pacemakers, or current medications..."
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm font-medium"
            />
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-extrabold text-sm hover:bg-sky-700 shadow-md transition-colors"
            >
              {initialData ? 'Update File' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
