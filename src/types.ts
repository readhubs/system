export type Role = 'super_admin' | 'doctor' | 'assistant';

export type ClinicStatus = 'active' | 'suspended';

export type SubscriptionPlan = 'free_trial' | 'basic_monthly' | 'pro_annual' | 'vip_unlimited';

export interface Clinic {
  id: string;
  name: string;
  doctorName: string;
  email: string;
  phone: string;
  status: ClinicStatus;
  plan: SubscriptionPlan;
  createdAt: string;
  subscriptionExpiresAt?: string;
  notes?: string;
  whatsappTemplate?: string;
  patientsCount?: number;
}

export interface PermissionsMap {
  viewPatients: boolean;
  editClinical: boolean;
  editToothChart: boolean;
  uploadViewImages: boolean;
  manageAppointments: boolean;
  viewFinancials: boolean;
  viewPaymentAmounts: boolean;
  recordPayments: boolean;
  manageStaff: boolean;
  accessSettings: boolean;
  sendWhatsApp: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  specialty?: string;
  clinicId: string;
  disabled?: boolean;
  initialPassword?: string;
  permissions: PermissionsMap;
  createdAt?: string;
}

export type DoctorType = 'in-house' | 'external-referral';

export interface Doctor {
  id: string;
  name: string;
  type: DoctorType;
  defaultCommissionPercent: number;
  phone?: string;
  clinicId: string;
}

export type ToothStatus = 'healthy' | 'treated' | 'needs-treatment' | 'extracted' | 'endo' | 'crown';

export type ToothSurface = 'O' | 'M' | 'D' | 'B' | 'L'; // Occlusal, Mesial, Distal, Buccal, Lingual

export interface Patient {
  id: string;
  name: string;
  phone: string;
  gender: 'Male' | 'Female';
  birthDate?: string;
  age?: number;
  occupation?: string;
  address?: string;
  medicalAlerts: string[];
  medicalNotes: string;
  balance: number; // Positive = owes money, negative/zero = paid
  hasPendingTreatment: boolean;
  toothStatus: Record<number, ToothStatus>; // key: toothNumber (e.g., 16 -> 'treated')
  clinicId: string;
  createdAt: string;
  branchId?: string;
}

export interface ToothRecord {
  id: string;
  patientId?: string;
  toothNumber: number;
  procedureName: string;
  date: string;
  cost: number;
  performingDoctorId: string;
  performingDoctorName?: string;
  contributingDoctorId?: string;
  contributingDoctorName?: string;
  commissionPercent?: number;
  status: 'completed' | 'planned';
  notes?: string;
  surfaces?: ToothSurface[];
}

export type ImageType = 'Periapical' | 'Panoramic' | 'CBCT Slice' | 'Intraoral Photo' | 'Other';

export interface PatientImage {
  id: string;
  patientId: string;
  toothNumber: number;
  type: ImageType;
  url: string;
  fileName: string;
  date: string;
  uploadedBy: string;
  fileSizeMb?: number;
}

export type PaymentMethod = 'Cash' | 'InstaPay' | 'Visa' | 'Bank' | 'Other';

export interface Payment {
  id: string;
  patientId: string;
  patientName?: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  proofUrl?: string;
  notes?: string;
  remainingBalanceSnapshot: number;
  clinicId?: string;
  recordedBy?: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  doctorId: string;
  doctorName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  procedure: string;
  status: AppointmentStatus;
  clinicId: string;
  branchId?: string;
  notes?: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
}

export interface ClinicSettings {
  clinicId: string;
  name: string;
  doctorName?: string;
  address: string;
  phone: string;
  languageDefault: 'en' | 'ar';
  multiBranchEnabled: boolean;
  onlineBookingEnabled: boolean;
  whatsappTemplate?: string;
  status?: ClinicStatus;
  plan?: SubscriptionPlan;
  subscriptionExpiresAt?: string;
  branches?: { id: string; name: string; address: string }[];
}

export interface FinancialSummary {
  totalRevenue: number;
  collected: number;
  outstanding: number;
  byMethod: Record<PaymentMethod, number>;
  commissionsOwed: {
    doctorId: string;
    doctorName: string;
    doctorType: DoctorType;
    totalDue: number;
    procedureCount: number;
  }[];
  procedureBreakdown: {
    procedureName: string;
    count: number;
    totalAmount: number;
  }[];
}

