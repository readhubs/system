import React from 'react';
import { Patient, Appointment } from '../types';
import { generateFollowUpWhatsAppLink } from '../lib/whatsapp';
import { Sparkles, MessageSquare, AlertCircle, Phone, CalendarCheck, CheckCircle2 } from 'lucide-react';

interface SmartSchedulerProps {
  patients: Patient[];
  appointments: Appointment[];
  onBookForPatient: (patientId: string) => void;
}

export const SmartScheduler: React.FC<SmartSchedulerProps> = ({
  patients,
  appointments,
  onBookForPatient
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Patients who have pending treatment ('needs-treatment') BUT no upcoming appointment scheduled
  const patientsNeedingFollowUp = patients.filter((patient) => {
    // Check if patient has any tooth needing treatment
    const hasUntreatedTooth = Object.values(patient.toothStatus || {}).some(
      (status) => status === 'needs-treatment'
    );

    if (!hasUntreatedTooth) return false;

    // Check if patient has future appointment >= today
    const hasFutureAppointment = appointments.some(
      (app) => app.patientId === patient.id && app.date >= todayStr && app.status !== 'cancelled'
    );

    return !hasFutureAppointment;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-500/30 rounded-xl backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-sky-300" />
            </span>
            <h2 className="text-xl font-black">Smart Treatment Follow-Up Radar</h2>
          </div>
          <p className="text-xs text-sky-200">
            Automatically flags patients with active treatment plans ("Needs Treatment") who have no upcoming appointment scheduled.
          </p>
        </div>

        <div className="px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-center shrink-0">
          <p className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Unscheduled Follow-ups</p>
          <p className="text-2xl font-black font-mono text-amber-300">{patientsNeedingFollowUp.length} Patients</p>
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-3">
        {patientsNeedingFollowUp.length > 0 ? (
          patientsNeedingFollowUp.map((patient) => {
            const untreatedTeeth = Object.entries(patient.toothStatus || {})
              .filter(([_, status]) => status === 'needs-treatment')
              .map(([toothNum]) => `#${toothNum}`)
              .join(', ');

            const waUrl = generateFollowUpWhatsAppLink(
              patient.name,
              patient.phone,
              `Teeth ${untreatedTeeth}`
            );

            return (
              <div
                key={patient.id}
                className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{patient.name}</h3>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Unscheduled Treatment
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700">
                    Needs Treatment on Teeth: <span className="font-mono font-bold text-amber-700">{untreatedTeeth}</span>
                  </p>

                  <p className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-sky-600" /> {patient.phone}
                  </p>
                </div>

                {/* Quick Follow-Up Actions */}
                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-0 border-slate-100">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold text-xs hover:bg-emerald-700 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> 1-Tap WhatsApp Follow-up
                  </a>

                  <button
                    type="button"
                    onClick={() => onBookForPatient(patient.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-xs transition-colors"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" /> Schedule Visit
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="font-bold text-slate-800">All Patient Treatment Plans Are Scheduled!</p>
            <p className="text-xs text-slate-400">There are no patients with unscheduled treatments at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};
