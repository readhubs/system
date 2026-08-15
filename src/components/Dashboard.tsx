import React from 'react';
import { Patient, Appointment, Payment } from '../types';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  UserPlus,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Clock,
  Phone,
  Activity
} from 'lucide-react';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  payments: Payment[];
  onNavigate: (tab: string) => void;
  onOpenAddPatient: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  appointments,
  payments,
  onNavigate,
  onOpenAddPatient,
  onSelectPatient
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();

  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  const monthlyCollectedRevenue = payments
    .filter((p) => new Date(p.date).getMonth() === currentMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstandingDebt = patients.reduce((sum, p) => sum + (p.balance > 0 ? p.balance : 0), 0);

  // Unscheduled treatment follow-ups count
  const pendingFollowupsCount = patients.filter((p) => {
    const hasUntreated = Object.values(p.toothStatus || {}).some((s) => s === 'needs-treatment');
    const hasFutureApp = appointments.some((a) => a.patientId === p.id && a.date >= todayStr);
    return hasUntreated && !hasFutureApp;
  }).length;

  return (
    <div className="space-y-6">
      {/* Minimalist Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Clinic Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            You have <span className="font-bold text-slate-900">{todayAppointments.length} appointments</span> today and <span className="font-bold text-amber-700">{pendingFollowupsCount} pending follow-ups</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddPatient}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Patient
          </button>
          <button
            type="button"
            onClick={() => onNavigate('appointments')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            <CalendarCheck className="w-3.5 h-3.5" /> Book Appointment
          </button>
        </div>
      </div>

      {/* KPI Stats Minimalist Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Today's Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Today's Visits</p>
              <p className="text-xl font-black text-slate-900">{todayAppointments.length}</p>
           </div>
           <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
             <Calendar className="w-4 h-4" />
           </div>
        </div>

        {/* Stat 2: Outstanding Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Receivables</p>
              <p className="text-xl font-black text-slate-900">{totalOutstandingDebt.toLocaleString()} <span className="text-xs text-slate-400 font-medium">EGP</span></p>
           </div>
           <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
             <DollarSign className="w-4 h-4" />
           </div>
        </div>

        {/* Stat 3: Monthly Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Monthly Revenue</p>
              <p className="text-xl font-black text-slate-900">{monthlyCollectedRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-medium">EGP</span></p>
           </div>
           <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
             <Activity className="w-4 h-4" />
           </div>
        </div>

        {/* Stat 4: Total Patients */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
           <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Patients</p>
              <p className="text-xl font-black text-slate-900">{patients.length}</p>
           </div>
           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
             <Users className="w-4 h-4" />
           </div>
        </div>
      </div>
    </div>
  );
};
