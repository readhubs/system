import React, { useState } from 'react';
import { Patient } from '../types';
import {
  UserPlus,
  AlertTriangle,
  ShieldCheck,
  Phone,
  User,
  Calendar,
  FileText,
  Heart,
  FolderOpen,
  Check,
  MapPin,
  Briefcase
} from 'lucide-react';

interface PatientFormProps {
  onSubmit: (patientData: Omit<Patient, 'id' | 'createdAt' | 'balance' | 'hasPendingTreatment' | 'toothStatus'>) => void;
  onClose: () => void;
  initialData?: Patient;
  clinicId?: string;
}

const COMMON_CONDITIONS = [
  'Diabetes (السكر)',
  'Hypertension (الضغط)',
  'Cardiac Condition (أمراض القلب)',
  'Blood Thinners / Aspirin (سيولة الدم)',
  'Hepatitis B / C (التهاب الكبد)',
  'Penicillin Allergy (حساسية بنسلين)',
  'Pregnancy / Lactation (حمل أو رضاعة)',
  'Latex Allergy (حساسية لاتكس)',
  'Asthma / Respiratory (حساسية صدر)',
  'Kidney Disease (أمراض الكلى)'
];

export const PatientForm: React.FC<PatientFormProps> = ({
  onSubmit,
  onClose,
  initialData,
  clinicId = 'clinic_default'
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'medical' | 'notes'>('general');

  // Form State
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(initialData?.gender || 'Male');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const [age, setAge] = useState<string>(initialData?.age ? String(initialData.age) : '');
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [address, setAddress] = useState(initialData?.address || '');
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
    if (!name.trim() || !phone.trim()) {
      setActiveTab('general');
      return;
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      gender,
      birthDate: birthDate || undefined,
      age: age ? parseInt(age, 10) : undefined,
      occupation: occupation.trim() || undefined,
      address: address.trim() || undefined,
      medicalAlerts,
      medicalNotes: medicalNotes.trim(),
      clinicId: initialData?.clinicId || clinicId
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 rounded-2xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {initialData ? 'Edit Patient File' : 'Fast Patient Registration'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Only Name & Phone required for instant record creation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 text-xl font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
              activeTab === 'general'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            General Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
              activeTab === 'medical'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Medical Alerts ({medicalAlerts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
              activeTab === 'notes'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Notes & Bio
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Full Name (اسم المريض) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Mahmoud El-Sayed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:border-sky-500 outline-none text-sm font-semibold min-h-[48px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Mobile / WhatsApp (الموبايل) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:border-sky-500 outline-none text-sm font-mono min-h-[48px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender (النوع)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        gender === 'Male'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Male (ذكر)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                        gender === 'Female'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Female (أنثى)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Age (السن)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDICAL HISTORY CHIPS */}
          {activeTab === 'medical' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Quick Medical Conditions
                </label>
                <span className="text-[11px] text-slate-400">1-Tap Chip Toggles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMMON_CONDITIONS.map((cond) => {
                  const isSelected = medicalAlerts.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleAlert(cond)}
                      className={`p-3 rounded-xl text-xs font-bold text-left border flex items-center justify-between transition-all min-h-[44px] ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span>{cond}</span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Other Allergies or Chronic Conditions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Allergy to Sulfa drugs, taking Blood pressure med Coversyl daily"
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: NOTES & DEMOGRAPHICS */}
          {activeTab === 'notes' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  Occupation (المهنة)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Teacher, Engineer, Student"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Address / City (العنوان)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nasr City, Cairo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Exact Date of Birth (اختياري)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all min-h-[48px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-600/30 active:scale-95 transition-all flex items-center gap-2 min-h-[48px]"
            >
              <Check className="w-4 h-4" />
              {initialData ? 'Update Record' : 'Save Patient (حفظ)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
