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
  User
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
  const [activeModal, setActiveModal] = useState<'none' | 'add_patient' | 'today_appointments' | 'collect_payment'>('none');

  // Fast Add Patient State
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientPhone, setNewPatientPhone] = useState<string>('');
  const [newPatientNotes, setNewPatientNotes] = useState<string>('');
  const [savingPatient, setSavingPatient] = useState<boolean>(false);
  const [patientSuccessMessage, setPatientSuccessMessage] = useState<string>('');

  // Collect Payment State
  const [paymentPatientId, setPaymentPatientId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'InstaPay' | 'Visa'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  // Search filter for today's appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  const handleFastAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;

    setSavingPatient(true);
    const generatedId = `p_${Date.now()}`;
    const newPatient: Patient = {
      id: generatedId,
      name: newPatientName.trim(),
      phone: newPatientPhone.trim(),
      gender: 'Male',
      medicalAlerts: [],
      medicalNotes: newPatientNotes,
      balance: 0,
      hasPendingTreatment: false,
      toothStatus: {},
      clinicId: currentUser.clinicId,
      createdAt: new Date().toISOString()
    };

    await savePatientToFirestore(newPatient);
    setSavingPatient(false);
    setPatientSuccessMessage(`Patient "${newPatientName}" created successfully!`);
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientNotes('');
    setTimeout(() => {
      setPatientSuccessMessage('');
      setActiveModal('none');
    }, 1200);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!paymentPatientId || isNaN(amountNum) || amountNum <= 0) return;

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
      clinicId: currentUser.clinicId,
      recordedBy: currentUser.name,
      notes: paymentNotes
    };

    // Save payment
    await savePaymentToFirestore(paymentPatientId, paymentRecord, currentUser.clinicId);

    // Update patient balance
    if (patient) {
      await savePatientToFirestore({
        ...patient,
        balance: newBalance
      });
    }

    setLastPayment(paymentRecord);
    setShowReceipt(true);
    setActiveModal('none');
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const handleUpdateAppointmentStatus = async (appt: Appointment, newStatus: any) => {
    await saveAppointmentToFirestore({
      ...appt,
      status: newStatus
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10">
      {/* Top Bar */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-black text-lg">
            🦷
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
              {clinicSettings.name || 'Dental Clinic'}
            </h1>
            <p className="text-xs text-slate-400">
              Reception Assistant Portal • <span className="text-teal-400 font-semibold">{currentUser.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main 3 Large Action Cards (Foolproof Mobile-First) */}
      <main className="max-w-3xl w-full mx-auto my-auto py-8">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Reception Quick Actions</h2>
          <p className="text-sm text-slate-400">Choose one of the 3 primary tasks below</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {/* Card 1: Add New Patient */}
          <button
            onClick={() => setActiveModal('add_patient')}
            className="group p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border-2 border-indigo-500/30 hover:border-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center shadow-xl min-h-[190px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-600/20">
              <UserPlus className="w-8 h-8" />
            </div>
            <span className="text-lg font-black text-white">1. Add Patient</span>
            <span className="text-xs text-slate-400 mt-1">تسجيل مريض جديد</span>
          </button>

          {/* Card 2: Today's Appointments */}
          <button
            onClick={() => setActiveModal('today_appointments')}
            className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-900/40 to-slate-900 border-2 border-teal-500/30 hover:border-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center shadow-xl min-h-[190px]"
          >
            {todayAppointments.length > 0 && (
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-teal-500 text-slate-950 text-xs font-black">
                {todayAppointments.length} Today
              </span>
            )}
            <div className="w-16 h-16 rounded-2xl bg-teal-600/20 text-teal-400 flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-lg shadow-teal-600/20">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <span className="text-lg font-black text-white">2. Appointments</span>
            <span className="text-xs text-slate-400 mt-1">مواعيد وحجوزات اليوم</span>
          </button>

          {/* Card 3: Collect Payment */}
          <button
            onClick={() => setActiveModal('collect_payment')}
            className="group p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900/40 to-slate-900 border-2 border-emerald-500/30 hover:border-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center shadow-xl min-h-[190px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-lg shadow-emerald-600/20">
              <CreditCard className="w-8 h-8" />
            </div>
            <span className="text-lg font-black text-white">3. Collect Payment</span>
            <span className="text-xs text-slate-400 mt-1">تحصيل دفعة وطباعة إيصال</span>
          </button>
        </div>
      </main>

      {/* Footer info */}
      <footer className="max-w-3xl w-full mx-auto text-center text-xs text-slate-500 border-t border-slate-900 pt-4">
        ClinicPro Assistant v2.0 • Offline Ready with IndexedDB
      </footer>

      {/* ================================================= */}
      {/* MODAL 1: FAST ADD PATIENT (Name + Phone Only)      */}
      {/* ================================================= */}
      {activeModal === 'add_patient' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-lg">Add New Patient</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {patientSuccessMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {patientSuccessMessage}
              </div>
            )}

            <form onSubmit={handleFastAddPatient} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Patient Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahmoud Ali"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-base text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Phone Number (Egyptian WhatsApp) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-base text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">General Note / Reason for Visit (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Toothache, Scaling, Referral"
                  value={newPatientNotes}
                  onChange={(e) => setNewPatientNotes(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPatient}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
                >
                  {savingPatient ? 'Saving...' : 'Save Patient (حفظ)'}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-lg">Today's Schedule ({todayAppointments.length})</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-400 hover:text-white text-sm p-1"
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

            <div className="border-t border-slate-800 pt-3 flex justify-end">
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
      {/* MODAL 3: COLLECT PAYMENT                          */}
      {/* ================================================= */}
      {activeModal === 'collect_payment' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-lg">Collect Payment (تحصيل)</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Select Patient <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={paymentPatientId}
                  onChange={(e) => setPaymentPatientId(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
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
                <label className="text-xs font-semibold text-slate-300">
                  Amount in EGP (المبلغ بالجنية) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="Enter any amount (e.g. 250, 1500, etc.)"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Payment Method (طريقة الدفع)</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {(['Cash', 'InstaPay', 'Visa'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 rounded-xl text-xs font-bold transition-all ${
                        paymentMethod === method
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Notes / Procedure (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Session 1 installment"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  Collect & Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastPayment && (
        <ReceiptModal
          payment={lastPayment}
          patient={patients.find((p) => p.id === lastPayment.patientId)!}
          clinicSettings={clinicSettings}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
