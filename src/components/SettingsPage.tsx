import React, { useState } from 'react';
import {
  ClinicSettings,
  UserProfile,
  Patient,
  Appointment
} from '../types';
import {
  Settings,
  Globe,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Users,
  UserPlus,
  MessageSquare,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Lock,
  Trash2,
  Phone,
  Key,
  Copy,
  Info,
  Check,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { exportToCSV } from '../lib/firestoreService';

interface SettingsPageProps {
  settings: ClinicSettings;
  onUpdateSettings: (updated: ClinicSettings) => void;
  currentUser: UserProfile;
  patients: Patient[];
  appointments: Appointment[];
  staffList: UserProfile[];
  onAddAssistant?: (name: string, phone: string, pass: string) => Promise<void>;
  onToggleAssistantStatus?: (assistant: UserProfile) => Promise<void>;
  onDeleteAssistant?: (assistantId: string) => Promise<void>;
  lang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  currentUser,
  patients,
  appointments,
  staffList,
  onAddAssistant,
  onToggleAssistantStatus,
  onDeleteAssistant,
  lang,
  onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'assistants' | 'whatsapp' | 'export' | 'terms'>('profile');

  // Profile state
  const [name, setName] = useState(settings.name || '');
  const [doctorName, setDoctorName] = useState(settings.doctorName || currentUser.name || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [savedAlert, setSavedAlert] = useState(false);

  // WhatsApp Template state
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>(
    settings.whatsappTemplate ||
      `مرحباً [PatientName] 👋\nنود تذكيركم بموعدكم القادم في [ClinicName]:\n📅 التاريخ: [Date]\n⏰ الساعة: [Time]\n👨‍⚕️ الطبيب المعالج: [DoctorName]\n🦷 الإجراء: [Procedure]\n\nيرجى الرد لتأكيد الحضور. شكراً لكم!`
  );

  // Add Assistant state
  const [assistantName, setAssistantName] = useState('');
  const [assistantPhone, setAssistantPhone] = useState('');
  const [assistantPassword, setAssistantPassword] = useState('');
  const [addingAssistant, setAddingAssistant] = useState(false);
  const [assistantSuccess, setAssistantSuccess] = useState('');

  // Terms Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);

  const assistants = staffList.filter((s) => s.role === 'assistant' && s.clinicId === currentUser.clinicId);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      name: name.trim(),
      doctorName: doctorName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      whatsappTemplate: whatsappTemplate.trim()
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleSaveWhatsAppTemplate = () => {
    onUpdateSettings({
      ...settings,
      whatsappTemplate: whatsappTemplate.trim()
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantName || !assistantPhone || !assistantPassword) return;

    setAddingAssistant(true);
    if (onAddAssistant) {
      await onAddAssistant(assistantName, assistantPhone, assistantPassword);
    }
    setAddingAssistant(false);
    setAssistantSuccess(`Assistant "${assistantName}" added successfully.`);
    setAssistantName('');
    setAssistantPhone('');
    setAssistantPassword('');
    setTimeout(() => setAssistantSuccess(''), 3000);
  };

  const handleExportPatients = () => {
    const exportRows = patients.map((p) => ({
      'Patient ID': p.id,
      'Full Name': p.name,
      'Phone Number': p.phone,
      'Gender': p.gender,
      'Age': p.age || '',
      'Outstanding Balance (EGP)': p.balance,
      'Medical Alerts': Array.isArray(p.medicalAlerts) ? p.medicalAlerts.join('; ') : String(p.medicalAlerts || ''),
      'Created Date': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''
    }));

    exportToCSV(`Patients_${settings.name || 'Clinic'}_${new Date().toISOString().split('T')[0]}.csv`, exportRows);
  };

  const handleExportAppointments = () => {
    const exportRows = appointments.map((a) => ({
      'Appointment ID': a.id,
      'Patient Name': a.patientName,
      'Phone': a.phone,
      'Date': a.date,
      'Time': a.time,
      'Procedure': a.procedure,
      'Status': a.status,
      'Doctor': a.doctorName || '',
      'Reminder Sent': a.reminderSent ? 'Yes' : 'No'
    }));

    exportToCSV(`Appointments_${settings.name || 'Clinic'}_${new Date().toISOString().split('T')[0]}.csv`, exportRows);
  };

  const insertPlaceholder = (tag: string) => {
    setWhatsappTemplate((prev) => prev + ` ${tag} `);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Clinic & SaaS Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-400">
              Doctor Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage reception assistants, custom WhatsApp templates, CSV exports, and offline security.
          </p>
        </div>

        {savedAlert && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Changes Saved Successfully!
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Clinic Profile
        </button>

        <button
          onClick={() => setActiveTab('assistants')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'assistants'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Assistants ({assistants.length})
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'whatsapp'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          WhatsApp
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'export'
              ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export CSV
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'terms'
              ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Offline Terms
        </button>
      </div>

      {/* ================================================= */}
      {/* TAB 1: CLINIC PROFILE & BRANDING                   */}
      {/* ================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chief Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Clinic Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-md active:scale-95 transition-all min-h-[48px]"
              >
                Save Clinic Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 2: MANAGE ASSISTANTS                           */}
      {/* ================================================= */}
      {activeTab === 'assistants' && (
        <div className="space-y-6">
          {/* Add Assistant Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Add New Reception Assistant</h2>
            </div>

            {assistantSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {assistantSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAssistant} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assistant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sara Ali"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Phone Number (Login)</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={assistantPhone}
                  onChange={(e) => setAssistantPhone(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Password</label>
                <input
                  type="text"
                  required
                  placeholder="••••••••"
                  value={assistantPassword}
                  onChange={(e) => setAssistantPassword(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-mono min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={addingAssistant}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition-all min-h-[44px]"
                >
                  {addingAssistant ? 'Creating...' : '+ Create Assistant Account'}
                </button>
              </div>
            </form>
          </div>

          {/* Assistants List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Active Clinic Assistants ({assistants.length})
            </h3>

            {assistants.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {assistants.map((ast) => (
                  <div key={ast.uid} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        {ast.name}
                        {ast.disabled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span className="font-mono">{ast.phone || ast.email}</span>
                        {ast.initialPassword && (
                          <span>• Password: <span className="font-mono text-indigo-500 font-bold">{ast.initialPassword}</span></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onToggleAssistantStatus && (
                        <button
                          onClick={() => onToggleAssistantStatus(ast)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            ast.disabled
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {ast.disabled ? 'Enable' : 'Disable'}
                        </button>
                      )}

                      {onDeleteAssistant && (
                        <button
                          onClick={() => onDeleteAssistant(ast.uid)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Assistant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No reception assistants registered yet. Use the form above to add your staff.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 3: WHATSAPP TEMPLATE EDITOR                    */}
      {/* ================================================= */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Default WhatsApp Reminder Template</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize the message template sent to patients. Insert dynamic tags by tapping the pills below.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { tag: '[PatientName]', label: '+ Patient Name' },
              { tag: '[Date]', label: '+ Date' },
              { tag: '[Time]', label: '+ Time' },
              { tag: '[DoctorName]', label: '+ Doctor' },
              { tag: '[ClinicName]', label: '+ Clinic' },
              { tag: '[Procedure]', label: '+ Procedure' }
            ].map(({ tag, label }) => (
              <button
                key={tag}
                type="button"
                onClick={() => insertPlaceholder(tag)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95"
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            rows={7}
            value={whatsappTemplate}
            onChange={(e) => setWhatsappTemplate(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm leading-relaxed outline-none focus:border-emerald-500"
          />

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Live Message Preview:
            </span>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              {whatsappTemplate
                .replace(/\[PatientName\]/g, 'أحمد محمود')
                .replace(/\[Date\]/g, '2026-08-15')
                .replace(/\[Time\]/g, '06:30 PM')
                .replace(/\[DoctorName\]/g, doctorName || 'د. محمد')
                .replace(/\[ClinicName\]/g, name || 'عيادة الأسنان')
                .replace(/\[Procedure\]/g, 'حشو عصب جلسة 2')}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveWhatsAppTemplate}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md active:scale-95 transition-all min-h-[48px]"
            >
              Save WhatsApp Template
            </button>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 4: DATA EXPORT (EXCEL/CSV)                     */}
      {/* ================================================= */}
      {activeTab === 'export' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">One-Click CSV / Excel Export</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export your clinical patient records and appointment ledger to standard CSV files compatible with Excel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Patients Registry</h3>
              </div>
              <p className="text-xs text-slate-500">
                Total {patients.length} registered patients, medical alerts, contact numbers, and outstanding debts.
              </p>
              <button
                onClick={handleExportPatients}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Export Patients (CSV)
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Appointments Ledger</h3>
              </div>
              <p className="text-xs text-slate-500">
                Total {appointments.length} historical and upcoming scheduled visits with procedure breakdown.
              </p>
              <button
                onClick={handleExportAppointments}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Export Appointments (CSV)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 5: TERMS & CONDITIONS & OFFLINE SAFETY         */}
      {/* ================================================= */}
      {activeTab === 'terms' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Terms of Service & Offline Data Protection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                IndexedDB Local Storage & Clinic Responsibility Notice
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-300 space-y-2 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              IMPORTANT CACHE RETENTION NOTICE (تنبيه هام):
            </div>
            <p>
              ClinicPro utilizes <strong>IndexedDB Local Cache</strong> to enable offline operation during internet disconnects in Egypt. All edits made offline are queued securely in your browser.
            </p>
            <p>
              <strong>Clinic Owner Responsibility:</strong> The clinic owner is strictly responsible for retaining local browser storage. If a user manually clears browser history, clears cookies and site cache, or operates in Incognito / Private Browsing mode while offline before connecting to the internet, any unsynced changes cannot be recovered by the SaaS provider.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <h4 className="font-bold text-slate-900 dark:text-white">Recommended Clinic Procedures:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Always connect the clinic PC or iPad to internet at least once at the end of the day to sync all records.</li>
              <li>Do not use Private / Incognito browsing tabs for official clinic data entry.</li>
              <li>Use the Export CSV button weekly to keep an offline Excel backup of your patient database.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
