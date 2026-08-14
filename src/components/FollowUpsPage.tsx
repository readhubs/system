import React, { useState } from 'react';
import {
  MessageSquare,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Send,
  Sparkles,
  Search,
  Filter,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Appointment, ClinicSettings, Patient } from '../types';
import { markAppointmentReminderSent } from '../lib/firestoreService';
import { formatEgyptPhone } from '../lib/whatsapp';

interface FollowUpsPageProps {
  appointments: Appointment[];
  patients: Patient[];
  clinicSettings: ClinicSettings;
  onSelectPatient?: (patientId: string) => void;
}

export function FollowUpsPage({
  appointments,
  patients,
  clinicSettings,
  onSelectPatient
}: FollowUpsPageProps) {
  const [activeFilter, setActiveFilter] = useState<'tomorrow' | 'today' | 'upcoming'>('tomorrow');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper date strings
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Filter appointments
  const filteredAppointments = appointments.filter((appt) => {
    if (activeFilter === 'tomorrow') {
      if (appt.date !== tomorrowStr) return false;
    } else if (activeFilter === 'today') {
      if (appt.date !== todayStr) return false;
    } else if (activeFilter === 'upcoming') {
      if (appt.date < todayStr) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        appt.patientName.toLowerCase().includes(q) ||
        appt.phone.includes(q) ||
        appt.procedure.toLowerCase().includes(q)
      );
    }

    return true;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  // Default Egyptian WhatsApp message builder
  const buildReminderMessage = (appt: Appointment) => {
    const template =
      clinicSettings.whatsappTemplate ||
      `مرحباً [PatientName] 👋\nنود تذكيركم بموعدكم القادم في [ClinicName]:\n📅 التاريخ: [Date]\n⏰ الساعة: [Time]\n👨‍⚕️ الطبيب المعالج: [DoctorName]\n🦷 الإجراء: [Procedure]\n\nيرجى الرد لتأكيد الحضور. شكراً لكم!`;

    return template
      .replace(/\[PatientName\]|\[Name\]/g, appt.patientName)
      .replace(/\[Date\]/g, appt.date)
      .replace(/\[Time\]/g, appt.time)
      .replace(/\[DoctorName\]/g, appt.doctorName || clinicSettings.doctorName || 'Dr. Mohamed')
      .replace(/\[ClinicName\]/g, clinicSettings.name || 'ClinicPro Dental')
      .replace(/\[Procedure\]/g, appt.procedure || 'كشف ومتابعة');
  };

  const handleSendWhatsApp = async (appt: Appointment) => {
    const cleanPhone = formatEgyptPhone(appt.phone);
    const message = buildReminderMessage(appt);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Mark as sent in Firestore
    await markAppointmentReminderSent(appt.id);

    // Open WhatsApp
    window.open(url, '_blank');
  };

  const handleCopyMessage = (appt: Appointment) => {
    const message = buildReminderMessage(appt);
    navigator.clipboard.writeText(message);
    setCopiedId(appt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              WhatsApp Follow-ups & Reminders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
              Zero-Cost Automation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Send 1-tap automated WhatsApp reminder messages for tomorrow's scheduled patients.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveFilter('tomorrow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'tomorrow'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tomorrow ({appointments.filter((a) => a.date === tomorrowStr).length})
          </button>

          <button
            onClick={() => setActiveFilter('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'today'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today ({appointments.filter((a) => a.date === todayStr).length})
          </button>

          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Upcoming
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter by patient name, mobile number, or procedure..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
        />
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-3">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appt) => {
            const previewMsg = buildReminderMessage(appt);

            return (
              <div
                key={appt.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {appt.patientName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      {appt.date}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-500" />
                      {appt.time}
                    </span>

                    {appt.reminderSent && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 border border-emerald-300 dark:border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Reminder Sent
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      🦷 {appt.procedure}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      📱 {appt.phone}
                    </span>
                    {appt.doctorName && (
                      <>
                        <span>•</span>
                        <span>👨‍⚕️ {appt.doctorName}</span>
                      </>
                    )}
                  </div>

                  {/* Message Preview Accordion / Snippet */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-2">
                    {previewMsg}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyMessage(appt)}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all"
                    title="Copy message text"
                  >
                    {copiedId === appt.id ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(appt)}
                    className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all min-h-[48px]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send WhatsApp (واتساب)
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200">No Appointments Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no appointments scheduled matching the active filter ({activeFilter}).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
