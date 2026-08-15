import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  CreditCard,
  Phone,
  Mail,
  User,
  Plus,
  ArrowRight,
  Sparkles,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  Calendar,
  Check
} from 'lucide-react';
import { Clinic, ClinicStatus, SubscriptionPlan } from '../types';
import {
  subscribeAllClinics,
  updateClinicStatusInFirestore,
  updateClinicPlanInFirestore,
  saveClinicToFirestore,
  deleteClinicFromFirestore
} from '../lib/firestoreService';

interface SuperAdminPortalProps {
  onExit: () => void;
}

export function SuperAdminPortal({ onExit }: SuperAdminPortalProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | ClinicStatus>('all');
  const [planFilter, setPlanFilter] = useState<'all' | SubscriptionPlan>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Add Clinic Modal
  const [showAddClinicModal, setShowAddClinicModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newClinicName, setNewClinicName] = useState<string>('');
  const [newDoctorName, setNewDoctorName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>('free_trial');

  // Delete / Archive Modal
  const [clinicToDelete, setClinicToDelete] = useState<Clinic | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time Firestore Subscription with Timeout Safety
  useEffect(() => {
    setLoading(true);
    setErrorMessage(null);

    // Timeout safety fallback (4.5s max) to guarantee the screen never hangs in spinner
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4500);

    const unsub = subscribeAllClinics(
      (list) => {
        setClinics(list);
        setLoading(false);
        setErrorMessage(null);
        clearTimeout(timer);
      },
      (err) => {
        console.warn('SuperAdminPortal subscription error:', err);
        setLoading(false);
        setErrorMessage('Unable to sync live tenant list from Firestore. Please verify Super Admin permissions.');
        clearTimeout(timer);
      }
    );

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
  };

  const filteredClinics = clinics.filter((c) => {
    const emailStr = c.ownerEmail || c.email || '';
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      emailStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPlan = planFilter === 'all' || c.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const activeCount = clinics.filter((c) => c.status === 'active').length;
  const suspendedCount = clinics.filter((c) => c.status === 'suspended').length;
  const paidCount = clinics.filter((c) => c.plan !== 'free_trial').length;

  const handleToggleStatus = async (clinic: Clinic) => {
    const newStatus: ClinicStatus = clinic.status === 'active' ? 'suspended' : 'active';
    setActionLoadingId(`status_${clinic.id}`);
    try {
      await updateClinicStatusInFirestore(clinic.id, newStatus);
      showToast(`Clinic "${clinic.name}" status updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Failed to update clinic status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangePlan = async (clinicId: string, plan: SubscriptionPlan) => {
    setActionLoadingId(`plan_${clinicId}`);
    try {
      let days = 30;
      if (plan === 'pro_annual' || plan === 'vip_unlimited') days = 365;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await updateClinicPlanInFirestore(clinicId, plan, expiresAt);
      showToast(`Subscription plan updated to ${plan.replace('_', ' ').toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Failed to update subscription plan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExtendSubscription = async (clinicId: string, additionalDays: number = 30) => {
    setActionLoadingId(`extend_${clinicId}_${additionalDays}`);
    try {
      const clinic = clinics.find((c) => c.id === clinicId);
      const rawExpiry = clinic?.subscriptionExpiresAt || clinic?.subscriptionEndDate;
      const currentExpiry = rawExpiry ? new Date(rawExpiry).getTime() : Date.now();
      const base = Math.max(Date.now(), currentExpiry);
      const newExpiry = new Date(base + additionalDays * 24 * 60 * 60 * 1000).toISOString();
      await updateClinicPlanInFirestore(clinicId, clinic?.plan || 'basic_monthly', newExpiry);
      showToast(`Extended ${clinic?.name || 'Clinic'} by +${additionalDays} days successfully!`, 'success');
    } catch (err) {
      showToast('Failed to extend subscription', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteClinic = async () => {
    if (!clinicToDelete) return;
    setActionLoadingId(`delete_${clinicToDelete.id}`);
    try {
      await deleteClinicFromFirestore(clinicToDelete.id);
      showToast(`Clinic "${clinicToDelete.name}" removed successfully`, 'info');
      setClinicToDelete(null);
    } catch (err) {
      showToast('Failed to remove clinic record', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newDoctorName) return;

    setIsSubmitting(true);
    try {
      const generatedId = `clinic_${Date.now().toString(36)}`;
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const newClinic: Clinic = {
        id: generatedId,
        name: newClinicName,
        doctorName: newDoctorName,
        email: newEmail,
        ownerEmail: newEmail,
        phone: newPhone,
        status: 'active',
        plan: newPlan,
        createdAt: new Date().toISOString(),
        subscriptionExpiresAt: expiryDate,
        subscriptionEndDate: expiryDate,
        whatsappTemplate: `مرحباً [PatientName]، نذكركم بموعدكم في [ClinicName] يوم [Date] الساعة [Time]. د. [DoctorName]`
      };

      await saveClinicToFirestore(newClinic);
      showToast(`New tenant clinic "${newClinicName}" provisioned!`, 'success');
      setShowAddClinicModal(false);
      setNewClinicName('');
      setNewDoctorName('');
      setNewEmail('');
      setNewPhone('');
      setNewPlan('free_trial');
    } catch (err) {
      showToast('Error creating new clinic in Firestore', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-500/40 shadow-rose-950/50'
                : 'bg-indigo-950 text-indigo-200 border-indigo-500/40 shadow-indigo-950/50'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Frame */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">System Admin Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  SUPER ADMIN
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Firestore Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Tenant Clinic Control & Manual InstaPay Subscription Manager
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddClinicModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Clinic
            </button>

            <button
              onClick={onExit}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              Exit to Clinic
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Clinics</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {loading ? <Loader2 className="w-6 h-6 text-slate-500 animate-spin" /> : clinics.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Tenant Workspaces</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Subscriptions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">
              {loading ? <Loader2 className="w-6 h-6 text-slate-500 animate-spin" /> : activeCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Granted Access</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Suspended Clinics</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-2">
              {loading ? <Loader2 className="w-6 h-6 text-slate-500 animate-spin" /> : suspendedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Access Blocked</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Paid (InstaPay)</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {loading ? <Loader2 className="w-6 h-6 text-slate-500 animate-spin" /> : paidCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Premium Accounts</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clinic name, doctor, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Plans</option>
              <option value="free_trial">Free Trial</option>
              <option value="basic_monthly">Basic Monthly</option>
              <option value="pro_annual">Pro Annual</option>
              <option value="vip_unlimited">VIP Unlimited</option>
            </select>
          </div>
        </div>

        {/* Clinics Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Clinic & Doctor</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status & Access</th>
                  <th className="p-4">Plan (InstaPay)</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        <span className="text-sm font-medium">Connecting to Firestore database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClinics.length > 0 ? (
                  filteredClinics.map((clinic) => {
                    const expiryDateStr = clinic.subscriptionExpiresAt || clinic.subscriptionEndDate;
                    const isExpired = expiryDateStr && new Date(expiryDateStr).getTime() < Date.now();
                    const daysRemaining = expiryDateStr
                      ? Math.ceil((new Date(expiryDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const contactEmail = clinic.ownerEmail || clinic.email;

                    return (
                      <tr key={clinic.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-base">{clinic.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-indigo-400" />
                            {clinic.doctorName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              ID: {clinic.id}
                            </span>
                            {clinic.createdAt && (
                              <span className="text-[10px] text-slate-500">
                                Created: {new Date(clinic.createdAt).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 space-y-1">
                          {clinic.phone && (
                            <div className="text-xs text-slate-300 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <a
                                href={`https://wa.me/20${clinic.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline text-emerald-400 font-mono"
                              >
                                {clinic.phone}
                              </a>
                            </div>
                          )}
                          {contactEmail && (
                            <div className="text-xs text-slate-400 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[170px]" title={contactEmail}>
                                {contactEmail}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => handleToggleStatus(clinic)}
                            disabled={actionLoadingId === `status_${clinic.id}`}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                              clinic.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {actionLoadingId === `status_${clinic.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : clinic.status === 'active' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active (Open)
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Suspended
                              </>
                            )}
                          </button>
                        </td>

                        <td className="p-4">
                          <select
                            value={clinic.plan}
                            disabled={actionLoadingId === `plan_${clinic.id}`}
                            onChange={(e) => handleChangePlan(clinic.id, e.target.value as SubscriptionPlan)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                          >
                            <option value="free_trial">Free Trial</option>
                            <option value="basic_monthly">Basic Monthly (EGP 299)</option>
                            <option value="pro_annual">Pro Annual (EGP 2,499)</option>
                            <option value="vip_unlimited">VIP Unlimited (EGP 4,999)</option>
                          </select>
                        </td>

                        <td className="p-4">
                          <div className="text-xs font-mono flex items-center gap-1 text-slate-200">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {expiryDateStr
                              ? new Date(expiryDateStr).toLocaleDateString('en-GB')
                              : 'No expiry'}
                          </div>
                          {daysRemaining !== null && (
                            <div
                              className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                                isExpired
                                  ? 'text-rose-400'
                                  : daysRemaining < 7
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              {isExpired ? 'EXPIRED' : `${daysRemaining} days left`}
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleExtendSubscription(clinic.id, 30)}
                              disabled={actionLoadingId?.startsWith(`extend_${clinic.id}`)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition-colors flex items-center gap-1 active:scale-95"
                              title="Renew +30 Days after InstaPay verification"
                            >
                              {actionLoadingId === `extend_${clinic.id}_30` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                '+30 Days'
                              )}
                            </button>
                            <button
                              onClick={() => handleExtendSubscription(clinic.id, 365)}
                              disabled={actionLoadingId?.startsWith(`extend_${clinic.id}`)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1 active:scale-95"
                              title="Renew +1 Year after InstaPay verification"
                            >
                              {actionLoadingId === `extend_${clinic.id}_365` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                '+1 Year'
                              )}
                            </button>
                            <button
                              onClick={() => setClinicToDelete(clinic)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete/Archive Tenant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 text-sm">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Building2 className="w-10 h-10 text-slate-700" />
                        <div>
                          <p className="text-base font-bold text-slate-400">No clinics registered in database</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {searchQuery
                              ? 'No results matched your search query.'
                              : 'Click "+ Add Clinic" above to provision your first tenant workspace.'}
                          </p>
                        </div>
                        {!searchQuery && (
                          <button
                            onClick={() => setShowAddClinicModal(true)}
                            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create First Clinic
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Clinic Modal */}
      {showAddClinicModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Create New Tenant Clinic</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddClinicModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClinic} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Clinic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cairo Dental Center"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Doctor Name (Owner) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ahmed Hassan"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Doctor Phone (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Doctor Email</label>
                <input
                  type="email"
                  placeholder="doctor@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Subscription Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as SubscriptionPlan)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="free_trial">Free Trial (30 Days)</option>
                  <option value="basic_monthly">Basic Monthly (EGP 299)</option>
                  <option value="pro_annual">Pro Annual (EGP 2,499)</option>
                  <option value="vip_unlimited">VIP Unlimited (EGP 4,999)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddClinicModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    'Create Clinic'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {clinicToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete Tenant Clinic?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <span className="font-bold text-slate-200">"{clinicToDelete.name}"</span>?
                This removes the clinic document from Firestore.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClinicToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === `delete_${clinicToDelete.id}`}
                onClick={handleDeleteClinic}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {actionLoadingId === `delete_${clinicToDelete.id}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
