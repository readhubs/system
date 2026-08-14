import { Patient, ToothRecord, PatientImage, Payment, Appointment, Doctor, UserProfile, ClinicSettings } from '../types';

export const INITIAL_CLINIC_SETTINGS: ClinicSettings = {
  clinicId: 'clinic_cairo_1',
  name: 'ClinicPro Egypt Dental Center',
  address: '15 El-Tahrir St, Dokki, Giza / Cairo',
  phone: '01012345678',
  languageDefault: 'en',
  multiBranchEnabled: false,
  onlineBookingEnabled: true,
  branches: [
    { id: 'b_dokki', name: 'Dokki Branch', address: '15 El-Tahrir St, Dokki' },
    { id: 'b_nasrcity', name: 'Nasr City Branch', address: '45 Abbas El-Akkad St, Nasr City' }
  ]
};

export const DEFAULT_DOCTOR_PROFILE: UserProfile = {
  uid: 'user_doc_owner',
  name: 'Dr. Mohamed Al-Sayed',
  email: 'doctor@clinicpro.eg',
  role: 'doctor',
  specialty: 'Consultant Prosthodontist & Implantologist',
  clinicId: 'clinic_cairo_1',
  permissions: {
    viewPatients: true,
    editClinical: true,
    editToothChart: true,
    uploadViewImages: true,
    manageAppointments: true,
    viewFinancials: true,
    viewPaymentAmounts: true,
    recordPayments: true,
    manageStaff: true,
    accessSettings: true,
    sendWhatsApp: true
  }
};

export const INITIAL_DOCTORS: Doctor[] = [
  { id: 'doc_1', name: 'Dr. Mohamed Al-Sayed', type: 'in-house', defaultCommissionPercent: 0, phone: '01011112222', clinicId: 'clinic_cairo_1' },
  { id: 'doc_2', name: 'Dr. Sarah Khalil (Endo Specialist)', type: 'in-house', defaultCommissionPercent: 30, phone: '01033334444', clinicId: 'clinic_cairo_1' },
  { id: 'doc_ext_1', name: 'Dr. Ahmed Farag (Oral Surgeon Referral)', type: 'external-referral', defaultCommissionPercent: 20, phone: '01255556666', clinicId: 'clinic_cairo_1' },
  { id: 'doc_ext_2', name: 'Dr. Tarek El-Basser (Orthodontist)', type: 'external-referral', defaultCommissionPercent: 25, phone: '01177778888', clinicId: 'clinic_cairo_1' }
];

export const INITIAL_STAFF: UserProfile[] = [
  DEFAULT_DOCTOR_PROFILE,
  {
    uid: 'user_assistant_1',
    name: 'Mariam Ali',
    email: 'mariam@clinicpro.eg',
    role: 'assistant',
    specialty: 'Clinical Assistant & Receptionist',
    clinicId: 'clinic_cairo_1',
    permissions: {
      viewPatients: true,
      editClinical: false,
      editToothChart: false,
      uploadViewImages: true,
      manageAppointments: true,
      viewFinancials: false,
      viewPaymentAmounts: false,
      recordPayments: true,
      manageStaff: false,
      accessSettings: false,
      sendWhatsApp: true
    }
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p_101',
    name: 'Ahmed Mohamed El-Khatib',
    phone: '01012345678',
    gender: 'Male',
    birthDate: '1985-06-12',
    age: 41,
    medicalAlerts: ['Diabetes (Sokkar)', 'Penicillin Allergy'],
    medicalNotes: 'Takes Insulin daily. Check blood sugar before surgical procedures. Penicillin causes severe urticaria.',
    balance: 1500, // owes 1500 EGP
    hasPendingTreatment: true,
    toothStatus: {
      16: 'treated',
      11: 'needs-treatment',
      26: 'needs-treatment',
      36: 'extracted',
      46: 'treated'
    },
    clinicId: 'clinic_cairo_1',
    createdAt: '2026-02-10'
  },
  {
    id: 'p_102',
    name: 'Salma Hassan Abdel-Rahman',
    phone: '01234567890',
    gender: 'Female',
    birthDate: '1992-11-24',
    age: 34,
    medicalAlerts: ['Blood Thinners (Aspirin/Marivan)'],
    medicalNotes: 'Low dose Aspirin 75mg daily. Discontinue 3 days prior to surgery upon cardiologist approval.',
    balance: 0,
    hasPendingTreatment: false,
    toothStatus: {
      21: 'treated',
      22: 'treated',
      37: 'treated'
    },
    clinicId: 'clinic_cairo_1',
    createdAt: '2026-03-01'
  },
  {
    id: 'p_103',
    name: 'Karim Mahmoud El-Gamal',
    phone: '01122334455',
    gender: 'Male',
    birthDate: '1978-01-15',
    age: 48,
    medicalAlerts: ['Hypertension (Daght)', 'Heart Condition'],
    medicalNotes: 'Hypertension controlled with Concor 5mg. Use epinephrine-free local anesthetic (Mepivacaine 3%).',
    balance: 3200,
    hasPendingTreatment: true,
    toothStatus: {
      14: 'needs-treatment',
      15: 'needs-treatment',
      36: 'treated',
      47: 'needs-treatment'
    },
    clinicId: 'clinic_cairo_1',
    createdAt: '2026-04-18'
  },
  {
    id: 'p_104',
    name: 'Nour El-Din Sherif',
    phone: '01099887766',
    gender: 'Female',
    birthDate: '2001-08-05',
    age: 25,
    medicalAlerts: [],
    medicalNotes: 'No systemic health conditions reported.',
    balance: 800,
    hasPendingTreatment: false,
    toothStatus: {
      11: 'treated',
      21: 'treated'
    },
    clinicId: 'clinic_cairo_1',
    createdAt: '2026-05-20'
  }
];

export const INITIAL_TOOTH_RECORDS: ToothRecord[] = [
  {
    id: 'tr_1',
    patientId: 'p_101',
    toothNumber: 16,
    procedureName: 'Root Canal Treatment (Endo)',
    date: '2026-07-15',
    cost: 2500,
    performingDoctorId: 'doc_2',
    performingDoctorName: 'Dr. Sarah Khalil',
    contributingDoctorId: 'doc_ext_1',
    contributingDoctorName: 'Dr. Ahmed Farag',
    commissionPercent: 20,
    status: 'completed',
    notes: '3 canals localized and instrumented to size #30. Obturation done with Gutta-percha and AH Plus sealer.',
    surfaces: ['O']
  },
  {
    id: 'tr_2',
    patientId: 'p_101',
    toothNumber: 16,
    procedureName: 'Zirconia Crown Restoration',
    date: '2026-07-28',
    cost: 3500,
    performingDoctorId: 'doc_1',
    performingDoctorName: 'Dr. Mohamed Al-Sayed',
    status: 'completed',
    notes: 'Chamfer preparation finished. Polyether impression taken. Final crown cemented with RelyX Unicem.',
    surfaces: ['O', 'M', 'D', 'B', 'L']
  },
  {
    id: 'tr_3',
    patientId: 'p_101',
    toothNumber: 11,
    procedureName: 'Class IV Composite Restoration',
    date: '2026-08-01',
    cost: 1200,
    performingDoctorId: 'doc_1',
    performingDoctorName: 'Dr. Mohamed Al-Sayed',
    status: 'planned',
    notes: 'Traumatic fracture mesio-incisal angle. Shade selection A2 body + A1 enamel.',
    surfaces: ['M', 'O']
  },
  {
    id: 'tr_4',
    patientId: 'p_102',
    toothNumber: 21,
    procedureName: 'Porcelain Laminate Veneer',
    date: '2026-06-10',
    cost: 4500,
    performingDoctorId: 'doc_1',
    performingDoctorName: 'Dr. Mohamed Al-Sayed',
    status: 'completed',
    notes: '0.5mm conservative enamel prep. Etched with 9.5% Hydrofluoric acid and silanated. Bonded with Variolink Esthetic.',
    surfaces: ['B']
  },
  {
    id: 'tr_5',
    patientId: 'p_103',
    toothNumber: 36,
    procedureName: 'Straumann Dental Implant Placement',
    date: '2026-07-02',
    cost: 9000,
    performingDoctorId: 'doc_1',
    performingDoctorName: 'Dr. Mohamed Al-Sayed',
    contributingDoctorId: 'doc_ext_1',
    contributingDoctorName: 'Dr. Ahmed Farag',
    commissionPercent: 25,
    status: 'completed',
    notes: 'Surgical placement of 4.1 x 10mm implant at tooth #36 position. Primary stability 35 Ncm achieved.',
    surfaces: ['O']
  }
];

export const INITIAL_PATIENT_IMAGES: PatientImage[] = [
  {
    id: 'img_1',
    patientId: 'p_101',
    toothNumber: 16,
    type: 'Periapical',
    url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    fileName: 'tooth_16_endo_post_op.jpg',
    date: '2026-07-15',
    uploadedBy: 'Dr. Sarah Khalil',
    fileSizeMb: 1.2
  },
  {
    id: 'img_2',
    patientId: 'p_101',
    toothNumber: 11,
    type: 'Intraoral Photo',
    url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    fileName: 'tooth_11_fracture_pre.jpg',
    date: '2026-08-01',
    uploadedBy: 'Dr. Mohamed Al-Sayed',
    fileSizeMb: 2.1
  },
  {
    id: 'img_3',
    patientId: 'p_103',
    toothNumber: 36,
    type: 'CBCT Slice',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    fileName: 'cbct_mandible_36_implant.jpg',
    date: '2026-07-02',
    uploadedBy: 'Dr. Mohamed Al-Sayed',
    fileSizeMb: 8.4
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    patientId: 'p_101',
    patientName: 'Ahmed Mohamed El-Khatib',
    amount: 3000,
    date: '2026-07-15T14:30:00Z',
    method: 'Cash',
    notes: 'Initial deposit for Tooth 16 Root Canal and Crown',
    remainingBalanceSnapshot: 3000
  },
  {
    id: 'pay_2',
    patientId: 'p_101',
    patientName: 'Ahmed Mohamed El-Khatib',
    amount: 1500,
    date: '2026-07-28T16:00:00Z',
    method: 'InstaPay',
    proofUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    notes: 'InstaPay transfer confirmation #EG984102',
    remainingBalanceSnapshot: 1500
  },
  {
    id: 'pay_3',
    patientId: 'p_102',
    patientName: 'Salma Hassan Abdel-Rahman',
    amount: 4500,
    date: '2026-06-10T11:15:00Z',
    method: 'Visa',
    notes: 'Full payment for Veneer procedure',
    remainingBalanceSnapshot: 0
  },
  {
    id: 'pay_4',
    patientId: 'p_103',
    patientName: 'Karim Mahmoud El-Gamal',
    amount: 5800,
    date: '2026-07-02T18:00:00Z',
    method: 'InstaPay',
    proofUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    notes: 'InstaPay transfer for implant surgical phase',
    remainingBalanceSnapshot: 3200
  }
];

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app_1',
    patientId: 'p_101',
    patientName: 'Ahmed Mohamed El-Khatib',
    phone: '01012345678',
    doctorId: 'doc_1',
    doctorName: 'Dr. Mohamed Al-Sayed',
    date: todayStr,
    time: '14:00',
    procedure: 'Composite Filling Tooth #11',
    status: 'confirmed',
    clinicId: 'clinic_cairo_1',
    notes: 'Patient confirmed via phone call.'
  },
  {
    id: 'app_2',
    patientId: 'p_102',
    patientName: 'Salma Hassan Abdel-Rahman',
    phone: '01234567890',
    doctorId: 'doc_1',
    doctorName: 'Dr. Mohamed Al-Sayed',
    date: todayStr,
    time: '15:30',
    procedure: 'Routine Checkup & Scaling',
    status: 'scheduled',
    clinicId: 'clinic_cairo_1'
  },
  {
    id: 'app_3',
    patientId: 'p_103',
    patientName: 'Karim Mahmoud El-Gamal',
    phone: '01122334455',
    doctorId: 'doc_2',
    doctorName: 'Dr. Sarah Khalil',
    date: todayStr,
    time: '17:00',
    procedure: 'Endodontic Consultation Tooth #14',
    status: 'scheduled',
    clinicId: 'clinic_cairo_1'
  },
  {
    id: 'app_4',
    patientId: 'p_104',
    patientName: 'Nour El-Din Sherif',
    phone: '01099887766',
    doctorId: 'doc_1',
    doctorName: 'Dr. Mohamed Al-Sayed',
    date: todayStr,
    time: '18:30',
    procedure: 'Teeth Whitening Session',
    status: 'completed',
    clinicId: 'clinic_cairo_1'
  }
];
