import React from 'react';
import { Patient, Appointment, Payment, Doctor, ClinicSettings } from '../types';
import { Dashboard } from './Dashboard';
import { TodayClinicPage } from './TodayClinicPage';

interface DeskPageProps {
  patients: Patient[];
  appointments: Appointment[];
  payments: Payment[];
  doctors: Doctor[];
  clinicSettings: ClinicSettings;
  onNavigate: (tab: string) => void;
  onOpenAddPatient: () => void;
  onSelectPatient: (patientId: string) => void;
  onUpdateAppointmentStatus: (id: string, newStatus: Appointment['status']) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeleteAppointment: (id: string) => void;
}

export const DeskPage: React.FC<DeskPageProps> = ({
  patients,
  appointments,
  payments,
  doctors,
  clinicSettings,
  onNavigate,
  onOpenAddPatient,
  onSelectPatient,
  onUpdateAppointmentStatus,
  onAddAppointment,
  onAddPayment,
  onDeleteAppointment
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Metrics Header from Dashboard */}
      <Dashboard 
        patients={patients}
        appointments={appointments}
        payments={payments}
        onNavigate={onNavigate}
        onOpenAddPatient={onOpenAddPatient}
        onSelectPatient={onSelectPatient}
      />

      <div className="mt-4">
        <TodayClinicPage 
          appointments={appointments}
          patients={patients}
          doctors={doctors}
          clinicSettings={clinicSettings}
          onSelectPatient={(p) => onSelectPatient(p.id)}
          onUpdateStatus={onUpdateAppointmentStatus}
          onAddAppointment={onAddAppointment}
          onAddPayment={onAddPayment}
          onDeleteAppointment={onDeleteAppointment}
        />
      </div>
    </div>
  );
};
