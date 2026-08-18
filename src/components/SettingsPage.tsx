import React, { useState } from 'react';
import {
  ClinicSettings,
  UserProfile,
  Patient,
  Appointment,
  ProcedureCatalogItem
} from '../types';
import { DEFAULT_PROCEDURES_CATALOG } from '../lib/defaultCatalog';
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
  ExternalLink,
  Tag,
  Plus,
  Edit3,
  Save,
  RotateCcw,
  Search,
  DollarSign
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
  const [activeTab, setActiveTab] = useState<'profile' | 'procedures' | 'assistants' | 'whatsapp' | 'export' | 'terms'>('profile');

  // Profile state
  const [name, setName] = useState(settings.name || '');
  const [doctorName, setDoctorName] = useState(settings.doctorName || currentUser.name || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [savedAlert, setSavedAlert] = useState(false);

  // Procedures Catalog State
  const [catalog, setCatalog] = useState<ProcedureCatalogItem[]>(
    (settings.proceduresCatalog && settings.proceduresCatalog.length > 0)
      ? settings.proceduresCatalog
      : DEFAULT_PROCEDURES_CATALOG
  );
  const [procedureSearch, setProcedureSearch] = useState('');
  const [newProcName, setNewProcName] = useState('');
  const [newProcCategory, setNewProcCategory] = useState('General');
  const [newProcPrice, setNewProcPrice] = useState('');
  const [editingProcId, setEditingProcId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');

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
      whatsappTemplate: whatsappTemplate.trim(),
      proceduresCatalog: catalog
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleSaveProceduresCatalog = () => {
    onUpdateSettings({
      ...settings,
      proceduresCatalog: catalog
    });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleAddProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcName.trim()) return;
    const priceNum = parseFloat(newProcPrice) || 0;
    const newItem: ProcedureCatalogItem = {
      id: `proc_${Date.now()}`,
      name: newProcName.trim(),
      category: newProcCategory.trim() || 'General',
      defaultPrice: priceNum
    };
    const updated = [...catalog, newItem];
    setCatalog(updated);
    onUpdateSettings({
      ...settings,
      proceduresCatalog: updated
    });
    setNewProcName('');
    setNewProcPrice('');
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleDeleteProcedure = (procId: string) => {
    const updated = catalog.filter((p) => p.id !== procId);
    setCatalog(updated);
    onUpdateSettings({
      ...settings,
      proceduresCatalog: updated
    });
  };

  const handleStartEdit = (item: ProcedureCatalogItem) => {
    setEditingProcId(item.id);
    setEditName(item.name);
    setEditCategory(item.category || 'General');
    setEditPrice(String(item.defaultPrice));
  };

  const handleSaveEdit = (procId: string) => {
    const updated = catalog.map((p) => {
      if (p.id === procId) {
        return {
          ...p,
          name: editName.trim() || p.name,
          category: editCategory.trim() || 'General',
          defaultPrice: parseFloat(editPrice) >= 0 ? parseFloat(editPrice) : p.defaultPrice
        };
      }
      return p;
    });
    setCatalog(updated);
    onUpdateSettings({
      ...settings,
      proceduresCatalog: updated
    });
    setEditingProcId(null);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleResetDefaultCatalog = () => {
    if (window.confirm('Reset catalog to standard dental procedure template? Any custom items will be overwritten.')) {
      setCatalog(DEFAULT_PROCEDURES_CATALOG);
      onUpdateSettings({
        ...settings,
        proceduresCatalog: DEFAULT_PROCEDURES_CATALOG
      });
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2500);
    }
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
            <h1 className="text-2xl font-black text-slate-900  tracking-tight">
              Clinic & SaaS Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800  ">
              Doctor Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500  mt-1">
            Manage reception assistants, custom WhatsApp templates, CSV exports, and offline security.
          </p>
        </div>

        {savedAlert && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600  text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Changes Saved Successfully!
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 p-1 bg-slate-100  rounded-2xl border border-slate-200 ">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'profile'
              ? 'bg-white  text-sky-600  shadow-sm'
              : 'text-slate-600  hover:text-slate-900 :text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Clinic Profile
        </button>

        <button
          onClick={() => setActiveTab('procedures')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'procedures'
              ? 'bg-white  text-teal-600  shadow-sm'
              : 'text-slate-600  hover:text-slate-900 :text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Procedures ({catalog.length})
        </button>

        <button
          onClick={() => setActiveTab('assistants')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'assistants'
              ? 'bg-white  text-indigo-600  shadow-sm'
              : 'text-slate-600  hover:text-slate-900 :text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Assistants ({assistants.length})
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'whatsapp'
              ? 'bg-white  text-emerald-600  shadow-sm'
              : 'text-slate-600  hover:text-slate-900 :text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          WhatsApp
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'export'
              ? 'bg-white  text-amber-600  shadow-sm'
              : 'text-slate-600  hover:text-slate-900 :text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Export CSV
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
            activeTab === 'terms'
              ? 'bg-white  text-rose-600  shadow-sm'
              : 'text-slate-600  hover:text-slate-900 :text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Offline Terms
        </button>
      </div>

      {/* ================================================= */}
      {/* TAB: PROCEDURES CATALOG & PRICING                  */}
      {/* ================================================= */}
      {activeTab === 'procedures' && (
        <div className="bg-white  p-6 rounded-3xl border border-slate-200  shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100  pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-600" />
                <h2 className="font-bold text-slate-900  text-base">
                  Procedures & Pricing Catalog
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700  ">
                  {catalog.length} Services
                </span>
              </div>
              <p className="text-xs text-slate-500  mt-1">
                Define standard services and default prices in EGP. These automatically populate dental charting with full manual price override.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultCatalog}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600  hover:bg-slate-100 :bg-slate-800 flex items-center gap-1.5 transition-colors"
                title="Reset to standard dental template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Template
              </button>
              <button
                type="button"
                onClick={handleSaveProceduresCatalog}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                Save Catalog
              </button>
            </div>
          </div>

          {/* Add New Procedure Form */}
          <form onSubmit={handleAddProcedure} className="p-4 rounded-2xl bg-teal-50/50  border border-teal-100  space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900  flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add New Procedure to Catalog
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 ">Procedure Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laser Gingivectomy"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-white  border border-slate-200  text-slate-900  font-medium text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 ">Category</label>
                <select
                  value={newProcCategory}
                  onChange={(e) => setNewProcCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-white  border border-slate-200  text-slate-900  font-medium text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="General">General / Consultation</option>
                  <option value="Restorative">Restorative / Fillings</option>
                  <option value="Endodontics">Endodontics (Root Canal)</option>
                  <option value="Surgery">Oral Surgery / Extraction</option>
                  <option value="Prosthodontics">Prosthodontics (Crowns & Bridges)</option>
                  <option value="Implantology">Dental Implants</option>
                  <option value="Periodontics">Periodontics & Gum Care</option>
                  <option value="Cosmetic">Cosmetic & Whitening</option>
                  <option value="Orthodontics">Orthodontics</option>
                  <option value="Pediatric">Pediatric Dentistry</option>
                  <option value="Preventive">Preventive & Cleaning</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 ">Default Price (EGP) *</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="e.g. 1200"
                    value={newProcPrice}
                    onChange={(e) => setNewProcPrice(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-white  border border-slate-200  text-slate-900  font-bold font-mono text-xs focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog by procedure name or category..."
              value={procedureSearch}
              onChange={(e) => setProcedureSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-medium text-slate-900  focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Catalog Items Table */}
          <div className="border border-slate-200  rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 ">
                <thead className="bg-slate-50  font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200 ">
                  <tr>
                    <th className="p-3.5">Procedure Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Default Price (EGP)</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 ">
                  {catalog
                    .filter((p) => {
                      const q = procedureSearch.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.category && p.category.toLowerCase().includes(q))
                      );
                    })
                    .map((item) => {
                      const isEditing = editingProcId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 :bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 ">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="p-1.5 rounded-lg border border-teal-500 bg-white  text-xs w-full font-bold"
                              />
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="p-3.5">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="p-1.5 rounded-lg border border-teal-500 bg-white  text-xs w-full"
                              />
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100  text-slate-600 ">
                                {item.category || 'General'}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="p-1.5 rounded-lg border border-teal-500 bg-white  text-xs w-28 font-mono font-bold text-emerald-600"
                              />
                            ) : (
                              <span className="font-mono font-bold text-emerald-600  text-sm">
                                {item.defaultPrice.toLocaleString()} EGP
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(item.id)}
                                    className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-xs hover:bg-teal-500"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingProcId(null)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-200  text-slate-700  font-bold text-xs"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(item)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 :bg-teal-950/30 transition-colors"
                                    title="Edit procedure"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProcedure(item.id)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 :bg-rose-950/30 transition-colors"
                                    title="Delete from catalog"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* TAB 1: CLINIC PROFILE & BRANDING                   */}
      {/* ================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white  p-6 rounded-3xl border border-slate-200  shadow-sm space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ">Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white  border border-slate-300  text-slate-900  font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ">Chief Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white  border border-slate-300  text-slate-900  font-bold text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ">Clinic Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white  border border-slate-300  text-slate-900  font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ">Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-white  border border-slate-300  text-slate-900  text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100  flex justify-end">
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
          {/* Quick Login Guide Banner */}
          <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
              ℹ️
            </div>
            <div className="space-y-1 text-xs text-indigo-950">
              <h3 className="font-extrabold text-indigo-900 text-sm">How Reception Assistants Sign In</h3>
              <p className="text-slate-600 leading-relaxed">
                Assistants do not need to register a new account. On the ClinicPro login screen, they simply select <strong>Sign In</strong>, type their registered <strong>Phone Number</strong> (e.g. <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700">0123456789</code>) in the login field, and enter their <strong>Initial Password</strong>.
              </p>
            </div>
          </div>

          {/* Add Assistant Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100  pb-3">
              <UserPlus className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-900  text-base">Add New Reception Assistant</h2>
            </div>

            {assistantSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-600  text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {assistantSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAssistant} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 ">Assistant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sara Ali"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl bg-white  border border-slate-300  text-slate-900  text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 ">Phone Number (Login)</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={assistantPhone}
                  onChange={(e) => setAssistantPhone(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl bg-white  border border-slate-300  text-slate-900  text-sm font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 ">Initial Password</label>
                <input
                  type="text"
                  required
                  placeholder="••••••••"
                  value={assistantPassword}
                  onChange={(e) => setAssistantPassword(e.target.value)}
                  className="w-full mt-1 p-3 rounded-2xl bg-white  border border-slate-300  text-slate-900  text-sm font-mono min-h-[44px]"
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
          <div className="bg-white  p-6 rounded-3xl border border-slate-200  shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900  text-sm">
              Active Clinic Assistants ({assistants.length})
            </h3>

            {assistants.length > 0 ? (
              <div className="divide-y divide-slate-100 ">
                {assistants.map((ast) => (
                  <div key={ast.uid} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900  text-sm flex items-center gap-2">
                        {ast.name}
                        {ast.disabled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700  ">
                            Disabled
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
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
                              ? 'bg-emerald-100 text-emerald-700  '
                              : 'bg-slate-100 text-slate-700  '
                          }`}
                        >
                          {ast.disabled ? 'Enable' : 'Disable'}
                        </button>
                      )}

                      {onDeleteAssistant && (
                        <button
                          onClick={() => onDeleteAssistant(ast.uid)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 :bg-rose-950/40 transition-colors"
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
              <div className="p-8 text-center text-slate-500 text-xs">
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
        <div className="bg-white  p-6 rounded-3xl border border-slate-200  shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-slate-900  text-base">Default WhatsApp Reminder Template</h2>
            <p className="text-xs text-slate-500  mt-0.5">
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
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200  :bg-slate-700 text-slate-700  text-xs font-bold transition-all active:scale-95"
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            rows={7}
            value={whatsappTemplate}
            onChange={(e) => setWhatsappTemplate(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white  border border-slate-300  text-slate-900  font-mono text-sm leading-relaxed outline-none focus:border-emerald-500"
          />

          <div className="p-4 rounded-2xl bg-emerald-50  border border-emerald-200  space-y-2">
            <span className="text-xs font-bold text-emerald-800  flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Live Message Preview:
            </span>
            <div className="text-xs font-mono text-slate-700  whitespace-pre-line bg-white  p-3.5 rounded-xl border border-emerald-100 ">
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
        <div className="bg-white  p-6 rounded-3xl border border-slate-200  shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-slate-900  text-base">One-Click CSV / Excel Export</h2>
            <p className="text-xs text-slate-500  mt-0.5">
              Export your clinical patient records and appointment ledger to standard CSV files compatible with Excel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50  border border-slate-200  space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900  text-sm">Patients Registry</h3>
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

            <div className="p-5 rounded-2xl bg-slate-50  border border-slate-200  space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900  text-sm">Appointments Ledger</h3>
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
        <div className="bg-white  p-6 rounded-3xl border border-slate-200  shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100  text-rose-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900  text-base">
                Terms of Service & Offline Data Protection
              </h2>
              <p className="text-xs text-slate-500 ">
                IndexedDB Local Storage & Clinic Responsibility Notice
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50  border border-rose-200  text-xs text-rose-900  space-y-2 leading-relaxed">
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

          <div className="space-y-3 text-xs text-slate-600  leading-relaxed">
            <h4 className="font-bold text-slate-900 ">Recommended Clinic Procedures:</h4>
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
