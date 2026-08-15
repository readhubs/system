import React, { useState } from 'react';
import { Appointment, Patient, Doctor, ClinicSettings, Payment } from '../types';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  DollarSign,
  MessageCircle,
  Play,
  UserCheck,
  XCircle,
  ChevronRight,
  Plus,
  Sparkles,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { PaymentFormModal } from './PaymentFormModal';
import { markAppointmentReminderSent } from '../lib/firestoreService';

interface TodayClinicPageProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  clinicSettings: ClinicSettings;
  onSelectPatient: (patient: Patient) => void;
  onUpdateAppointment?: (appt: Appointment) => void;
  onUpdateStatus?: (id: string, newStatus: Appointment['status']) => void;
  onDeleteAppointment?: (id: string) => void;
  onAddAppointmentModalOpen?: () => void;
  onAddAppointment?: (appointment: Omit<Appointment, 'id'>) => void;
  onAddPayment?: (payment: Omit<Payment, 'id'>) => void;
}

export const TodayClinicPage: React.FC<TodayClinicPageProps> = ({
  appointments,
  patients,
  doctors,
  clinicSettings,
  onSelectPatient,
  onUpdateAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  onAddAppointmentModalOpen,
  onAddAppointment,
  onAddPayment
}) => {
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<Patient | null>(null);
  const [showQuickAddAppt, setShowQuickAddAppt] = useState<boolean>(false);
  const [quickPatientId, setQuickPatientId] = useState<string>(patients[0]?.id || '');
  const [quickDoctorId, setQuickDoctorId] = useState<string>(doctors[0]?.id || '');
  const [quickTime, setQuickTime] = useState<string>('12:00');
  const [quickProcedure, setQuickProcedure] = useState<string>('Consultation & Examination');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in-chair' | 'completed'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter today's appointments
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  const filteredAppointments = todayAppointments.filter((a) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'scheduled') return a.status === 'scheduled' || a.status === 'confirmed';
    if (statusFilter === 'in-chair') return a.status === 'in-chair';
    if (statusFilter === 'completed') return a.status === 'completed';
    return true;
  }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Metrics
  const totalCount = todayAppointments.length;
  const completedCount = todayAppointments.filter((a) => a.status === 'completed').length;
  const inChairCount = todayAppointments.filter((a) => a.status === 'in-chair').length;
  const pendingCount = todayAppointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length;

  const handleStatusChange = (appt: Appointment, newStatus: Appointment['status']) => {
    if (onUpdateStatus) {
      onUpdateStatus(appt.id, newStatus);
    } else if (onUpdateAppointment) {
      onUpdateAppointment({
        ...appt,
        status: newStatus
      });
    }
  };

  const handleOpenAdd = () => {
    if (onAddAppointmentModalOpen) {
      onAddAppointmentModalOpen();
    } else {
      setShowQuickAddAppt(true);
    }
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === quickPatientId) || patients[0];
    const doc = doctors.find((d) => d.id === quickDoctorId) || doctors[0];
    if (!pat) return;

    const newAppt: Omit<Appointment, 'id'> = {
      patientId: pat.id,
      patientName: pat.name,
      phone: pat.phone,
      doctorId: doc?.id || 'doc_1',
      doctorName: doc?.name || clinicSettings.doctorName || 'Treating Doctor',
      date: todayStr,
      time: quickTime,
      procedure: quickProcedure,
      status: 'scheduled',
      clinicId: pat.clinicId || clinicSettings.clinicId || 'clinic_1'
    };

    if (onAddAppointment) {
      onAddAppointment(newAppt);
    }
    setShowQuickAddAppt(false);
  };

  const handleSendWhatsApp = (appt: Appointment) => {
    if (!appt.phone) return;
    const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone.replace(/^0/, '')}`;
    const defaultTemplate =
      clinicSettings?.whatsappTemplate ||
      'Hello {patient_name}, this is a friendly reminder for your dental appointment at {clinic_name} today at {time}.';

    const msg = defaultTemplate
      .replace('{patient_name}', appt.patientName)
      .replace('{clinic_name}', clinicSettings?.name || 'ClinicPro Egypt')
      .replace('{date}', 'Today')
      .replace('{time}', appt.time || 'scheduled time')
      .replace('{doctor_name}', appt.doctorName || 'your treating doctor');

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    markAppointmentReminderSent(appt.id);
  };

  const handleStartSession = (patientId: string) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (p) {
      onSelectPatient(p);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-sky-200 border border-white/15">
            <Calendar className="w-3.5 h-3.5 text-sky-300" />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Today's Clinic Workflow</h1>
          <p className="text-sky-100 text-xs sm:text-sm font-medium max-w-xl">
            Live patient chair queue, instant clinical charting session trigger, and 1-tap WhatsApp communication.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="py-3 px-5 bg-white text-sky-900 hover:bg-sky-50 active:scale-[0.99] transition-all rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            Schedule Patient for Today
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Total Today</span>
            <span className="text-2xl font-black text-slate-800">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">In Dental Chair</span>
            <span className="text-2xl font-black text-amber-600">{inChairCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Upcoming / Waiting</span>
            <span className="text-2xl font-black text-blue-600">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Completed</span>
            <span className="text-2xl font-black text-emerald-600">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Queue & Patient List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Filter Queue:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({todayAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in-chair')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  statusFilter === 'in-chair'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                In Chair ({inChairCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('scheduled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  statusFilter === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Scheduled ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Finished ({completedCount})
              </button>
            </div>
          </div>
        </div>

        {/* List of Appointment Cards */}
        <div className="divide-y divide-slate-100">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appt) => {
              const matchedPatient = patients.find((p) => p.id === appt.patientId);

              return (
                <div
                  key={appt.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Time + Patient Details */}
                  <div className="flex items-start gap-4">
                    {/* Time Badge */}
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col items-center justify-center shrink-0 text-sky-900 shadow-sm">
                      <Clock className="w-4 h-4 text-sky-600 mb-0.5" />
                      <span className="text-xs font-black">{appt.time || '12:00'}</span>
                    </div>

                    {/* Patient & Procedure Info */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartSession(appt.patientId)}
                          className="text-base font-black text-slate-900 hover:text-sky-600 text-left transition-colors flex items-center gap-1.5"
                        >
                          {appt.patientName}
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            appt.status === 'in-chair'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              : appt.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : appt.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {appt.status.toUpperCase()}
                        </span>

                        {matchedPatient?.balance && matchedPatient.balance > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                            Due: {matchedPatient.balance.toLocaleString()} EGP
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                        <span className="text-sky-700 font-bold">{appt.procedure}</span>
                        <span>•</span>
                        <span className="text-slate-500">{appt.doctorName || 'Dr. Mohamed Al-Sayed'}</span>
                      </p>

                      {/* Medical alerts if any */}
                      {matchedPatient?.medicalAlerts && matchedPatient.medicalAlerts.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {matchedPatient.medicalAlerts.map((alert, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                              {alert}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    {/* Status Toggle buttons */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(appt, 'in-chair')}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                          appt.status === 'in-chair'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        In Chair
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(appt, 'completed')}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                          appt.status === 'completed'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Complete
                      </button>
                    </div>

                    {/* WhatsApp */}
                    {appt.phone && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(appt)}
                        className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}

                    {/* Collect Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        const pat = patients.find((p) => p.id === appt.patientId);
                        if (pat) setSelectedPatientForPayment(pat);
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Collect Fee
                    </button>

                    {/* Start Session */}
                    <button
                      type="button"
                      onClick={() => handleStartSession(appt.patientId)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Start Session
                    </button>

                    {/* Delete Appointment */}
                    {onDeleteAppointment && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete today's appointment for ${appt.patientName} at ${appt.time}?`)) {
                            onDeleteAppointment(appt.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete Appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Calendar className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No scheduled appointments found for today.</p>
              <p className="text-xs text-slate-400">Click "Schedule Patient for Today" to add appointments to the live queue.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Payment Modal */}
      {selectedPatientForPayment && (
        <PaymentFormModal
          patient={selectedPatientForPayment}
          clinicSettings={clinicSettings}
          onClose={() => setSelectedPatientForPayment(null)}
          onSubmit={(payData) => {
            if (onAddPayment) {
              onAddPayment(payData);
            }
            setSelectedPatientForPayment(null);
          }}
        />
      )}

      {/* Quick Schedule Appointment for Today Modal */}
      {showQuickAddAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-600" />
                Schedule Patient for Today
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddAppt(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Select Patient</label>
                <select
                  value={quickPatientId}
                  onChange={(e) => setQuickPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Select Doctor</label>
                <select
                  value={quickDoctorId}
                  onChange={(e) => setQuickDoctorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Time</label>
                  <input
                    type="time"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Procedure</label>
                  <input
                    type="text"
                    value={quickProcedure}
                    onChange={(e) => setQuickProcedure(e.target.value)}
                    placeholder="e.g. Scaling, Filling"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddAppt(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-extrabold hover:bg-sky-700 shadow-md"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
