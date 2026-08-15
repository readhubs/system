import {
  collection,
  collectionGroup,
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
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
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
  ClinicSettings,
  Clinic,
  ClinicStatus,
  SubscriptionPlan,
  DentalLabOrder,
  LabOrderStatus
} from '../types';

// ==========================================
// 1. Super Admin: Clinic Management
// ==========================================

const SUPER_ADMIN_CLINICS_CACHE_KEY = 'clinicpro_superadmin_clinics';

export function getCachedSuperAdminClinics(): Clinic[] {
  try {
    const raw = localStorage.getItem(SUPER_ADMIN_CLINICS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCachedSuperAdminClinics(clinics: Clinic[]): void {
  try {
    localStorage.setItem(SUPER_ADMIN_CLINICS_CACHE_KEY, JSON.stringify(clinics));
  } catch (e) {
    console.warn('Failed to save clinics to localStorage cache', e);
  }
}

export function subscribeAllClinics(
  onUpdate: (clinics: Clinic[]) => void,
  onError?: (err: any) => void
) {
  // 1. Emit cached clinics immediately for instantaneous UI rendering
  const cached = getCachedSuperAdminClinics();
  if (cached && cached.length > 0) {
    onUpdate(cached);
  }

  const q = query(collection(db, 'clinics'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Clinic[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Clinic[];
      
      // Update local storage cache
      saveCachedSuperAdminClinics(list);
      onUpdate(list);
    },
    (err) => {
      console.warn('Super Admin clinics subscription note:', {
        code: err?.code,
        message: err?.message
      });
      // If cloud subscription encounters permissions or network issues, ensure cached clinics are retained
      const fallbackCached = getCachedSuperAdminClinics();
      if (fallbackCached.length > 0) {
        onUpdate(fallbackCached);
      }
      if (onError) onError(err);
    }
  );
}

export async function createClinicInFirestore(newClinicData: Clinic): Promise<Clinic> {
  const clinicRef = newClinicData.id 
    ? doc(db, 'clinics', newClinicData.id)
    : doc(collection(db, 'clinics'));
  
  const finalData: Clinic = {
    ...newClinicData,
    id: clinicRef.id
  };

  // 1. Save locally first so the clinic is NEVER lost
  try {
    const currentCached = getCachedSuperAdminClinics();
    const updatedCache = [finalData, ...currentCached.filter((c) => c.id !== finalData.id)];
    saveCachedSuperAdminClinics(updatedCache);
  } catch (cacheErr) {
    console.warn('Local cache save warning:', cacheErr);
  }

  // 2. Persist to Cloud Firestore
  try {
    await setDoc(clinicRef, finalData, { merge: true });

    // Initialize clinic settings record in Firestore
    try {
      await setDoc(
        doc(db, 'settings', finalData.id),
        {
          clinicId: finalData.id,
          name: finalData.name,
          doctorName: finalData.doctorName,
          phone: finalData.phone || '',
          languageDefault: 'en',
          multiBranchEnabled: false,
          onlineBookingEnabled: true,
          whatsappTemplate:
            finalData.whatsappTemplate ||
            `مرحباً [PatientName]، نذكركم بموعدكم في [ClinicName] يوم [Date] الساعة [Time]. د. [DoctorName]`
        },
        { merge: true }
      );
    } catch (settingsErr) {
      console.warn('Non-blocking settings sync warning for new clinic:', settingsErr);
    }

    return finalData;
  } catch (err: any) {
    console.error('[Firestore Error - Create Clinic]:', {
      code: err?.code,
      message: err?.message,
      name: err?.name,
      error: err
    });

    handleFirestoreError(err, OperationType.CREATE, `clinics/${finalData.id}`);
    
    // Return finalData so local state remains intact with user data
    return finalData;
  }
}

export async function saveClinicToFirestore(clinic: Clinic): Promise<Clinic> {
  return createClinicInFirestore(clinic);
}

export async function updateClinicStatusInFirestore(clinicId: string, status: ClinicStatus) {
  // Update local cache
  const cached = getCachedSuperAdminClinics();
  saveCachedSuperAdminClinics(cached.map((c) => (c.id === clinicId ? { ...c, status } : c)));

  try {
    await updateDoc(doc(db, 'clinics', clinicId), { status });
    // Also update settings doc if exists
    await setDoc(doc(db, 'settings', clinicId), { status }, { merge: true });
  } catch (err: any) {
    console.warn('Firestore updateClinicStatus note:', err?.message || err);
    handleFirestoreError(err, OperationType.UPDATE, `clinics/${clinicId}`);
  }
}

export async function updateClinicPlanInFirestore(
  clinicId: string,
  plan: SubscriptionPlan,
  expiresAt?: string
) {
  // Update local cache
  const cached = getCachedSuperAdminClinics();
  saveCachedSuperAdminClinics(
    cached.map((c) =>
      c.id === clinicId
        ? { ...c, plan, subscriptionExpiresAt: expiresAt, subscriptionEndDate: expiresAt }
        : c
    )
  );

  try {
    const updateData: any = { plan };
    if (expiresAt) {
      updateData.subscriptionExpiresAt = expiresAt;
      updateData.subscriptionEndDate = expiresAt;
    }
    await updateDoc(doc(db, 'clinics', clinicId), updateData);
    await setDoc(doc(db, 'settings', clinicId), updateData, { merge: true });
  } catch (err: any) {
    console.warn('Firestore updateClinicPlan note:', err?.message || err);
    handleFirestoreError(err, OperationType.UPDATE, `clinics/${clinicId}`);
  }
}

export async function deleteClinicFromFirestore(clinicId: string) {
  // Update local cache
  const cached = getCachedSuperAdminClinics();
  saveCachedSuperAdminClinics(cached.filter((c) => c.id !== clinicId));

  try {
    await deleteDoc(doc(db, 'clinics', clinicId));
    await deleteDoc(doc(db, 'settings', clinicId));
  } catch (err: any) {
    console.warn('Firestore deleteClinic note:', err?.message || err);
    handleFirestoreError(err, OperationType.DELETE, `clinics/${clinicId}`);
  }
}

// ==========================================
// 2. Pure Clinic Initialization (NO DEMO DATA)
// ==========================================

export async function ensureClinicInitialized(
  clinicId: string,
  ownerEmail?: string,
  doctorName?: string
) {
  if (!clinicId || clinicId === 'system') return;
  try {
    const clinicDocRef = doc(db, 'clinics', clinicId);
    const clinicSnap = await getDoc(clinicDocRef);

    if (!clinicSnap.exists()) {
      const newClinic: Clinic = {
        id: clinicId,
        name: 'My Dental Clinic',
        doctorName: doctorName || 'Doctor',
        email: ownerEmail || '',
        ownerEmail: ownerEmail || '',
        phone: '',
        status: 'active',
        plan: 'free_trial',
        createdAt: new Date().toISOString(),
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        whatsappTemplate: `مرحباً [PatientName] 👋\nنود تذكيركم بموعدكم القادم في [ClinicName]:\n📅 التاريخ: [Date]\n⏰ الساعة: [Time]\n👨‍⚕️ الطبيب المعالج: [DoctorName]\n🦷 الإجراء: [Procedure]`
      };
      await setDoc(clinicDocRef, newClinic, { merge: true });
    }

    const settingsRef = doc(db, 'settings', clinicId);
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      const initialSettings: ClinicSettings = {
        clinicId,
        name: 'My Dental Clinic',
        doctorName: doctorName || 'Doctor',
        address: '',
        phone: '',
        languageDefault: 'en',
        multiBranchEnabled: false,
        onlineBookingEnabled: true,
        whatsappTemplate: `مرحباً [PatientName] 👋\nنود تذكيركم بموعدكم القادم في [ClinicName]:\n📅 التاريخ: [Date]\n⏰ الساعة: [Time]\n👨‍⚕️ الطبيب المعالج: [DoctorName]\n🦷 الإجراء: [Procedure]`,
        proceduresCatalog: [
          { id: 'proc_1', name: 'Dental Examination & Consultation', category: 'General', defaultPrice: 200 },
          { id: 'proc_2', name: 'Scaling & Polishing (Teeth Cleaning)', category: 'Preventive', defaultPrice: 500 },
          { id: 'proc_3', name: 'Composite Filling (Class I / II / V)', category: 'Restorative', defaultPrice: 650 },
          { id: 'proc_4', name: 'Root Canal Treatment (Endo)', category: 'Endodontics', defaultPrice: 1800 },
          { id: 'proc_5', name: 'Simple Tooth Extraction', category: 'Surgery', defaultPrice: 400 },
          { id: 'proc_6', name: 'Surgical Extraction / Impacted Molar', category: 'Surgery', defaultPrice: 1500 },
          { id: 'proc_7', name: 'Zirconia Crown Restoration', category: 'Prosthodontics', defaultPrice: 2500 },
          { id: 'proc_8', name: 'Porcelain Laminate Veneer', category: 'Cosmetic', defaultPrice: 3000 },
          { id: 'proc_9', name: 'Post & Core Restoration', category: 'Restorative', defaultPrice: 800 },
          { id: 'proc_10', name: 'Dental Implant Placement', category: 'Implantology', defaultPrice: 8000 },
          { id: 'proc_11', name: 'In-Office Teeth Whitening (Bleaching)', category: 'Cosmetic', defaultPrice: 3000 },
          { id: 'proc_12', name: 'Pediatric Pulpotomy & Stainless Steel Crown', category: 'Pediatric', defaultPrice: 750 }
        ]
      };
      await setDoc(settingsRef, initialSettings, { merge: true });
    }
  } catch (err) {
    console.warn('ensureClinicInitialized note:', err);
  }
}

// ==========================================
// 3. Patients (Multi-Tenant & Paginated Reads)
// ==========================================

export function subscribePatients(
  clinicId: string,
  onUpdate: (patients: Patient[]) => void,
  pageSize: number = 100
) {
  const q = query(
    collection(db, 'patients'),
    where('clinicId', '==', clinicId),
    limit(pageSize)
  );

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

export async function savePatientToFirestore(patient: Patient) {
  try {
    await setDoc(doc(db, 'patients', patient.id), patient, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patient.id}`);
  }
}

export async function deletePatientFromFirestore(patientId: string) {
  try {
    await deleteDoc(doc(db, 'patients', patientId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `patients/${patientId}`);
  }
}

// ==========================================
// 4. Appointments & WhatsApp Follow-ups
// ==========================================

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

export async function saveAppointmentToFirestore(appointment: Appointment) {
  try {
    await setDoc(doc(db, 'appointments', appointment.id), appointment, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `appointments/${appointment.id}`);
  }
}

export async function deleteAppointmentFromFirestore(appointmentId: string) {
  try {
    await deleteDoc(doc(db, 'appointments', appointmentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `appointments/${appointmentId}`);
  }
}

export async function markAppointmentReminderSent(appointmentId: string) {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      reminderSent: true,
      reminderSentAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
  }
}

// ==========================================
// 5. Tooth Records & Clinical History
// ==========================================

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
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patientId}/toothRecords/${record.id}`);
  }
}

export async function deleteToothRecordFromFirestore(patientId: string, recordId: string) {
  try {
    await deleteDoc(doc(db, 'patients', patientId, 'toothRecords', recordId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `patients/${patientId}/toothRecords/${recordId}`);
  }
}

// ==========================================
// 6. Patient Images & Radiographs
// ==========================================

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
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patientId}/images/${image.id}`);
  }
}

export async function deletePatientImageFromFirestore(patientId: string, imageId: string) {
  try {
    await deleteDoc(doc(db, 'patients', patientId, 'images', imageId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `patients/${patientId}/images/${imageId}`);
  }
}

// ==========================================
// 7. Patient Payments & Collections
// ==========================================

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
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `patients/${patientId}/payments/${payment.id}`);
  }
}

export async function deletePaymentFromFirestore(patientId: string, paymentId: string) {
  try {
    await deleteDoc(doc(db, 'patients', patientId, 'payments', paymentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `patients/${patientId}/payments/${paymentId}`);
  }
}

// ==========================================
// 8. Clinic Settings
// ==========================================

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
    await setDoc(doc(db, 'settings', settings.clinicId), settings, { merge: true });
    // Also update clinic master
    await setDoc(doc(db, 'clinics', settings.clinicId), {
      name: settings.name,
      doctorName: settings.doctorName,
      phone: settings.phone,
      whatsappTemplate: settings.whatsappTemplate
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `settings/${settings.clinicId}`);
  }
}

// ==========================================
// 9. Staff & Assistant Management
// ==========================================

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
    await setDoc(doc(db, 'users', user.uid), user, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function deleteStaffUserFromFirestore(userId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}

export function subscribeClinicDoc(clinicId: string, onUpdate: (clinic: Clinic | null) => void) {
  const docRef = doc(db, 'clinics', clinicId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as Clinic);
      } else {
        onUpdate(null);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `clinics/${clinicId}`)
  );
}

// ==========================================
// 10. Dental Labs Management
// ==========================================

export function subscribeLabOrders(clinicId: string, onUpdate: (orders: DentalLabOrder[]) => void) {
  const q = query(
    collection(db, 'labOrders'),
    where('clinicId', '==', clinicId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: DentalLabOrder[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as DentalLabOrder[];
      onUpdate(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `labOrders?clinicId=${clinicId}`)
  );
}

export async function saveLabOrderToFirestore(order: DentalLabOrder) {
  try {
    await setDoc(doc(db, 'labOrders', order.id), order, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `labOrders/${order.id}`);
  }
}

export async function updateLabOrderStatusInFirestore(
  orderId: string,
  status: LabOrderStatus,
  additionalDates?: { receivedDate?: string; fittedDate?: string }
) {
  try {
    const updatePayload: any = { status };
    if (additionalDates?.receivedDate) updatePayload.receivedDate = additionalDates.receivedDate;
    if (additionalDates?.fittedDate) updatePayload.fittedDate = additionalDates.fittedDate;
    await updateDoc(doc(db, 'labOrders', orderId), updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `labOrders/${orderId}`);
  }
}

export async function deleteLabOrderFromFirestore(orderId: string) {
  try {
    await deleteDoc(doc(db, 'labOrders', orderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `labOrders/${orderId}`);
  }
}

// ==========================================
// 11. Doctors & Staff Subscriptions
// ==========================================

export function subscribeDoctors(clinicId: string, onUpdate: (doctors: Doctor[]) => void) {
  const q = query(collection(db, 'doctors'), where('clinicId', '==', clinicId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Doctor[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Doctor[];
      if (list.length > 0) {
        onUpdate(list);
      }
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `doctors?clinicId=${clinicId}`)
  );
}

export function subscribeAllClinicPayments(clinicId: string, onUpdate: (payments: Payment[]) => void) {
  try {
    const q = query(collectionGroup(db, 'payments'), where('clinicId', '==', clinicId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Payment[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Payment[];
        onUpdate(list);
      },
      (err) => {
        console.warn('Payments collectionGroup note:', err);
      }
    );
  } catch (err) {
    console.warn('Fallback collectionGroup payments:', err);
    return () => {};
  }
}

export function subscribeAllClinicToothRecords(clinicId: string, onUpdate: (records: ToothRecord[]) => void) {
  try {
    const q = query(collectionGroup(db, 'toothRecords'), where('clinicId', '==', clinicId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ToothRecord[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as ToothRecord[];
        onUpdate(list);
      },
      (err) => {
        console.warn('ToothRecords collectionGroup note:', err);
      }
    );
  } catch (err) {
    console.warn('Fallback collectionGroup toothRecords:', err);
    return () => {};
  }
}

// ==========================================
// 12. Data Export Helpers (CSV)
// ==========================================

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = typeof cell === 'object' ? JSON.stringify(cell).replace(/"/g, '""') : String(cell).replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
