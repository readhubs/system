import React, { useState } from 'react';
import { Appointment, Patient, Doctor, ClinicSettings, Payment } from '../types';
import { PaymentFormModal } from './PaymentFormModal';
import {
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  Filter,
  Users,
  DollarSign,
  CalendarCheck,
  Plus
} from 'lucide-react';
// The modal was actually part of AppointmentsPage or we used to have it inline. Let's just remove the button from TodayClinicPage for now since it's meant to be a simple view, or we can use the prop. Wait, we have onAddAppointment prop, let's just trigger a simple alert or use a basic form if the modal component was removed. Actually, there is no AddAppointmentModal component in the project. The Dashboard had an "onNavigate('appointments')" button to book. I will remove the AddModal from TodayClinicPage to fix the build.

interface TodayClinicPageProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  clinicSettings: ClinicSettings;
  onSelectPatient: (patient: Patient) => void;
  onUpdateStatus: (id: string, newStatus: Appointment['status']) => void;
  onAddAppointment: (app: Omit<Appointment, 'id'>) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeleteAppointment: (id: string) => void;
}

export const TodayClinicPage: React.FC<TodayClinicPageProps> = ({
  appointments,
  patients,
  doctors,
  clinicSettings,
  onSelectPatient,
  onUpdateStatus,
  onAddAppointment,
  onAddPayment,
  onDeleteAppointment
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState<Patient | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments
    .filter((a) => a.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleOpenPayment = (patientId: string) => {
    const p = patients.find((p) => p.id === patientId);
    if (p) {
      setSelectedPatientForPayment(p);
      setShowPaymentModal(true);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px] uppercase tracking-wider">Scheduled</span>;
      case 'in-chair':
        return <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[10px] uppercase tracking-wider animate-pulse">In Chair</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider">Done</span>;
      case 'cancelled':
      default:
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] uppercase tracking-wider">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Today's Queue</h2>
      </div>

      {/* Queue List */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        {todayAppointments.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {todayAppointments.map((app) => {
              const patient = patients.find((p) => p.id === app.patientId);
              return (
                <div key={app.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center gap-4">
                  
                  {/* Time */}
                  <div className="w-16 shrink-0 text-center">
                    <p className="font-mono text-sm font-black text-slate-900">{app.time}</p>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 cursor-pointer" onClick={() => patient && onSelectPatient(patient)}>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-900 text-sm">{app.patientName}</p>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{app.procedure}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) => onUpdateStatus(app.id, e.target.value as Appointment['status'])}
                      className="text-xs font-bold border-0 bg-transparent text-slate-600 hover:text-slate-900 cursor-pointer outline-none"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Waiting">Waiting Room</option>
                      <option value="In-Chair">In-Chair</option>
                      <option value="Completed">Completed</option>
                      <option value="No-Show">No-Show</option>
                      <option value="Canceled">Canceled</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleOpenPayment(app.patientId)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Collect Payment"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => patient && onSelectPatient(patient)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="Open Profile"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No appointments scheduled for today.</p>
            <p className="text-xs mt-1">Enjoy the break or book a walk-in!</p>
          </div>
        )}
      </div>

      {showPaymentModal && selectedPatientForPayment && (
        <PaymentFormModal
          patientId={selectedPatientForPayment.id}
          patientName={selectedPatientForPayment.name}
          currentBalance={selectedPatientForPayment.balance}
          onSubmit={(p) => {
             onAddPayment(p);
             setShowPaymentModal(false);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};
