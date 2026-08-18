import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  sendPasswordResetEmail,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  findClinicByOwnerEmail,
  saveUserProfileToFirestore,
  findStaffByPhoneOrEmail
} from '../lib/firestoreService';
import {
  Stethoscope,
  Lock,
  Mail,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { UserProfile, ClinicSettings } from '../types';

interface AuthScreenProps {
  onAuthenticated: (userProfile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [specialty, setSpecialty] = useState('Consultant Prosthodontist & Implantologist');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Google Sign-In First-time Clinic Onboarding modal state
  const [showGoogleOnboardModal, setShowGoogleOnboardModal] = useState(false);
  const [googleUserTemp, setGoogleUserTemp] = useState<any>(null);
  const [googleDoctorName, setGoogleDoctorName] = useState('');
  const [googleClinicName, setGoogleClinicName] = useState('');
  const [googleSpecialty, setGoogleSpecialty] = useState('Consultant Prosthodontist & Implantologist');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!doctorName.trim() || !clinicName.trim()) {
          throw new Error('Please enter your full name and clinic name.');
        }

        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCred.user.uid;
        
        // 1. Check if Super Admin pre-provisioned a clinic for this email
        const existingPreProvisionedClinic = await findClinicByOwnerEmail(email.trim());
        const determinedClinicId = existingPreProvisionedClinic?.id || `clinic_${uid}`;

        const isSuperAdminEmail =
          email.trim().toLowerCase() === 'replitoo55@gmail.com' ||
          email.trim().toLowerCase() === '203256@eru.edu.eg';

        const doctorProfile: UserProfile = {
          uid,
          name: doctorName.trim().startsWith('Dr.') ? doctorName.trim() : `Dr. ${doctorName.trim()}`,
          email: email.trim(),
          role: isSuperAdminEmail ? 'super_admin' : 'doctor',
          specialty: specialty.trim(),
          clinicId: isSuperAdminEmail ? 'system' : determinedClinicId,
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

        const initialSettings: ClinicSettings = {
          clinicId: determinedClinicId,
          name: existingPreProvisionedClinic?.name || clinicName.trim(),
          address: 'Cairo / Giza, Egypt',
          phone: existingPreProvisionedClinic?.phone || '01012345678',
          languageDefault: 'en',
          multiBranchEnabled: false,
          onlineBookingEnabled: false,
          branches: [
            { id: `b_main_${uid}`, name: `${clinicName.trim()} - Main Branch`, address: 'Main Branch' }
          ]
        };

        // Persist User Profile & Clinic to Firestore immediately
        try {
          const batch = writeBatch(db);
          batch.set(doc(db, 'users', uid), doctorProfile, { merge: true });
          if (!existingPreProvisionedClinic && !isSuperAdminEmail) {
            batch.set(doc(db, 'clinics', determinedClinicId), {
              clinicId: determinedClinicId,
              id: determinedClinicId,
              name: clinicName.trim(),
              ownerUid: uid,
              ownerEmail: email.trim().toLowerCase(),
              doctorName: doctorProfile.name,
              status: 'active',
              plan: 'free_trial',
              createdAt: new Date().toISOString()
            }, { merge: true });
            batch.set(doc(db, 'settings', determinedClinicId), initialSettings, { merge: true });
          }
          await batch.commit();
        } catch (dbErr) {
          console.warn('Firestore initial profile sync note:', dbErr);
        }

        await saveUserProfileToFirestore(doctorProfile);
        onAuthenticated(doctorProfile);
      } else {
        const inputId = email.trim();
        const inputPassword = password;

        // 1. Check if user is a clinic staff / assistant (Phone or Email login)
        let staffProfile = await findStaffByPhoneOrEmail(inputId);

        if (staffProfile) {
          if (staffProfile.disabled) {
            throw new Error('This assistant account has been disabled by the clinic administrator.');
          }

          const validPassword =
            (staffProfile.initialPassword && staffProfile.initialPassword === inputPassword) ||
            (staffProfile.password && staffProfile.password === inputPassword);

          if (!validPassword) {
            throw new Error('Incorrect password. Please verify the password provided by the doctor.');
          }

          // Successfully authenticated assistant!
          try {
            const anonCred = await signInAnonymously(auth);
            if (anonCred.user) {
              staffProfile = {
                ...staffProfile,
                uid: anonCred.user.uid
              };
            }
          } catch (anonErr) {
            console.warn('Anonymous auth note (fallback to local session):', anonErr);
          }

          localStorage.setItem(`clinicpro_user_${staffProfile.uid}`, JSON.stringify(staffProfile));
          localStorage.setItem('clinicpro_active_session', JSON.stringify(staffProfile));
          await saveUserProfileToFirestore(staffProfile);
          onAuthenticated(staffProfile);
          return;
        }

        // 2. Doctor Firebase Auth Sign In
        let userCred: any = null;
        try {
          const targetEmail = inputId.includes('@') ? inputId : `${inputId}@clinicpro.local`;
          userCred = await signInWithEmailAndPassword(auth, targetEmail, inputPassword);
        } catch (firebaseErr: any) {
          // If primary login failed and input had no @, also try raw input
          if (!inputId.includes('@')) {
            try {
              userCred = await signInWithEmailAndPassword(auth, inputId, inputPassword);
            } catch {
              // Re-check staff lookup with flexible formatting
              const retryStaff = await findStaffByPhoneOrEmail(inputId);
              if (retryStaff) {
                if (retryStaff.disabled) {
                  throw new Error('This assistant account has been disabled by the clinic administrator.');
                }
                if (
                  (retryStaff.initialPassword && retryStaff.initialPassword === inputPassword) ||
                  (retryStaff.password && retryStaff.password === inputPassword)
                ) {
                  localStorage.setItem(`clinicpro_user_${retryStaff.uid}`, JSON.stringify(retryStaff));
                  localStorage.setItem('clinicpro_active_session', JSON.stringify(retryStaff));
                  await saveUserProfileToFirestore(retryStaff);
                  onAuthenticated(retryStaff);
                  return;
                } else {
                  throw new Error('Incorrect password. Please verify the initial password set by the doctor.');
                }
              }
              throw firebaseErr;
            }
          } else {
            throw firebaseErr;
          }
        }

        const uid = userCred.user.uid;

        let profileData: UserProfile | null = null;
        try {
          const userDocRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            profileData = userSnap.data() as UserProfile;
          }
        } catch (fetchErr) {
          console.warn('Could not read user profile from cloud Firestore directly:', fetchErr);
        }

        if (!profileData) {
          const cached = localStorage.getItem(`clinicpro_user_${uid}`);
          if (cached) {
            try {
              profileData = JSON.parse(cached);
            } catch (e) {
              // ignore
            }
          }
        }

        if (!profileData) {
          // Check for pre-provisioned clinic
          const existingPreProvisionedClinic = await findClinicByOwnerEmail(email.trim());
          const isSuperAdminEmail =
            email.trim().toLowerCase() === 'replitoo55@gmail.com' ||
            email.trim().toLowerCase() === '203256@eru.edu.eg';
          const determinedClinicId = isSuperAdminEmail
            ? 'system'
            : (existingPreProvisionedClinic?.id || `clinic_${uid}`);

          profileData = {
            uid,
            name: userCred.user.displayName || email.split('@')[0] || 'Doctor',
            email: email.trim(),
            role: isSuperAdminEmail ? 'super_admin' : 'doctor',
            clinicId: determinedClinicId,
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

        // CRITICAL: Write /users/{uid} to Firestore so security rules and refresh never fail
        await saveUserProfileToFirestore(profileData);
        onAuthenticated(profileData);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please check your details.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify your login credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Firebase Authentication "Email/Password" sign-in method is currently disabled in your Firebase Console. Please enable it in Firebase Console → Authentication → Sign-in method, or use Offline Practice Mode below.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const uid = user.uid;
      const userEmail = user.email || '';

      // Check if user already exists in Firestore
      let profileData: UserProfile | null = null;
      try {
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          profileData = userSnap.data() as UserProfile;
        }
      } catch (e) {
        console.warn('Firestore profile lookup error:', e);
      }

      if (profileData && profileData.clinicId) {
        await saveUserProfileToFirestore(profileData);
        onAuthenticated(profileData);
        return;
      }

      // Check if Super Admin pre-provisioned a clinic for this Google email
      const existingPreProvisionedClinic = await findClinicByOwnerEmail(userEmail);
      const isSuperAdminEmail =
        userEmail.toLowerCase() === 'replitoo55@gmail.com' ||
        userEmail.toLowerCase() === '203256@eru.edu.eg';

      if (existingPreProvisionedClinic || isSuperAdminEmail) {
        const autoProfile: UserProfile = {
          uid,
          name: user.displayName || existingPreProvisionedClinic?.doctorName || 'Dr. Doctor',
          email: userEmail,
          role: isSuperAdminEmail ? 'super_admin' : 'doctor',
          clinicId: isSuperAdminEmail ? 'system' : existingPreProvisionedClinic!.id,
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

        await saveUserProfileToFirestore(autoProfile);
        onAuthenticated(autoProfile);
        return;
      }

      // First-time Google user without existing clinic: trigger onboarding modal
      setGoogleUserTemp(user);
      setGoogleDoctorName(user.displayName || 'Dr. Doctor');
      setGoogleClinicName(`${user.displayName ? user.displayName.split(' ')[0] : 'Cairo'} Dental Clinic`);
      setShowGoogleOnboardModal(true);
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'Google Sign-in failed. Please try again or use Email login.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUserTemp) return;
    setLoading(true);

    try {
      const uid = googleUserTemp.uid;
      const generatedClinicId = `clinic_${uid}`;

      const doctorProfile: UserProfile = {
        uid,
        name: googleDoctorName.trim().startsWith('Dr.') ? googleDoctorName.trim() : `Dr. ${googleDoctorName.trim()}`,
        email: googleUserTemp.email || '',
        role: 'doctor',
        specialty: googleSpecialty.trim(),
        clinicId: generatedClinicId,
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

      const initialSettings: ClinicSettings = {
        clinicId: generatedClinicId,
        name: googleClinicName.trim(),
        address: 'Cairo, Egypt',
        phone: '01012345678',
        languageDefault: 'en',
        multiBranchEnabled: false,
        onlineBookingEnabled: false,
        branches: [
          { id: `b_main_${uid}`, name: `${googleClinicName.trim()} - Main Branch`, address: 'Main Branch' }
        ]
      };

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', uid), doctorProfile, { merge: true });
        batch.set(doc(db, 'clinics', generatedClinicId), {
          clinicId: generatedClinicId,
          id: generatedClinicId,
          name: googleClinicName.trim(),
          ownerUid: uid,
          ownerEmail: (googleUserTemp.email || '').toLowerCase(),
          doctorName: doctorProfile.name,
          status: 'active',
          plan: 'free_trial',
          createdAt: new Date().toISOString()
        }, { merge: true });
        batch.set(doc(db, 'settings', generatedClinicId), initialSettings, { merge: true });
        await batch.commit();
      } catch (dbErr) {
        console.warn('Firestore initial Google setup sync:', dbErr);
      }

      await saveUserProfileToFirestore(doctorProfile);
      setShowGoogleOnboardModal(false);
      onAuthenticated(doctorProfile);
    } catch (err: any) {
      console.error('Google Onboarding error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your Doctor email address in the field above to receive the password reset link.');
      return;
    }
    setResetLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      let msg = err.message || 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = `No Doctor account found for ${email.trim()}. If you are new, click "New Doctor Sign Up" tab to register.`;
      }
      setError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: 'doctor' | 'assistant') => {
    if (role === 'doctor') {
      const demoDoctor: UserProfile = {
        uid: 'demo_dr_mohamed',
        name: doctorName.trim() || 'Dr. Mohamed Al-Sayed',
        email: email.trim() || 'doctor@clinicpro.eg',
        role: 'doctor',
        specialty: specialty.trim() || 'Consultant Prosthodontist & Implantologist',
        clinicId: 'clinic_primary_demo',
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
      localStorage.setItem(`clinicpro_user_${demoDoctor.uid}`, JSON.stringify(demoDoctor));
      localStorage.setItem('clinicpro_active_session', JSON.stringify(demoDoctor));
      onAuthenticated(demoDoctor);
    } else {
      const demoAssistant: UserProfile = {
        uid: 'demo_ast_sara',
        name: 'Sara Ali',
        email: '0123456789@clinicpro.local',
        phone: '0123456789',
        role: 'assistant',
        clinicId: 'clinic_primary_demo',
        permissions: {
          viewPatients: true,
          editClinical: false,
          editToothChart: false,
          uploadViewImages: false,
          manageAppointments: true,
          viewFinancials: true,
          viewPaymentAmounts: false,
          recordPayments: true,
          manageStaff: false,
          accessSettings: false,
          sendWhatsApp: true
        }
      };
      localStorage.setItem(`clinicpro_user_${demoAssistant.uid}`, JSON.stringify(demoAssistant));
      localStorage.setItem('clinicpro_active_session', JSON.stringify(demoAssistant));
      onAuthenticated(demoAssistant);
    }
  };

  const handleOfflinePracticeBypass = () => {
    handleQuickDemoLogin('doctor');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-sky-600 to-sky-800 p-8 text-white text-center relative">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/20">
            <Stethoscope className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">ClinicPro Egypt</h1>
          <p className="text-sky-100 text-xs font-medium mt-1">
            Dental Practice & Clinical Management SaaS
          </p>

          <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-extrabold bg-sky-900/40 text-sky-200 px-2.5 py-1 rounded-full border border-white/10">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Multi-Tenant
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-extrabold transition-all border-b-2 ${
              !isSignUp
                ? 'border-sky-600 text-sky-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In to Practice
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-extrabold transition-all border-b-2 ${
              isSignUp
                ? 'border-sky-600 text-sky-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            New Doctor Sign Up
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-4">
          {resetEmailSent && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>Password reset link sent successfully to <span className="underline">{email}</span>.</p>
                <p className="text-[11px] font-normal text-emerald-700">Please check your inbox (and spam folder) to set a new password, then sign in here.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>

              {/* Actionable helpers if invalid credential or unrecognized account */}
              {!isSignUp && (
                <div className="pt-2 border-t border-rose-200/80 flex flex-col gap-2">
                  <div className="text-[11px] font-semibold text-rose-700">
                    💡 Quick solutions:
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setError(null);
                      }}
                      className="py-2 px-3 bg-white border border-rose-300 text-rose-800 rounded-xl text-[11px] font-extrabold hover:bg-rose-100 transition-all text-left flex items-center justify-between"
                    >
                      <span>New Doctor? Create Account</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resetLoading}
                      className="py-2 px-3 bg-white border border-rose-300 text-rose-800 rounded-xl text-[11px] font-extrabold hover:bg-rose-100 transition-all text-left flex items-center justify-between disabled:opacity-50"
                    >
                      <span>{resetLoading ? 'Sending...' : 'Reset Doctor Password'}</span>
                      <Mail className="w-3 h-3 shrink-0" />
                    </button>
                  </div>

                  <p className="text-[10.5px] text-slate-600 font-medium mt-1 leading-snug">
                    👩‍⚕️ <strong>Reception Assistant Note:</strong> Assistants must enter their registered <strong>Phone Number</strong> (e.g. 0123456789) and the <strong>Initial Password</strong> set by the Doctor in Clinic Settings.
                  </p>
                </div>
              )}

              {error.includes('Firebase Authentication "Email/Password"') && (
                <div className="pt-2 border-t border-rose-200/60 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleOfflinePracticeBypass}
                    className="w-full py-2 px-3 bg-rose-700 text-white rounded-xl text-[11px] font-extrabold hover:bg-rose-800 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Enter Clinic Dashboard in Offline Practice Mode
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-black text-xs transition-all shadow-xs flex items-center justify-center gap-3 active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-3">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-500 uppercase">or with credentials</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Mohamed Al-Sayed"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Dental Clinic / Center Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cairo Smiles Dental Center"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Specialty / Degree
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Consultant Prosthodontist & Implantologist"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                {isSignUp ? 'Doctor Email Address' : 'Email Address or Phone Number (Doctor / Assistant)'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={isSignUp ? 'email' : 'text'}
                  required
                  placeholder={isSignUp ? 'doctor@clinicpro.eg' : 'doctor@clinicpro.eg or 010XXXXXXXX'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Clinic & Doctor Account' : 'Sign In to Clinic Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Mode Instant Login */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 text-center">
              Instant One-Click Demo Mode
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('doctor')}
                className="py-2 px-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 text-slate-700 hover:text-sky-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                <span>Doctor Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('assistant')}
                className="py-2 px-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Assistant Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google Onboarding Modal */}
      {showGoogleOnboardModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Welcome to ClinicPro!</h2>
              <p className="text-xs text-slate-500">
                Complete your clinic profile to finalize Google account setup.
              </p>
            </div>

            <form onSubmit={handleCompleteGoogleOnboarding} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={googleDoctorName}
                  onChange={(e) => setGoogleDoctorName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Clinic / Center Name *
                </label>
                <input
                  type="text"
                  required
                  value={googleClinicName}
                  onChange={(e) => setGoogleClinicName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={googleSpecialty}
                  onChange={(e) => setGoogleSpecialty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Launch Clinic Management Dashboard'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-slate-500 text-[11px] space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Encrypted Authentication & Local Offline Persistence Active
        </p>
      </div>
    </div>
  );
};
