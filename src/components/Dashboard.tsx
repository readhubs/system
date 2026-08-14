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
  Phone
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-500/30 text-sky-200 text-xs font-bold border border-sky-400/30">
              Clinical Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, Dr. Mohamed 👋
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
            You have <strong className="font-extrabold text-white">{todayAppointments.length} appointments</strong> scheduled for today and <strong className="font-extrabold text-amber-300">{pendingFollowupsCount} patients</strong> needing treatment follow-up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenAddPatient}
            className="flex items-center gap-2 px-4 py-3 bg-white text-sky-900 rounded-2xl font-extrabold text-xs shadow-lg hover:bg-sky-50 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-sky-600" /> Add Patient
          </button>
          <button
            type="button"
            onClick={() => onNavigate('appointments')}
            className="flex items-center gap-2 px-4 py-3 bg-sky-600 text-white border border-sky-400/40 rounded-2xl font-extrabold text-xs shadow-lg hover:bg-sky-500 transition-colors"
          >
            <CalendarCheck className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-sky-100 text-sky-700 rounded-2xl">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 uppercase">
              Today
            </span>
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-slate-900">{todayAppointments.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Appointments</p>
          </div>
        </div>

        {/* Stat 2: Revenue This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
              This Month
            </span>
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-emerald-600">{monthlyCollectedRevenue.toLocaleString()} EGP</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Collected Revenue</p>
          </div>
        </div>

        {/* Stat 3: Outstanding Patient Debt */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
              Receivables
            </span>
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-amber-600">{totalOutstandingDebt.toLocaleString()} EGP</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Uncollected Debt</p>
          </div>
        </div>

        {/* Stat 4: Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase">
              Active Files
            </span>
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-slate-900">{patients.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Registered Patients</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Appointments & Smart Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" /> Today's Scheduled Visits
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
            >
              View Full Schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onSelectPatient(app.patientId)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 hover:border-sky-300 cursor-pointer transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl font-mono text-xs font-extrabold text-center">
                      <Clock className="w-4 h-4 mx-auto mb-0.5 text-sky-600" />
                      {app.time}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{app.patientName}</h4>
                      <p className="text-xs text-slate-500 font-medium">{app.procedure}</p>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                    {app.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-slate-400 text-xs font-semibold">
                No appointments booked for today.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Smart Alerts & Quick Patient List */}
        <div className="space-y-6">
          {/* Smart Follow-up Banner Card */}
          {pendingFollowupsCount > 0 && (
            <div
              onClick={() => onNavigate('smart-scheduler')}
              className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-lg cursor-pointer hover:opacity-95 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </span>
                <span className="text-[10px] font-extrabold bg-white/20 px-2.5 py-0.5 rounded-full uppercase">
                  Action Needed
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-base">Unscheduled Treatments</h3>
                <p className="text-xs text-amber-100 mt-1">
                  {pendingFollowupsCount} patients have untreated teeth without scheduled appointments.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-extrabold text-white underline">
                Open Smart Radar <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Recent Patients */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                Recent Patient Files
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('patients')}
                className="text-xs font-bold text-sky-600"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {patients.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-extrabold text-slate-900">{p.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{p.phone}</p>
                  </div>
                  {p.balance > 0 && (
                    <span className="font-mono font-bold text-amber-600 text-[11px]">
                      {p.balance} EGP
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
