import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Stethoscope, Lock, Mail, Building, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!doctorName.trim() || !clinicName.trim()) {
          throw new Error('Please enter your full name and clinic name.');
        }

        // 1. Create Auth Account
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCred.user.uid;
        const generatedClinicId = `clinic_${Date.now()}`;

        // 2. Doctor User Profile Document
        const doctorProfile: UserProfile = {
          uid,
          name: doctorName.trim().startsWith('Dr.') ? doctorName.trim() : `Dr. ${doctorName.trim()}`,
          email: email.trim(),
          role: 'doctor',
          specialty: specialty.trim(),
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

        // 3. Clinic Settings Document
        const initialSettings: ClinicSettings = {
          clinicId: generatedClinicId,
          name: clinicName.trim(),
          address: 'Cairo / Giza, Egypt',
          phone: '01012345678',
          languageDefault: 'en',
          multiBranchEnabled: false,
          onlineBookingEnabled: false,
          branches: [
            { id: `b_main_${Date.now()}`, name: `${clinicName.trim()} - Main Branch`, address: 'Main Branch' }
          ]
        };

        // Write user, clinic, settings documents to Firestore with offline resilience
        try {
          await setDoc(doc(db, 'users', uid), doctorProfile);
          await setDoc(doc(db, 'clinics', generatedClinicId), {
            clinicId: generatedClinicId,
            name: clinicName.trim(),
            ownerUid: uid,
            createdAt: new Date().toISOString()
          });
          await setDoc(doc(db, 'settings', generatedClinicId), initialSettings);
        } catch (dbErr) {
          console.warn('Firestore initial profile sync note (will sync when online):', dbErr);
        }

        // Cache local profile in localStorage for instant offline access
        localStorage.setItem(`clinicpro_user_${uid}`, JSON.stringify(doctorProfile));
        localStorage.setItem('clinicpro_active_session', JSON.stringify(doctorProfile));
        onAuthenticated(doctorProfile);
      } else {
        // Sign In
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCred.user.uid;

        // Fetch user profile from Firestore with offline error protection
        let profileData: UserProfile | null = null;
        try {
          const userDocRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            profileData = userSnap.data() as UserProfile;
          }
        } catch (fetchErr) {
          console.warn('Could not read user profile from cloud Firestore directly:', fetchErr);
          // Check local storage cached profile
          const cached = localStorage.getItem(`clinicpro_user_${uid}`);
          if (cached) {
            try {
              profileData = JSON.parse(cached);
            } catch (e) {
              // ignore parse error
            }
          }
        }

        if (profileData) {
          localStorage.setItem(`clinicpro_user_${uid}`, JSON.stringify(profileData));
          localStorage.setItem('clinicpro_active_session', JSON.stringify(profileData));
          onAuthenticated(profileData);
        } else {
          // Construct fallback doctor profile if doc is not retrieved
          const fallbackProfile: UserProfile = {
            uid,
            name: userCred.user.displayName || email.split('@')[0] || 'Doctor',
            email: email.trim(),
            role: 'doctor',
            clinicId: `clinic_${uid.slice(0, 8)}`,
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
          localStorage.setItem(`clinicpro_user_${uid}`, JSON.stringify(fallbackProfile));
          localStorage.setItem('clinicpro_active_session', JSON.stringify(fallbackProfile));
          onAuthenticated(fallbackProfile);
        }
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

  const handleOfflinePracticeBypass = () => {
    const demoDoctor: UserProfile = {
      uid: 'offline_doctor_demo',
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
    localStorage.setItem('clinicpro_user_offline_doctor_demo', JSON.stringify(demoDoctor));
    localStorage.setItem('clinicpro_active_session', JSON.stringify(demoDoctor));
    onAuthenticated(demoDoctor);
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
            Dental Practice & Clinical Management System
          </p>

          <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-extrabold bg-sky-900/40 text-sky-200 px-2.5 py-1 rounded-full border border-white/10">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Firebase Auth
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
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
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
                  <p className="text-[10px] text-rose-600 font-medium text-center">
                    (You can still manage patients, tooth charts, and financial reports locally)
                  </p>
                </div>
              )}
            </div>
          )}

          {isSignUp && (
            <>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="doctor@clinicpro.eg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-sky-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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

          {!isSignUp && (
            <p className="text-[11px] text-slate-400 text-center pt-2">
              Staff & Assistant accounts are created by the Doctor inside the <span className="font-bold text-slate-600">Staff Management</span> section.
            </p>
          )}
        </form>
      </div>

      <div className="mt-6 text-center text-slate-400 text-[11px] space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Encrypted Authentication & Local Offline Persistence Active
        </p>
      </div>
    </div>
  );
};
