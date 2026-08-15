import React, { useState, useEffect, useRef } from 'react';
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
  Clinic,
  PermissionsMap,
  DentalLabOrder
} from './types';
import { DEFAULT_PROCEDURES_CATALOG } from './lib/defaultCatalog';

import {
  subscribePatients,
  savePatientToFirestore,
  deletePatientFromFirestore,
  subscribeAppointments,
  saveAppointmentToFirestore,
  deleteAppointmentFromFirestore,
  subscribeToothRecords,
  saveToothRecordToFirestore,
  deleteToothRecordFromFirestore,
  subscribePatientImages,
  savePatientImageToFirestore,
  deletePatientImageFromFirestore,
  subscribePatientPayments,
  savePaymentToFirestore,
  deletePaymentFromFirestore,
  subscribeClinicSettings,
  saveClinicSettingsToFirestore,
  subscribeStaffList,
  saveStaffUserToFirestore,
  deleteStaffUserFromFirestore,
  subscribeClinicDoc,
  ensureClinicInitialized,
  subscribeLabOrders,
  saveLabOrderToFirestore,
  deleteLabOrderFromFirestore,
  subscribeDoctors,
  subscribeAllClinicPayments,
  subscribeAllClinicToothRecords
} from './lib/firestoreService';

import {
  requestNotificationPermission,
  checkUpcomingAppointmentsAndNotify,
  checkDaily7AMSummaryAndNotify
} from './lib/notifications';

import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OperationsHub } from './components/OperationsHub';
import { DeskPage } from './components/DeskPage';
import { Dashboard } from './components/Dashboard';
import { PatientsPage } from './components/PatientsPage';
import { PatientProfile } from './components/PatientProfile';
import { AppointmentsPage } from './components/AppointmentsPage';
import { FinancialReportsPage } from './components/FinancialReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { PatientForm } from './components/PatientForm';
import { PublicBookingModal } from './components/PublicBookingModal';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { SuspendedClinicScreen } from './components/SuspendedClinicScreen';
import { AssistantDashboard } from './components/AssistantDashboard';
import { FloatingActionButton } from './components/FloatingActionButton';

export default function App() {
  // Authentication State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Clinic SaaS Document State
  const [clinicDoc, setClinicDoc] = useState<Clinic | null>(null);

  // Application Data State (Derived 100% from live Firestore queries)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [toothRecords, setToothRecords] = useState<ToothRecord[]>([]);
  const [patientImages, setPatientImages] = useState<PatientImage[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    clinicId: '',
    name: 'My Dental Clinic',
    doctorName: '',
    address: '',
    phone: '',
    languageDefault: 'en',
    multiBranchEnabled: false,
    onlineBookingEnabled: true,
    proceduresCatalog: DEFAULT_PROCEDURES_CATALOG
  });
  const [labOrders, setLabOrders] = useState<DentalLabOrder[]>([]);

  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Navigation State & GitHub Pages Hash Routing
  const [currentHash, setCurrentHash] = useState<string>(window.location.hash || '');
  const [activeTab, setActiveTab] = useState<string>('desk');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Modals
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>(undefined);
  const [showPublicBookingModal, setShowPublicBookingModal] = useState<boolean>(false);

  // PWA & Network State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);

  // 1. Listen to Hash changes for GitHub Pages client-side routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      setCurrentHash(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 2. Firebase Auth Listener & Cached Session Loader
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
          console.warn('Firestore user fetch note:', e);
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
          const isSuperAdminEmail =
            fbUser.email === 'replitoo55@gmail.com' ||
            fbUser.email === '203256@eru.edu.eg';
          profile = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Doctor',
            email: fbUser.email || '',
            role: isSuperAdminEmail ? 'super_admin' : 'doctor',
            clinicId: isSuperAdminEmail ? 'system' : `clinic_${fbUser.uid.slice(0, 8)}`,
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

    const safetyTimer = setTimeout(() => {
      setAuthChecking(false);
    }, 1500);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  // 3. Real-time Firestore Subscriptions bound to Clinic ID
  useEffect(() => {
    if (!currentUser?.clinicId) return;

    const cid = currentUser.clinicId;

    // Ensure clinic container and settings exist in Firestore without mock data
    if (cid !== 'system') {
      ensureClinicInitialized(cid, currentUser.email, currentUser.name);
    }

    // Subscriptions
    const unsubClinic = subscribeClinicDoc(cid, (data) => setClinicDoc(data));
    const unsubPatients = subscribePatients(cid, (data) => setPatients(data || []));
    const unsubAppointments = subscribeAppointments(cid, (data) => setAppointments(data || []));
    const unsubSettings = subscribeClinicSettings(cid, (data) => {
      if (data) {
        setClinicSettings({
          ...data,
          proceduresCatalog:
            data.proceduresCatalog && data.proceduresCatalog.length > 0
              ? data.proceduresCatalog
              : DEFAULT_PROCEDURES_CATALOG
        });
      }
    });
    const unsubStaff = subscribeStaffList(cid, (data) => setStaffList(data || []));
    const unsubLabs = subscribeLabOrders(cid, (data) => setLabOrders(data || []));
    const unsubDoctors = subscribeDoctors(cid, (data) => setDoctors(data || []));
    const unsubPayments = subscribeAllClinicPayments(cid, (data) => {
      setPayments(data || []);
    });
    const unsubToothRecords = subscribeAllClinicToothRecords(cid, (data) => {
      setToothRecords(data || []);
    });

    return () => {
      unsubClinic();
      unsubPatients();
      unsubAppointments();
      unsubSettings();
      unsubStaff();
      unsubLabs();
      unsubDoctors();
      unsubPayments();
      unsubToothRecords();
    };
  }, [currentUser?.clinicId]);

  // Subcollections for active patient
  useEffect(() => {
    if (!selectedPatientId || !currentUser?.clinicId) return;

    const unsubImgs = subscribePatientImages(selectedPatientId, (imgs) => {
      setPatientImages(imgs.map((i) => ({ ...i, patientId: selectedPatientId })));
    });

    return () => {
      unsubImgs();
    };
  }, [selectedPatientId, currentUser?.clinicId]);

  // Keep a stable ref for appointments to prevent 60s timer reset thrashing
  const appointmentsRef = useRef(appointments);
  useEffect(() => {
    appointmentsRef.current = appointments;
  }, [appointments]);

  // 4. Notification timers
  useEffect(() => {
    requestNotificationPermission();

    const interval = setInterval(() => {
      checkUpcomingAppointmentsAndNotify(appointmentsRef.current);
      checkDaily7AMSummaryAndNotify(appointmentsRef.current);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
    window.location.hash = '';
  };

  // Action Handlers
  const handleAddPatient = async (pData: Omit<Patient, 'id' | 'createdAt' | 'balance' | 'hasPendingTreatment' | 'toothStatus'>) => {
    const cid = currentUser?.clinicId || 'clinic_cairo_1';
    const newPatient: Patient = {
      balance: 0,
      hasPendingTreatment: false,
      toothStatus: {},
      ...pData,
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      clinicId: cid
    };

    // Strip undefined
    Object.keys(newPatient).forEach(key => {
      if ((newPatient as any)[key] === undefined) delete (newPatient as any)[key];
    });

    setPatients([newPatient, ...patients]);
    await savePatientToFirestore(newPatient);
    setShowAddPatientModal(false);
    setSelectedPatientId(newPatient.id);
  };

  const handleUpdatePatient = async (updated: Patient) => {
    // Strip undefined
    Object.keys(updated).forEach(key => {
      if ((updated as any)[key] === undefined) delete (updated as any)[key];
    });

    setPatients(patients.map((p) => (p.id === updated.id ? updated : p)));
    await savePatientToFirestore(updated);
  };

  const handleDeletePatient = async (patientId: string) => {
    setPatients(patients.filter((p) => p.id !== patientId));
    if (selectedPatientId === patientId) {
      setSelectedPatientId(null);
    }
    await deletePatientFromFirestore(patientId);
  };

  const handleAddToothRecord = async (recData: Omit<ToothRecord, 'id'>) => {
    if (!selectedPatientId || !currentUser?.clinicId) return;
    const newRecord: ToothRecord = {
      ...recData,
      id: `rec_${Date.now()}`,
      patientId: selectedPatientId
    };

    Object.keys(newRecord).forEach(key => {
      if ((newRecord as any)[key] === undefined) delete (newRecord as any)[key];
    });

    setToothRecords([newRecord, ...toothRecords]);
    await saveToothRecordToFirestore(selectedPatientId, newRecord, currentUser.clinicId);
  };

  const handleDeleteToothRecord = async (recordId: string, cost: number = 0) => {
    if (!selectedPatientId || !currentUser?.clinicId) return;
    setToothRecords(toothRecords.filter((r) => r.id !== recordId));
    await deleteToothRecordFromFirestore(selectedPatientId, recordId);
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

  const handleDeletePatientImage = async (imageId: string) => {
    if (!selectedPatientId || !currentUser?.clinicId) return;
    setPatientImages(patientImages.filter((img) => img.id !== imageId));
    await deletePatientImageFromFirestore(selectedPatientId, imageId);
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

  const handleDeletePayment = async (paymentId: string, amount: number) => {
    if (!selectedPatientId || !currentUser?.clinicId) return;
    setPayments(payments.filter((p) => p.id !== paymentId));
    await deletePaymentFromFirestore(selectedPatientId, paymentId);
    if (activePatient) {
      const newBalance = (activePatient.balance || 0) + (amount || 0);
      const updatedPatient = { ...activePatient, balance: newBalance };
      setPatients(patients.map((p) => (p.id === activePatient.id ? updatedPatient : p)));
      await savePatientToFirestore(updatedPatient);
    }
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

  const handleDeleteAppointment = async (appointmentId: string) => {
    setAppointments(appointments.filter((a) => a.id !== appointmentId));
    await deleteAppointmentFromFirestore(appointmentId);
  };

  const handleDeleteLabOrder = async (orderId: string) => {
    setLabOrders(labOrders.filter((o) => o.id !== orderId));
    await deleteLabOrderFromFirestore(orderId);
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: Appointment['status']) => {
    const updatedList = appointments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    setAppointments(updatedList);
    const target = updatedList.find((a) => a.id === id);
    if (target) {
      await saveAppointmentToFirestore(target);
    }
  };

  const handleAddAssistant = async (name: string, phone: string, pass: string) => {
    if (!currentUser?.clinicId) return;
    const cid = currentUser.clinicId;
    const cleanPhone = phone.replace(/\s+/g, '');
    const newAssistant: UserProfile = {
      uid: `user_${Date.now()}`,
      name,
      phone: cleanPhone,
      email: `${cleanPhone}@clinicpro.local`,
      role: 'assistant',
      clinicId: cid,
      initialPassword: pass,
      disabled: false,
      permissions: {
        viewPatients: true,
        editClinical: false,
        editToothChart: false,
        uploadViewImages: false,
        manageAppointments: true,
        viewFinancials: false,
        viewPaymentAmounts: false,
        recordPayments: true,
        manageStaff: false,
        accessSettings: false,
        sendWhatsApp: true
      }
    };

    setStaffList([...staffList, newAssistant]);
    await saveStaffUserToFirestore(newAssistant);
  };

  const handleToggleAssistantStatus = async (ast: UserProfile) => {
    const updated: UserProfile = {
      ...ast,
      disabled: !ast.disabled
    };
    setStaffList(staffList.map((s) => (s.uid === ast.uid ? updated : s)));
    await saveStaffUserToFirestore(updated);
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    setStaffList(staffList.filter((s) => s.uid !== assistantId));
    await deleteStaffUserFromFirestore(assistantId);
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
    if (currentHash.startsWith('#book-')) {
      const targetClinicId = currentHash.replace('#book-', '');
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <PublicBookingModal
            settings={{ ...clinicSettings, clinicId: targetClinicId }}
            doctors={doctors}
            onClose={() => {
              window.location.hash = '';
              setCurrentHash('');
            }}
            onBookAppointment={async (bookingData) => {
              const patientObj: Patient = {
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
                clinicId: targetClinicId,
                createdAt: new Date().toISOString().split('T')[0]
              };
              try { await savePatientToFirestore(patientObj); } catch (e) { console.warn(e); }
              const newApp: Appointment = {
                id: `app_${Date.now()}`,
                patientId: patientObj.id,
                patientName: bookingData.patientName,
                phone: bookingData.phone,
                doctorId: bookingData.doctorId,
                date: bookingData.date,
                time: bookingData.time,
                procedure: bookingData.procedure,
                status: 'scheduled',
                clinicId: targetClinicId,
                notes: 'Self-scheduled via Public Online Booking Portal'
              };
              try { await saveAppointmentToFirestore(newApp); } catch (e) { console.warn(e); }
            }}
          />
        </div>
      );
    }

    return (
      <AuthScreen
        onAuthenticated={(profile) => {
          localStorage.setItem('clinicpro_active_session', JSON.stringify(profile));
          setCurrentUser(profile);
        }}
      />
    );
  }

  // 1. Super Admin Hidden Portal Route
  const isSuperAdminUser =
    currentUser.role === 'super_admin' ||
    currentUser.email === 'replitoo55@gmail.com' ||
    currentUser.email === '203256@eru.edu.eg';

  if (
    activeTab === 'system-admin-portal' ||
    currentHash === '#/system-admin-portal' ||
    window.location.pathname === '/system-admin-portal'
  ) {
    if (isSuperAdminUser) {
      return (
        <SuperAdminPortal
          onExit={() => {
            window.location.hash = '';
            setCurrentHash('');
            setActiveTab('desk');
          }}
        />
      );
    }
  }

  // 2. Suspended Clinic Check
  if (clinicDoc?.status === 'suspended' && !isSuperAdminUser) {
    return <SuspendedClinicScreen clinicName={clinicDoc.name || clinicSettings.name} onLogout={handleSignOut} />;
  }

  // 3. Assistant Role Interface (Foolproof 3-Action UI)
  if (currentUser.role === 'assistant') {
    return (
      <div
        className={`min-h-screen bg-slate-950 text-white font-sans antialiased flex flex-col ${
          lang === 'ar' ? 'rtl' : 'ltr'
        }`}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
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

        <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
          <AssistantDashboard
            currentUser={currentUser}
            clinicSettings={clinicSettings}
            patients={patients}
            appointments={appointments}
            onLogout={handleSignOut}
          />
        </main>

        {showAddPatientModal && (
          <PatientForm
            initialData={editingPatient}
            clinicId={currentUser.clinicId}
            onSubmit={(pData) => {
              handleAddPatient(pData);
            }}
            onClose={() => {
              setShowAddPatientModal(false);
              setEditingPatient(undefined);
            }}
          />
        )}
      </div>
    );
  }

  // 4. Doctor / Admin Full Interface
  const activePatient = selectedPatientId
    ? patients.find((p) => p.id === selectedPatientId) || null
    : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const todayAppointmentsCount = appointments.filter((a) => a.date === todayStr).length;
  const tomorrowAppointmentsCount = appointments.filter((a) => a.date === tomorrowStr).length;
  const activeLabOrdersCount = labOrders.filter((o) => o.status === 'Sent' || o.status === 'In Progress').length;

  const pendingFollowupsCount = patients.filter((p) => {
    const hasUntreated = Object.values(p.toothStatus || {}).some((s) => s === 'needs-treatment');
    const hasFutureApp = appointments.some((a) => a.patientId === p.id && a.date >= todayStr);
    return hasUntreated && !hasFutureApp;
  }).length;

  return (
    <div
      className={`min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col ${
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
            if (tab === 'system-admin-portal') {
              window.location.hash = '#/system-admin-portal';
              setCurrentHash('#/system-admin-portal');
            }
          }}
          permissions={currentUser.permissions}
          clinicSettings={clinicSettings}
          isSuperAdmin={isSuperAdminUser}
          todayAppointmentsCount={todayAppointmentsCount}
          tomorrowAppointmentsCount={tomorrowAppointmentsCount}
          pendingFollowupsCount={pendingFollowupsCount}
          activeLabOrdersCount={activeLabOrdersCount}
        />

        {/* Content Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
          <>
            {/* TAB 1: DESK (HOME) */}
            {activeTab === 'desk' && (
              <DeskPage
                patients={patients}
                appointments={appointments}
                payments={payments}
                doctors={doctors}
                clinicSettings={clinicSettings}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenAddPatient={() => {
                  setEditingPatient(undefined);
                  setShowAddPatientModal(true);
                }}
                onSelectPatient={(pId) => setSelectedPatientId(pId)}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onAddAppointment={handleAddAppointment}
                onAddPayment={handleAddPayment}
                onDeleteAppointment={handleDeleteAppointment}
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
                onDeletePatient={handleDeletePatient}
              />
            )}

            {/* TAB 3: CALENDAR */}
            {activeTab === 'appointments' && (
              <AppointmentsPage
                appointments={appointments}
                patients={patients}
                doctors={doctors}
                onAddAppointment={handleAddAppointment}
                onUpdateStatus={handleUpdateAppointmentStatus}
                onDeleteAppointment={handleDeleteAppointment}
              />
            )}

            {/* TAB 4: OPERATIONS HUB */}
            {activeTab === 'operations' && (
              <OperationsHub
                patients={patients}
                appointments={appointments}
                doctors={doctors}
                labOrders={labOrders}
                clinicSettings={clinicSettings}
                clinicId={currentUser.clinicId}
                onSelectPatient={(pId) => setSelectedPatientId(pId as string)}
              />
            )}

            {/* TAB 8: FINANCIAL REPORTS */}
            {activeTab === 'financials' && (
              <FinancialReportsPage
                payments={payments}
                toothRecords={toothRecords}
                doctors={doctors}
                clinicSettings={clinicSettings}
              />
            )}

            {/* TAB 9: CLINIC SETTINGS & ASSISTANT STAFF */}
            {activeTab === 'settings' && (
              <SettingsPage
                settings={clinicSettings}
                onUpdateSettings={handleUpdateSettings}
                currentUser={currentUser}
                patients={patients}
                appointments={appointments}
                staffList={staffList}
                onAddAssistant={handleAddAssistant}
                onToggleAssistantStatus={handleToggleAssistantStatus}
                onDeleteAssistant={handleDeleteAssistant}
                lang={lang}
                onLanguageChange={(newLang) => setLang(newLang)}
              />
            )}
          </>
        </main>
      </div>

      {/* Slide-over Patient Drawer */}
      {activePatient && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" onClick={() => setSelectedPatientId(null)} />
          <div className="relative w-full max-w-[95vw] lg:max-w-[1400px] h-full bg-slate-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 rounded-l-3xl border-l border-slate-200">
            <div className="p-4 sm:p-6 lg:p-8 min-h-full">
              <PatientProfile
                patient={activePatient}
                toothRecords={toothRecords.filter((r) => r.patientId === activePatient.id)}
                patientImages={patientImages.filter((i) => i.patientId === activePatient.id)}
                payments={payments.filter((p) => p.patientId === activePatient.id)}
                doctors={doctors}
                clinicSettings={clinicSettings}
                labOrders={labOrders}
                onUpdatePatient={handleUpdatePatient}
                onAddToothRecord={handleAddToothRecord}
                onAddPatientImage={handleAddPatientImage}
                onAddPayment={handleAddPayment}
                onDeleteToothRecord={handleDeleteToothRecord}
                onDeletePatientImage={handleDeletePatientImage}
                onDeletePayment={handleDeletePayment}
                onDeletePatient={handleDeletePatient}
                onDeleteLabOrder={handleDeleteLabOrder}
                onBack={() => setSelectedPatientId(null)}
                onEditPatientModalOpen={() => {
                  setEditingPatient(activePatient);
                  setShowAddPatientModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (+ New Patient) */}
      <FloatingActionButton
        onClick={() => {
          setEditingPatient(undefined);
          setShowAddPatientModal(true);
        }}
      />

      {/* Global Add/Edit Patient Modal */}
      {showAddPatientModal && (
        <PatientForm
          initialData={editingPatient}
          clinicId={currentUser.clinicId}
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

      {/* Public Online Booking Modal */}
      {showPublicBookingModal && (
        <PublicBookingModal
          settings={clinicSettings}
          doctors={doctors}
          onClose={() => setShowPublicBookingModal(false)}
          onBookAppointment={async (bookingData) => {
            let patientObj = patients.find((p) => p.phone === bookingData.phone);
            if (!patientObj) {
              patientObj = {
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
              setPatients((prev) => [patientObj!, ...prev]);
              await savePatientToFirestore(patientObj);
            }

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
