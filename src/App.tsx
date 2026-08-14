import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import {
  Patient,
  Appointment,
  Payment,
  ToothRecord,
  PatientImage,
  Doctor,
  UserProfile,
  ClinicSettings,
  PermissionsMap
} from './types';
import {
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_PAYMENTS,
  INITIAL_TOOTH_RECORDS,
  INITIAL_PATIENT_IMAGES,
  INITIAL_DOCTORS,
  INITIAL_STAFF,
  INITIAL_CLINIC_SETTINGS,
  DEFAULT_DOCTOR_PROFILE
} from './lib/mockData';

import {
  subscribePatients,
  savePatientToFirestore,
  subscribeAppointments,
  saveAppointmentToFirestore,
  subscribeToothRecords,
  saveToothRecordToFirestore,
  subscribePatientImages,
  savePatientImageToFirestore,
  subscribePatientPayments,
  savePaymentToFirestore,
  subscribeClinicSettings,
  saveClinicSettingsToFirestore,
  subscribeStaffList,
  saveStaffUserToFirestore,
  seedInitialClinicDataIfEmpty
} from './lib/firestoreService';

import {
  requestNotificationPermission,
  checkUpcomingAppointmentsAndNotify,
  checkDaily7AMSummaryAndNotify
} from './lib/notifications';

import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PatientsPage } from './components/PatientsPage';
import { PatientProfile } from './components/PatientProfile';
import { AppointmentsPage } from './components/AppointmentsPage';
import { SmartScheduler } from './components/SmartScheduler';
import { FinancialReportsPage } from './components/FinancialReportsPage';
import { StaffManagementPage } from './components/StaffManagementPage';
import { SettingsPage } from './components/SettingsPage';
import { PatientForm } from './components/PatientForm';
import { PublicBookingModal } from './components/PublicBookingModal';

export default function App() {
  // Authentication State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Application Data State
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [toothRecords, setToothRecords] = useState<ToothRecord[]>(INITIAL_TOOTH_RECORDS);
  const [patientImages, setPatientImages] = useState<PatientImage[]>(INITIAL_PATIENT_IMAGES);
  const [doctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [staffList, setStaffList] = useState<UserProfile[]>(INITIAL_STAFF);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(INITIAL_CLINIC_SETTINGS);

  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Modals
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [showPublicBookingModal, setShowPublicBookingModal] = useState<boolean>(false);

  // PWA & Network State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);

  // 1. Firebase Auth Listener & Cached Session Loader
  useEffect(() => {
    // Check if there is an active cached session already in localStorage
    const savedActiveUser = localStorage.getItem('clinicpro_active_session');
    if (savedActiveUser) {
      try {
        const parsed = JSON.parse(savedActiveUser);
        if (parsed && parsed.uid) {
          setCurrentUser(parsed);
          setAuthChecking(false);
        }
      } catch (e) {
        // ignore parse error
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        let profile: UserProfile | null = null;
        try {
          const userDocSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDocSnap.exists()) {
            profile = userDocSnap.data() as UserProfile;
          }
        } catch (e) {
          console.warn('Could not read user profile from cloud Firestore directly:', e);
        }

        if (!profile) {
          const cached = localStorage.getItem(`clinicpro_user_${fbUser.uid}`);
          if (cached) {
            try {
              profile = JSON.parse(cached);
            } catch (e) {
              // ignore parse error
            }
          }
        }

        if (!profile) {
          // Fallback for newly created doctor account
          profile = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Doctor',
            email: fbUser.email || '',
            role: 'doctor',
            clinicId: `clinic_${fbUser.uid.slice(0, 8)}`,
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
        }

        localStorage.setItem(`clinicpro_user_${fbUser.uid}`, JSON.stringify(profile));
        localStorage.setItem('clinicpro_active_session', JSON.stringify(profile));
        setCurrentUser(profile);
      } else {
        const currentSession = localStorage.getItem('clinicpro_active_session');
        if (!currentSession) {
          setCurrentUser(null);
        }
      }
      setAuthChecking(false);
    });

    // Safety timeout: Never leave the user stuck on loading spinner for more than 2 seconds
    const safetyTimer = setTimeout(() => {
      setAuthChecking(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // 2. Real-time Firestore Subscriptions bound to Clinic ID
  useEffect(() => {
    if (!currentUser?.clinicId) return;

    const cid = currentUser.clinicId;

    // Seed initial demo data for new clinics if empty
    seedInitialClinicDataIfEmpty(cid, INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_DOCTORS, INITIAL_STAFF, INITIAL_CLINIC_SETTINGS);

    // Subscriptions
    const unsubPatients = subscribePatients(cid, (data) => setPatients(data));
    const unsubAppointments = subscribeAppointments(cid, (data) => setAppointments(data));
    const unsubSettings = subscribeClinicSettings(cid, (data) => setClinicSettings(data));
    const unsubStaff = subscribeStaffList(cid, (data) => setStaffList(data));

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubSettings();
      unsubStaff();
    };
  }, [currentUser?.clinicId]);

  // Subcollections for active patient
  useEffect(() => {
    if (!selectedPatientId || !currentUser?.clinicId) return;

    const unsubTooth = subscribeToothRecords(selectedPatientId, (recs) => {
      setToothRecords((prev) => [
        ...prev.filter((r) => r.patientId !== selectedPatientId),
        ...recs.map((r) => ({ ...r, patientId: selectedPatientId }))
      ]);
    });

    const unsubImgs = subscribePatientImages(selectedPatientId, (imgs) => {
      setPatientImages((prev) => [
        ...prev.filter((i) => i.patientId !== selectedPatientId),
        ...imgs.map((i) => ({ ...i, patientId: selectedPatientId }))
      ]);
    });

    const unsubPays = subscribePatientPayments(selectedPatientId, (pays) => {
      setPayments((prev) => [
        ...prev.filter((p) => p.patientId !== selectedPatientId),
        ...pays.map((p) => ({ ...p, patientId: selectedPatientId }))
      ]);
    });

    return () => {
      unsubTooth();
      unsubImgs();
      unsubPays();
    };
  }, [selectedPatientId, currentUser?.clinicId]);

  // 3. Notification timers & listeners
  useEffect(() => {
    requestNotificationPermission();

    const interval = setInterval(() => {
      checkUpcomingAppointmentsAndNotify(appointments);
      checkDaily7AMSummaryAndNotify(appointments);
    }, 60000); // check every minute

    return () => clearInterval(interval);
  }, [appointments]);

  // Online / Offline & PWA Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handlePwaPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handlePwaPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handlePwaPrompt);
    };
  }, []);

  const handleInstallPWA = () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then(() => {
        setDeferredPwaPrompt(null);
      });
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('clinicpro_active_session');
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Signout note:', e);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  // Action Handlers
  const handleAddPatient = async (pData: Omit<Patient, 'id' | 'createdAt' | 'clinicId'>) => {
    const cid = currentUser?.clinicId || 'clinic_cairo_1';
    const newPatient: Patient = {
      ...pData,
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      clinicId: cid
    };

    setPatients([newPatient, ...patients]);
    await savePatientToFirestore(newPatient);
    setShowAddPatientModal(false);
    setSelectedPatientId(newPatient.id);
  };

  const handleUpdatePatient = async (updated: Patient) => {
    setPatients(patients.map((p) => (p.id === updated.id ? updated : p)));
    await savePatientToFirestore(updated);
  };

  const handleAddToothRecord = async (recData: Omit<ToothRecord, 'id'>) => {
    if (!selectedPatientId || !currentUser?.clinicId) return;
    const newRecord: ToothRecord = {
      ...recData,
      id: `rec_${Date.now()}`,
      patientId: selectedPatientId
    };
    setToothRecords([newRecord, ...toothRecords]);
    await saveToothRecordToFirestore(selectedPatientId, newRecord, currentUser.clinicId);
  };

  const handleAddPatientImage = async (imgData: Omit<PatientImage, 'id'>) => {
    if (!selectedPatientId || !currentUser?.clinicId) return;
    const newImg: PatientImage = {
      ...imgData,
      id: `img_${Date.now()}`,
      patientId: selectedPatientId
    };
    setPatientImages([newImg, ...patientImages]);
    await savePatientImageToFirestore(selectedPatientId, newImg, currentUser.clinicId);
  };

  const handleAddPayment = async (payData: Omit<Payment, 'id'>) => {
    if (!selectedPatientId || !currentUser?.clinicId) return;
    const newPay: Payment = {
      ...payData,
      id: `pay_${Date.now()}`,
      patientId: selectedPatientId
    };
    setPayments([newPay, ...payments]);
    await savePaymentToFirestore(selectedPatientId, newPay, currentUser.clinicId);
  };

  const handleAddAppointment = async (appData: Omit<Appointment, 'id'>) => {
    const cid = currentUser?.clinicId || 'clinic_cairo_1';
    const newApp: Appointment = {
      ...appData,
      id: `app_${Date.now()}`,
      clinicId: cid
    };
    setAppointments([newApp, ...appointments]);
    await saveAppointmentToFirestore(newApp);
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: Appointment['status']) => {
    const updatedList = appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setAppointments(updatedList);
    const target = updatedList.find((a) => a.id === id);
    if (target) {
      await saveAppointmentToFirestore(target);
    }
  };

  const handleUpdateStaffPermissions = async (uid: string, permissions: PermissionsMap) => {
    const updatedStaff = staffList.map((s) => (s.uid === uid ? { ...s, permissions } : s));
    setStaffList(updatedStaff);
    const target = updatedStaff.find((s) => s.uid === uid);
    if (target) {
      await saveStaffUserToFirestore(target);
    }
  };

  const handleAddStaffMember = async (newStaff: UserProfile) => {
    setStaffList([...staffList, newStaff]);
    await saveStaffUserToFirestore(newStaff);
  };

  const handleUpdateSettings = async (newSet: ClinicSettings) => {
    setClinicSettings(newSet);
    await saveClinicSettingsToFirestore(newSet);
  };

  // Render Auth Checking Spinner
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400">Verifying Dental Practice Credentials...</p>
      </div>
    );
  }

  // Auth Gate: Require authenticated user profile
  if (!currentUser) {
    return (
      <AuthScreen
        onAuthenticated={(profile) => {
          localStorage.setItem('clinicpro_active_session', JSON.stringify(profile));
          setCurrentUser(profile);
        }}
      />
    );
  }

  // Active Patient computed object
  const activePatient = selectedPatientId
    ? patients.find((p) => p.id === selectedPatientId) || null
    : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointmentsCount = appointments.filter((a) => a.date === todayStr).length;

  const pendingFollowupsCount = patients.filter((p) => {
    const hasUntreated = Object.values(p.toothStatus || {}).some((s) => s === 'needs-treatment');
    const hasFutureApp = appointments.some((a) => a.patientId === p.id && a.date >= todayStr);
    return hasUntreated && !hasFutureApp;
  }).length;

  return (
    <div
      className={`min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col ${
        lang === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Navigation */}
      <Navbar
        clinicSettings={clinicSettings}
        userProfile={currentUser}
        lang={lang}
        onLanguageToggle={() => setLang(lang === 'en' ? 'ar' : 'en')}
        isOnline={isOnline}
        canInstallPWA={Boolean(deferredPwaPrompt)}
        onInstallPWA={handleInstallPWA}
        onSignOut={handleSignOut}
      />

      {/* Main Layout (Sidebar + Content Stage) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedPatientId(null);
          }}
          permissions={currentUser.permissions}
          clinicSettings={clinicSettings}
          todayAppointmentsCount={todayAppointmentsCount}
          pendingFollowupsCount={pendingFollowupsCount}
        />

        {/* Content Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* If a patient is selected, show PatientProfile view */}
          {activePatient ? (
            <PatientProfile
              patient={activePatient}
              toothRecords={toothRecords.filter((r) => r.patientId === activePatient.id)}
              patientImages={patientImages.filter((i) => i.patientId === activePatient.id)}
              payments={payments.filter((p) => p.patientId === activePatient.id)}
              doctors={doctors}
              clinicSettings={clinicSettings}
              onUpdatePatient={handleUpdatePatient}
              onAddToothRecord={handleAddToothRecord}
              onAddPatientImage={handleAddPatientImage}
              onAddPayment={handleAddPayment}
              onBack={() => setSelectedPatientId(null)}
              onEditPatientModalOpen={() => {
                setEditingPatient(activePatient);
                setShowAddPatientModal(true);
              }}
            />
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {activeTab === 'dashboard' && (
                <Dashboard
                  patients={patients}
                  appointments={appointments}
                  payments={payments}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAddPatient={() => {
                    setEditingPatient(undefined);
                    setShowAddPatientModal(true);
                  }}
                  onSelectPatient={(pId) => setSelectedPatientId(pId)}
                />
              )}

              {/* TAB 2: PATIENTS */}
              {activeTab === 'patients' && (
                <PatientsPage
                  patients={patients}
                  onSelectPatient={(pId) => setSelectedPatientId(pId)}
                  onOpenAddPatientModal={() => {
                    setEditingPatient(undefined);
                    setShowAddPatientModal(true);
                  }}
                />
              )}

              {/* TAB 3: SCHEDULE & REMINDERS */}
              {activeTab === 'appointments' && (
                <AppointmentsPage
                  appointments={appointments}
                  patients={patients}
                  doctors={doctors}
                  onAddAppointment={handleAddAppointment}
                  onUpdateStatus={handleUpdateAppointmentStatus}
                />
              )}

              {/* TAB 4: SMART FOLLOW-UP RADAR */}
              {activeTab === 'smart-scheduler' && (
                <SmartScheduler
                  patients={patients}
                  appointments={appointments}
                  onBookForPatient={(pId) => setSelectedPatientId(pId)}
                />
              )}

              {/* TAB 5: FINANCIAL REPORTS */}
              {activeTab === 'financials' && (
                <FinancialReportsPage
                  payments={payments}
                  toothRecords={toothRecords}
                  doctors={doctors}
                  clinicSettings={clinicSettings}
                />
              )}

              {/* TAB 6: STAFF PERMISSIONS */}
              {activeTab === 'staff' && (
                <StaffManagementPage
                  staffList={staffList}
                  onUpdateStaffPermissions={handleUpdateStaffPermissions}
                  onAddStaffMember={handleAddStaffMember}
                  currentUserRole={currentUser.role}
                />
              )}

              {/* TAB 7: SETTINGS */}
              {activeTab === 'settings' && (
                <SettingsPage
                  settings={clinicSettings}
                  onUpdateSettings={handleUpdateSettings}
                  lang={lang}
                  onLanguageChange={(newLang) => setLang(newLang)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Add/Edit Patient Modal */}
      {showAddPatientModal && (
        <PatientForm
          initialData={editingPatient}
          onSubmit={(pData) => {
            if (editingPatient) {
              handleUpdatePatient({
                ...editingPatient,
                ...pData
              });
              setShowAddPatientModal(false);
              setEditingPatient(undefined);
            } else {
              handleAddPatient(pData);
            }
          }}
          onClose={() => {
            setShowAddPatientModal(false);
            setEditingPatient(undefined);
          }}
        />
      )}

      {/* Public Online Booking Modal (Toggleable in Settings) */}
      {showPublicBookingModal && (
        <PublicBookingModal
          settings={clinicSettings}
          doctors={doctors}
          onClose={() => setShowPublicBookingModal(false)}
          onBookAppointment={(bookingData) => {
            const patientObj = patients.find((p) => p.phone === bookingData.phone) || {
              id: `p_online_${Date.now()}`,
              name: bookingData.patientName,
              phone: bookingData.phone,
              gender: 'Male',
              birthDate: '1990-01-01',
              medicalAlerts: [],
              medicalNotes: 'Online self-booked appointment',
              balance: 0,
              hasPendingTreatment: false,
              toothStatus: {},
              clinicId: currentUser.clinicId,
              createdAt: new Date().toISOString().split('T')[0]
            };

            handleAddAppointment({
              patientId: patientObj.id,
              patientName: bookingData.patientName,
              phone: bookingData.phone,
              doctorId: bookingData.doctorId,
              date: bookingData.date,
              time: bookingData.time,
              procedure: bookingData.procedure,
              status: 'scheduled',
              clinicId: currentUser.clinicId,
              notes: 'Self-scheduled via Public Online Booking Portal'
            });
          }}
        />
      )}
    </div>
  );
}
