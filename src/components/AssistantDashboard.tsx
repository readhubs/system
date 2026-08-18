import React, { useState } from 'react';
import {
  UserPlus,
  CalendarCheck,
  CreditCard,
  LogOut,
  Sparkles,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  MessageCircle,
  Receipt,
  User,
  Calendar,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Patient, Appointment, Payment, UserProfile, ClinicSettings } from '../types';
import { savePatientToFirestore, saveAppointmentToFirestore, savePaymentToFirestore } from '../lib/firestoreService';
import { generateAppointmentReminderWhatsAppLink } from '../lib/whatsapp';
import { ReceiptModal } from './ReceiptModal';

interface AssistantDashboardProps {
  currentUser: UserProfile;
  clinicSettings: ClinicSettings;
  patients: Patient[];
  appointments: Appointment[];
  onLogout: () => void;
}

export function AssistantDashboard({
  currentUser,
  clinicSettings,
  patients,
  appointments,
  onLogout
}: AssistantDashboardProps) {
  const [activeModal, setActiveModal] = useState<
    'none' | 'add_patient' | 'today_appointments' | 'schedule_appointment' | 'collect_payment' | 'search_patient'
  >('none');

  // Fast Add Patient State
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientPhone, setNewPatientPhone] = useState<string>('');
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female'>('Male');
  const [newPatientAge, setNewPatientAge] = useState<string>('');
  const [newPatientNotes, setNewPatientNotes] = useState<string>('');
  const [savingPatient, setSavingPatient] = useState<boolean>(false);
  const [patientSuccessMessage, setPatientSuccessMessage] = useState<string>('');
  const [patientErrorMessage, setPatientErrorMessage] = useState<string>('');

  // Schedule Appointment State
  const [apptPatientId, setApptPatientId] = useState<string>('');
  const [apptDate, setApptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState<string>('18:00');
  const [apptDoctorName, setApptDoctorName] = useState<string>(clinicSettings.doctorName || 'Doctor');
  const [apptProcedure, setApptProcedure] = useState<string>('Dental Examination');
  const [apptNotes, setApptNotes] = useState<string>('');
  const [savingAppt, setSavingAppt] = useState<boolean>(false);
  const [apptSuccessMsg, setApptSuccessMsg] = useState<string>('');

  // Collect Payment State
  const [paymentPatientId, setPaymentPatientId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'InstaPay' | 'Visa'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [savingPayment, setSavingPayment] = useState<boolean>(false);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  // Search Patient State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Clinic Resolution
  const resolvedClinicId =
    currentUser.clinicId && currentUser.clinicId !== 'system'
      ? currentUser.clinicId
      : 'clinic_cairo_1';

  // Today's appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  // Filtered patients for search
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery))
  );

  const handleFastAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;

    setSavingPatient(true);
    setPatientErrorMessage('');
    const generatedId = `p_${Date.now()}`;
    const cleanPhone = newPatientPhone.trim().replace(/\s+/g, '');

    const newPatient: Patient = {
      id: generatedId,
      name: newPatientName.trim(),
      phone: cleanPhone,
      gender: newPatientGender,
      age: newPatientAge ? parseInt(newPatientAge, 10) : undefined,
      medicalAlerts: [],
      medicalNotes: newPatientNotes.trim(),
      balance: 0,
      hasPendingTreatment: false,
      toothStatus: {},
      clinicId: resolvedClinicId,
      createdAt: new Date().toISOString()
    };

    try {
      await savePatientToFirestore(newPatient);
      setSavingPatient(false);
      setPatientSuccessMessage(`Patient "${newPatientName.trim()}" saved and synced to cloud!`);
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientAge('');
      setNewPatientNotes('');
      setTimeout(() => {
        setPatientSuccessMessage('');
        setActiveModal('none');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving patient from assistant dashboard:', err);
      setSavingPatient(false);
      setPatientErrorMessage(err?.message || 'Failed to save patient. Please check network connection.');
    }
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptPatientId || !apptDate || !apptTime) return;

    const patient = patients.find((p) => p.id === apptPatientId);
    if (!patient) return;

    setSavingAppt(true);
    const newAppt: Appointment = {
      id: `appt_${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      phone: patient.phone,
      doctorId: 'doc_main',
      doctorName: apptDoctorName,
      date: apptDate,
      time: apptTime,
      procedure: apptProcedure,
      notes: apptNotes,
      status: 'scheduled',
      clinicId: resolvedClinicId
    };

    try {
      await saveAppointmentToFirestore(newAppt);
      setSavingAppt(false);
      setApptSuccessMsg(`Appointment booked for ${patient.name}!`);
      setApptNotes('');
      setTimeout(() => {
        setApptSuccessMsg('');
        setActiveModal('none');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      setSavingAppt(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!paymentPatientId || isNaN(amountNum) || amountNum <= 0) return;

    setSavingPayment(true);
    const patient = patients.find((p) => p.id === paymentPatientId);
    const newBalance = (patient?.balance || 0) - amountNum;

    const paymentRecord: Payment = {
      id: `pay_${Date.now()}`,
      patientId: paymentPatientId,
      patientName: patient?.name || 'Patient',
      amount: amountNum,
      date: new Date().toISOString(),
      method: paymentMethod,
      remainingBalanceSnapshot: newBalance,
      clinicId: resolvedClinicId,
      recordedBy: currentUser.name,
      notes: paymentNotes
    };

    try {
      // Save payment to Firestore
      await savePaymentToFirestore(paymentPatientId, paymentRecord, resolvedClinicId);

      // Update patient balance
      if (patient) {
        await savePatientToFirestore({
          ...patient,
          balance: newBalance
        });
      }

      setSavingPayment(false);
      setLastPayment(paymentRecord);
      setShowReceipt(true);
      setActiveModal('none');
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      console.error('Error recording payment:', err);
      setSavingPayment(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appt: Appointment, newStatus: any) => {
    try {
      await saveAppointmentToFirestore({
        ...appt,
        status: newStatus
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-black text-xl shadow-lg shadow-teal-500/10">
            🦷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                {clinicSettings.name || 'Dental Clinic'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Reception Desk • <span className="text-teal-400 font-semibold">{currentUser.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors text-xs font-semibold"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      {/* Main Action Hub */}
      <main className="max-w-4xl w-full mx-auto my-auto py-6 sm:py-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Front Desk Quick Actions
          </h2>
          <p className="text-sm text-slate-400">
            Instant registration, appointment queue management, and receipt collection
          </p>
        </div>

        {/* Primary 3 Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Add Patient */}
          <button
            onClick={() => {
              setPatientSuccessMessage('');
              setPatientErrorMessage('');
              setActiveModal('add_patient');
            }}
            className="group p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 hover:border-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center shadow-xl min-h-[170px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-600/20">
              <UserPlus className="w-7 h-7" />
            </div>
            <span className="text-base sm:text-lg font-black text-white">1. Add Patient</span>
            <span className="text-xs text-slate-400 mt-0.5">تسجيل مريض جديد</span>
          </button>

          {/* Card 2: Today's Appointments */}
          <button
            onClick={() => setActiveModal('today_appointments')}
            className="group relative p-6 rounded-3xl bg-gradient-to-br from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/30 hover:border-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center shadow-xl min-h-[170px]"
          >
            {todayAppointments.length > 0 && (
              <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[11px] font-black shadow-md">
                {todayAppointments.length} Today
              </span>
            )}
            <div className="w-14 h-14 rounded-2xl bg-teal-600/20 text-teal-400 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-lg shadow-teal-600/20">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <span className="text-base sm:text-lg font-black text-white">2. Today's Queue</span>
            <span className="text-xs text-slate-400 mt-0.5">مواعيد وحجوزات اليوم</span>
          </button>

          {/* Card 3: Collect Payment */}
          <button
            onClick={() => setActiveModal('collect_payment')}
            className="group p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center shadow-xl min-h-[170px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg shadow-emerald-600/20">
              <CreditCard className="w-7 h-7" />
            </div>
            <span className="text-base sm:text-lg font-black text-white">3. Collect Payment</span>
            <span className="text-xs text-slate-400 mt-0.5">تحصيل دفعة وطباعة إيصال</span>
          </button>
        </div>

        {/* Secondary Tools: Search Patient & Book Future Appointment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setActiveModal('search_patient')}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">Patient Directory</div>
                <div className="text-xs text-slate-400">Search {patients.length} registered patients</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            onClick={() => {
              setApptSuccessMsg('');
              setActiveModal('schedule_appointment');
            }}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">Book Future Appointment</div>
                <div className="text-xs text-slate-400">Schedule upcoming visit</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-900 pt-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Clinic: {clinicSettings.name || 'Cairo Clinic'}</span>
          <span>•</span>
          <span>Patients in DB: {patients.length}</span>
        </div>
        <div>ClinicPro Dental Platform • Version 2.0</div>
      </footer>

      {/* ================================================= */}
      {/* MODAL 1: FAST ADD PATIENT                         */}
      {/* ================================================= */}
      {activeModal === 'add_patient' && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-lg">Add New Patient</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-500 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {patientSuccessMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{patientSuccessMessage}</span>
              </div>
            )}

            {patientErrorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{patientErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFastAddPatient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200">
                  Patient Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmed Mahmoud"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-base text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200">
                  Phone Number (Egyptian WhatsApp) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-base text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200">Gender</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Male">Male (ذكر)</option>
                    <option value="Female">Female (أنثى)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200">Age (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200">Visit Note / Chief Complaint (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Toothache lower right molar, scaling"
                  value={newPatientNotes}
                  onChange={(e) => setNewPatientNotes(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPatient}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingPatient ? 'Saving & Syncing...' : 'Save Patient (حفظ)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 2: TODAY'S APPOINTMENTS QUEUE               */}
      {/* ================================================= */}
      {activeModal === 'today_appointments' && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-lg">Today's Schedule ({todayAppointments.length})</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-500 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appt) => {
                  const waLink = generateAppointmentReminderWhatsAppLink(
                    appt.patientName,
                    appt.phone,
                    appt.date,
                    appt.time,
                    appt.doctorName || 'Dr.',
                    clinicSettings.name
                  );

                  return (
                    <div
                      key={appt.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{appt.patientName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                            {appt.time}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span className="text-indigo-400 font-medium">{appt.procedure}</span>
                          <span>•</span>
                          <a href={`tel:${appt.phone}`} className="text-slate-300 font-mono hover:underline">
                            {appt.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>

                        {appt.status !== 'completed' ? (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appt, 'completed')}
                            className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Arrived / Done
                          </button>
                        ) : (
                          <span className="px-3 py-2 rounded-xl bg-slate-800 text-emerald-400 text-xs font-bold flex items-center gap-1">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No appointments scheduled for today ({todayStr}).
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveModal('schedule_appointment');
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Book Appointment
              </button>
              <button
                onClick={() => setActiveModal('none')}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL: SCHEDULE APPOINTMENT                       */}
      {/* ================================================= */}
      {activeModal === 'schedule_appointment' && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-lg">Book Appointment</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-500 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {apptSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{apptSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleScheduleAppointment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200">
                  Select Patient <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={apptPatientId}
                  onChange={(e) => setApptPatientId(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200">Date <span className="text-rose-400">*</span></label>
                  <input
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-200">Time <span className="text-rose-400">*</span></label>
                  <input
                    type="time"
                    required
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200">Procedure / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Checkup, Filling, Cleaning"
                  value={apptProcedure}
                  onChange={(e) => setApptProcedure(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAppt}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-lg shadow-teal-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingAppt ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 3: COLLECT PAYMENT                          */}
      {/* ================================================= */}
      {activeModal === 'collect_payment' && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-lg">Collect Payment (تحصيل)</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-500 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200">
                  Select Patient <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={paymentPatientId}
                  onChange={(e) => setPaymentPatientId(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone}) {p.balance > 0 ? `• Balance: ${p.balance} EGP` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200">
                  Amount in EGP (المبلغ بالجنية) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter amount (e.g. 250, 1000)"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200">Payment Method (طريقة الدفع)</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {(['Cash', 'InstaPay', 'Visa'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        paymentMethod === method
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-300 border border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200">Notes / Procedure (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Consultation fee, Session 1 installment"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingPayment ? 'Processing...' : 'Collect & Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 4: SEARCH PATIENT DIRECTORY                 */}
      {/* ================================================= */}
      {activeModal === 'search_patient' && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-lg">Patient Directory ({patients.length})</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-500 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{patient.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{patient.phone}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {patient.balance > 0 && (
                        <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                          Due: {patient.balance} EGP
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setPaymentPatientId(patient.id);
                          setActiveModal('collect_payment');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-bold transition-all"
                      >
                        Collect
                      </button>
                      <button
                        onClick={() => {
                          setApptPatientId(patient.id);
                          setActiveModal('schedule_appointment');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-400 hover:text-white text-xs font-bold transition-all"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No patients matching "{searchQuery}"
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setActiveModal('none')}
                className="px-5 py-2 rounded-2xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastPayment && (
        <ReceiptModal
          payment={lastPayment}
          patientName={patients.find((p) => p.id === lastPayment.patientId)?.name || 'Unknown'}
          patientPhone={patients.find((p) => p.id === lastPayment.patientId)?.phone || ''}
          procedures={[]}
          clinicSettings={clinicSettings}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
