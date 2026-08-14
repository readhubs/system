import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Patient,
  Appointment,
  Payment,
  ToothRecord,
  PatientImage,
  Doctor,
  UserProfile,
  ClinicSettings
} from '../types';

// Helper to seed initial sample data into Firestore if a clinic is brand new
export async function seedInitialClinicDataIfEmpty(clinicId: string, initialPatients: Patient[], initialAppointments: Appointment[], initialDoctors: Doctor[], initialStaff: UserProfile[], initialSettings: ClinicSettings) {
  try {
    const patientsQuery = query(collection(db, 'patients'), where('clinicId', '==', clinicId));
    const snap = await getDocs(patientsQuery);
    if (snap.empty) {
      console.log('Seeding initial clinical data into Firestore for clinic:', clinicId);

      // Seed settings
      await setDoc(doc(db, 'settings', clinicId), { ...initialSettings, clinicId });

      // Seed Doctors
      for (const docItem of initialDoctors) {
        await setDoc(doc(db, 'doctors', docItem.id), { ...docItem, clinicId });
      }

      // Seed Patients and Subcollections
      for (const p of initialPatients) {
        const patientData = { ...p, clinicId };
        await setDoc(doc(db, 'patients', p.id), patientData);

        // Subcollection toothRecords
        const defaultToothRecs: ToothRecord[] = [
          {
            id: `tr_${p.id}_1`,
            toothNumber: 16,
            procedureName: 'Root Canal Treatment (Endo)',
            date: '2026-07-15',
            cost: 2500,
            performingDoctorId: 'doc_2',
            performingDoctorName: 'Dr. Sarah Khalil',
            status: 'completed',
            notes: 'Completed 3-canal endo',
            surfaces: ['O']
          }
        ];
        for (const tr of defaultToothRecs) {
          await setDoc(doc(db, 'patients', p.id, 'toothRecords', tr.id), { ...tr, clinicId });
        }

        // Subcollection images
        const defaultImgs: PatientImage[] = [
          {
            id: `img_${p.id}_1`,
            patientId: p.id,
            toothNumber: 16,
            type: 'Periapical',
            url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
            fileName: 'tooth_16_endo.jpg',
            date: '2026-07-15',
            uploadedBy: 'Dr. Sarah Khalil'
          }
        ];
        for (const img of defaultImgs) {
          await setDoc(doc(db, 'patients', p.id, 'images', img.id), { ...img, clinicId });
        }

        // Subcollection payments
        const defaultPays: Payment[] = [
          {
            id: `pay_${p.id}_1`,
            patientId: p.id,
            patientName: p.name,
            amount: 1000,
            date: new Date().toISOString(),
            method: 'Cash',
            remainingBalanceSnapshot: p.balance
          }
        ];
        for (const pay of defaultPays) {
          await setDoc(doc(db, 'patients', p.id, 'payments', pay.id), { ...pay, clinicId });
        }
      }

      // Seed Appointments
      for (const appt of initialAppointments) {
        await setDoc(doc(db, 'appointments', appt.id), { ...appt, clinicId });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seedInitialClinicDataIfEmpty');
  }
}

// Subscribe to Patients
export function subscribePatients(clinicId: string, onUpdate: (patients: Patient[]) => void) {
  const q = query(collection(db, 'patients'), where('clinicId', '==', clinicId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Patient[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Patient[];
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `patients?clinicId=${clinicId}`)
  );
}

// Save Patient
export async function savePatientToFirestore(patient: Patient) {
  try {
    await setDoc(doc(db, 'patients', patient.id), patient);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patient.id}`);
  }
}

// Subscribe to Appointments
export function subscribeAppointments(clinicId: string, onUpdate: (appointments: Appointment[]) => void) {
  const q = query(collection(db, 'appointments'), where('clinicId', '==', clinicId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Appointment[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Appointment[];
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `appointments?clinicId=${clinicId}`)
  );
}

// Save Appointment
export async function saveAppointmentToFirestore(appointment: Appointment) {
  try {
    await setDoc(doc(db, 'appointments', appointment.id), appointment);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `appointments/${appointment.id}`);
  }
}

// Subcollection: Tooth Records
export function subscribeToothRecords(patientId: string, onUpdate: (records: ToothRecord[]) => void) {
  const colRef = collection(db, 'patients', patientId, 'toothRecords');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ToothRecord[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ToothRecord[];
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `patients/${patientId}/toothRecords`)
  );
}

export async function saveToothRecordToFirestore(patientId: string, record: ToothRecord, clinicId: string) {
  try {
    await setDoc(doc(db, 'patients', patientId, 'toothRecords', record.id), {
      ...record,
      clinicId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patientId}/toothRecords/${record.id}`);
  }
}

// Subcollection: Patient Images
export function subscribePatientImages(patientId: string, onUpdate: (images: PatientImage[]) => void) {
  const colRef = collection(db, 'patients', patientId, 'images');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PatientImage[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as PatientImage[];
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `patients/${patientId}/images`)
  );
}

export async function savePatientImageToFirestore(patientId: string, image: PatientImage, clinicId: string) {
  try {
    await setDoc(doc(db, 'patients', patientId, 'images', image.id), {
      ...image,
      clinicId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patientId}/images/${image.id}`);
  }
}

// Subcollection: Payments
export function subscribePatientPayments(patientId: string, onUpdate: (payments: Payment[]) => void) {
  const colRef = collection(db, 'patients', patientId, 'payments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Payment[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Payment[];
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `patients/${patientId}/payments`)
  );
}

export async function savePaymentToFirestore(patientId: string, payment: Payment, clinicId: string) {
  try {
    await setDoc(doc(db, 'patients', patientId, 'payments', payment.id), {
      ...payment,
      clinicId
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patientId}/payments/${payment.id}`);
  }
}

// Clinic Settings
export function subscribeClinicSettings(clinicId: string, onUpdate: (settings: ClinicSettings) => void) {
  return onSnapshot(
    doc(db, 'settings', clinicId),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as ClinicSettings);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `settings/${clinicId}`)
  );
}

export async function saveClinicSettingsToFirestore(settings: ClinicSettings) {
  try {
    await setDoc(doc(db, 'settings', settings.clinicId), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `settings/${settings.clinicId}`);
  }
}

// Staff Users
export function subscribeStaffList(clinicId: string, onUpdate: (staff: UserProfile[]) => void) {
  const q = query(collection(db, 'users'), where('clinicId', '==', clinicId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: UserProfile[] = snapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data()
      })) as UserProfile[];
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `users?clinicId=${clinicId}`)
  );
}

export async function saveStaffUserToFirestore(user: UserProfile) {
  try {
    await setDoc(doc(db, 'users', user.uid), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}
