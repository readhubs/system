import React, { useState } from 'react';
import { Appointment, Doctor, Patient } from '../types';
import { generateAppointmentReminderWhatsAppLink } from '../lib/whatsapp';
import { Calendar, Clock, MessageSquare, Plus, CheckCircle2, Phone, User, Filter, AlertCircle, Trash2 } from 'lucide-react';

interface AppointmentsPageProps {
  appointments: Appointment[];
  patients: Patient[];
  doctors: Doctor[];
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  appointments,
  patients,
  doctors,
  onAddAppointment,
  onUpdateStatus,
  onDeleteAppointment
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Appointment State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  const [appTime, setAppTime] = useState<string>('15:00');
  const [procedure, setProcedure] = useState<string>('Consultation & Examination');
  const [conflictError, setConflictError] = useState<string | null>(null);

  const filteredAppointments = appointments.filter((app) => {
    const dateMatch = app.date === selectedDate;
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    return dateMatch && statusMatch;
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const patient = patients.find((p) => p.id === selectedPatientId);
    const doctor = doctors.find((d) => d.id === selectedDoctorId);

    if (!patient) return;

    // Check for existing appointment overlap for the same doctor at the same date & time
    const existingConflict = appointments.find(
      (app) =>
        app.doctorId === selectedDoctorId &&
        app.date === selectedDate &&
        app.time === appTime &&
        app.status !== 'cancelled'
    );

    if (existingConflict) {
      setConflictError(
        `Scheduling Conflict: ${existingConflict.doctorName || doctor?.name || 'Doctor'} already has an active appointment with ${existingConflict.patientName} at ${appTime} on ${selectedDate}. Please select another time or doctor.`
      );
      return;
    }

    onAddAppointment({
      patientId: patient.id,
      patientName: patient.name,
      phone: patient.phone,
      doctorId: selectedDoctorId,
      doctorName: doctor?.name || 'Dr. Mohamed Al-Sayed',
      date: selectedDate,
      time: appTime,
      procedure,
      status: 'scheduled',
      clinicId: patient.clinicId || 'clinic_cairo_1'
    });

    setShowAddModal(false);
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'completed':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header & Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-600" /> Clinic Schedule & Appointments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage daily appointments and trigger zero-cost WhatsApp reminders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white text-slate-800 shadow-2xs outline-none focus:border-sky-500"
          />

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {['all', 'scheduled', 'confirmed', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl border capitalize transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Daily Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((app) => {
            const waUrl = generateAppointmentReminderWhatsAppLink(
              app.patientName,
              app.phone,
              app.date,
              app.time,
              app.doctorName || 'Dr. Mohamed'
            );

            return (
              <div
                key={app.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl font-mono text-center shrink-0 border border-sky-100">
                    <Clock className="w-5 h-5 mx-auto text-sky-600 mb-0.5" />
                    <span className="text-xs font-extrabold">{app.time}</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">{app.patientName}</h3>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {app.procedure} • <span className="text-slate-500">{app.doctorName || 'Dr. Mohamed'}</span>
                    </p>

                    <p className="text-xs font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {app.phone}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-0 border-slate-100">
                  {/* WhatsApp Reminder Button */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Send WhatsApp Reminder
                  </a>

                  {/* Status Toggle Buttons */}
                  {app.status !== 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(app.id, 'confirmed')}
                      className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs hover:bg-emerald-100 border border-emerald-200"
                    >
                      Confirm
                    </button>
                  )}

                  {app.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(app.id, 'completed')}
                      className="px-3 py-2 bg-sky-50 text-sky-800 rounded-xl font-bold text-xs hover:bg-sky-100 border border-sky-200"
                    >
                      Complete
                    </button>
                  )}

                  {app.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(app.id, 'cancelled')}
                      className="px-3 py-2 bg-rose-50 text-rose-800 rounded-xl font-bold text-xs hover:bg-rose-100 border border-rose-200"
                    >
                      Cancel
                    </button>
                  )}

                  {onDeleteAppointment && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete appointment for ${app.patientName} at ${app.time}?`)) {
                          onDeleteAppointment(app.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-slate-500" />
            <p className="font-bold text-slate-700">No appointments found for {selectedDate}</p>
            <p className="text-xs text-slate-500">Click "Book Appointment" to schedule a visit.</p>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[80] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-slate-900">Schedule Appointment</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-700 p-2 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-sm font-medium">
              {conflictError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{conflictError}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Patient *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none bg-white font-bold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    value={appTime}
                    onChange={(e) => setAppTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Doctor *</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none bg-white font-medium"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Procedure / Reason</label>
                <input
                  type="text"
                  required
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-extrabold hover:bg-sky-700 shadow-md"
                >
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
