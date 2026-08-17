import React from 'react';
import { FileText, ArrowLeft, ShieldAlert, CheckCircle, Scale } from 'lucide-react';

interface TermsOfServiceProps {
  onBack?: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Terms of Service</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ClinicPro Egypt • Terms & Conditions of Application Use
              </p>
            </div>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to App
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-slate-600 leading-relaxed font-medium">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-sky-600" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using ClinicPro Egypt, you agree to comply with these Terms of Service. ClinicPro is provided to licensed dental practitioners and clinical staff for managing dental records, appointments, and clinic operations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-sky-600" /> 2. License & Account Responsibility
            </h2>
            <p>
              Clinic account holders are responsible for maintaining the confidentiality of login credentials and for all activities conducted under their registered account. Multi-user accounts must ensure staff members (assistants, receptionists) hold appropriate permission levels.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-sky-600" /> 3. Service Availability & Offline Operations
            </h2>
            <p>
              ClinicPro includes Progressive Web App (PWA) offline synchronization capabilities powered by IndexedDB local caching. While offline mode allows continuous local recording, clinic staff must reconnect to the internet periodically to sync records across all devices.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Modifications to Service</h2>
            <p>
              ClinicPro reserves the right to update software features, security standards, or system configurations to maintain optimal performance and compliance with regional medical standards.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
            Last Updated: August 2026 • ClinicPro Dental Management System • Cairo, Egypt
          </div>
        </div>

      </div>
    </div>
  );
};
