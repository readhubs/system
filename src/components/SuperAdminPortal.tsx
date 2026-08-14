import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  User,
  Plus,
  ArrowRight,
  Sparkles,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Clinic, ClinicStatus, SubscriptionPlan } from '../types';
import {
  subscribeAllClinics,
  updateClinicStatusInFirestore,
  updateClinicPlanInFirestore,
  saveClinicToFirestore
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
  
  // Add Clinic Modal
  const [showAddClinicModal, setShowAddClinicModal] = useState<boolean>(false);
  const [newClinicName, setNewClinicName] = useState<string>('');
  const [newDoctorName, setNewDoctorName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>('free_trial');

  useEffect(() => {
    const unsub = subscribeAllClinics((list) => {
      setClinics(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredClinics = clinics.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    await updateClinicStatusInFirestore(clinic.id, newStatus);
  };

  const handleChangePlan = async (clinicId: string, plan: SubscriptionPlan) => {
    let days = 30;
    if (plan === 'pro_annual' || plan === 'vip_unlimited') days = 365;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await updateClinicPlanInFirestore(clinicId, plan, expiresAt);
  };

  const handleExtendSubscription = async (clinicId: string, additionalDays: number = 30) => {
    const clinic = clinics.find((c) => c.id === clinicId);
    const currentExpiry = clinic?.subscriptionExpiresAt ? new Date(clinic.subscriptionExpiresAt).getTime() : Date.now();
    const base = Math.max(Date.now(), currentExpiry);
    const newExpiry = new Date(base + additionalDays * 24 * 60 * 60 * 1000).toISOString();
    await updateClinicPlanInFirestore(clinicId, clinic?.plan || 'basic_monthly', newExpiry);
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newDoctorName) return;

    const generatedId = `clinic_${Date.now().toString(36)}`;
    const newClinic: Clinic = {
      id: generatedId,
      name: newClinicName,
      doctorName: newDoctorName,
      email: newEmail,
      phone: newPhone,
      status: 'active',
      plan: newPlan,
      createdAt: new Date().toISOString(),
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      whatsappTemplate: `مرحباً [PatientName]، نذكركم بموعدكم في [ClinicName] يوم [Date] الساعة [Time]. د. [DoctorName]`
    };

    await saveClinicToFirestore(newClinic);
    setShowAddClinicModal(false);
    setNewClinicName('');
    setNewDoctorName('');
    setNewEmail('');
    setNewPhone('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
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
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Tenant Clinic Control & Manual InstaPay Subscription Manager
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddClinicModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Clinic
            </button>

            <button
              onClick={onExit}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all"
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
            <div className="text-2xl font-black text-white mt-2">{clinics.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Tenant Workspaces</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Subscriptions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2">{activeCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Granted Access</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Suspended Clinics</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-2">{suspendedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Access Blocked</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Paid (InstaPay)</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">{paidCount}</div>
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
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
                {filteredClinics.length > 0 ? (
                  filteredClinics.map((clinic) => {
                    const isExpired = clinic.subscriptionExpiresAt && new Date(clinic.subscriptionExpiresAt).getTime() < Date.now();
                    const daysRemaining = clinic.subscriptionExpiresAt
                      ? Math.ceil((new Date(clinic.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <tr key={clinic.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white text-base">{clinic.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-indigo-400" />
                            {clinic.doctorName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-1">ID: {clinic.id}</div>
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
                          {clinic.email && (
                            <div className="text-xs text-slate-400 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[150px]">{clinic.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() => handleToggleStatus(clinic)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                              clinic.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {clinic.status === 'active' ? (
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
                            onChange={(e) => handleChangePlan(clinic.id, e.target.value as SubscriptionPlan)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                          >
                            <option value="free_trial">Free Trial</option>
                            <option value="basic_monthly">Basic Monthly (EGP 299)</option>
                            <option value="pro_annual">Pro Annual (EGP 2,499)</option>
                            <option value="vip_unlimited">VIP Unlimited (EGP 4,999)</option>
                          </select>
                        </td>

                        <td className="p-4">
                          <div className="text-xs font-mono">
                            {clinic.subscriptionExpiresAt
                              ? new Date(clinic.subscriptionExpiresAt).toLocaleDateString('en-GB')
                              : 'No expiry'}
                          </div>
                          {daysRemaining !== null && (
                            <div
                              className={`text-[10px] font-bold mt-0.5 ${
                                isExpired
                                  ? 'text-rose-400'
                                  : daysRemaining < 7
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {isExpired ? 'EXPIRED' : `${daysRemaining} days left`}
                            </div>
                          )}
                        </td>

                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleExtendSubscription(clinic.id, 30)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium transition-colors"
                            title="Renew +30 Days after InstaPay verification"
                          >
                            +30 Days
                          </button>
                          <button
                            onClick={() => handleExtendSubscription(clinic.id, 365)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium transition-colors"
                            title="Renew +1 Year after InstaPay verification"
                          >
                            +1 Year
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                      {loading ? 'Loading clinics...' : 'No clinics found matching criteria.'}
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create New Tenant Clinic</h2>
            <form onSubmit={handleCreateClinic} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Clinic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cairo Dental Center"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Doctor Name (Owner)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ahmed Hassan"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Doctor Phone (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Doctor Email</label>
                <input
                  type="email"
                  placeholder="doctor@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Subscription Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as SubscriptionPlan)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="free_trial">Free Trial (30 Days)</option>
                  <option value="basic_monthly">Basic Monthly</option>
                  <option value="pro_annual">Pro Annual</option>
                  <option value="vip_unlimited">VIP Unlimited</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddClinicModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500"
                >
                  Create Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
