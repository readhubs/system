import React, { useState } from 'react';
import { ClinicSettings, Doctor } from '../types';
import { Calendar, Clock, User, Phone, CheckCircle, X, ExternalLink, Copy } from 'lucide-react';

interface PublicBookingModalProps {
  settings: ClinicSettings;
  doctors: Doctor[];
  onClose: () => void;
  onBookAppointment: (bookingData: {
    patientName: string;
    phone: string;
    doctorId: string;
    date: string;
    time: string;
    procedure: string;
  }) => void;
}

export const PublicBookingModal: React.FC<PublicBookingModalProps> = ({
  settings,
  doctors,
  onClose,
  onBookAppointment
}) => {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('15:00');
  const [procedure, setProcedure] = useState('Dental Examination & Consultation');
  const [submitted, setSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const bookingUrl = `${window.location.origin}/#book-${settings.clinicId}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim()) return;

    onBookAppointment({
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctorId,
      date,
      time,
      procedure
    });

    setSubmitted(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200 bg-white/10 px-2.5 py-0.5 rounded-full">
              Public Online Booking
            </span>
            <h3 className="text-lg font-black mt-1">{settings.name}</h3>
            <p className="text-xs text-sky-100">{settings.address}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!settings.onlineBookingEnabled ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="text-base font-extrabold text-slate-800">Online Patient Booking Disabled</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Public online booking is currently turned OFF in your Clinic Settings. To enable patient self-scheduling, enable <span className="font-bold text-slate-700">Online Booking</span> in Settings.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-slate-800 transition-all"
            >
              Close Window
            </button>
          </div>
        ) : submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-black text-slate-900">Appointment Request Sent!</h4>
            <p className="text-xs text-slate-600">
              Thank you, <span className="font-extrabold">{patientName}</span>. Your request for <span className="font-bold">{procedure}</span> on <span className="font-bold">{date} at {time}</span> has been logged.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-extrabold hover:bg-sky-700 transition-all"
            >
              Return to Practice
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium">
            {/* Shareable Link Bar */}
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-sky-900">
              <div className="flex items-center gap-2 overflow-hidden">
                <ExternalLink className="w-4 h-4 shrink-0 text-sky-600" />
                <span className="truncate font-mono text-[11px]">{bookingUrl}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-sky-600 text-white rounded-xl font-extrabold shrink-0 hover:bg-sky-700 transition-all flex items-center gap-1 text-[10px]"
              >
                <Copy className="w-3 h-3" />
                {copiedLink ? 'Copied!' : 'Copy Portal Link'}
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                Phone Number (WhatsApp)
              </label>
              <input
                type="tel"
                required
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-600 font-semibold font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Preferred Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                Select Attending Dentist
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-600 font-semibold"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                Requested Dental Procedure
              </label>
              <input
                type="text"
                required
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-sky-600 font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-md transition-all mt-2"
            >
              Confirm Online Appointment
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
