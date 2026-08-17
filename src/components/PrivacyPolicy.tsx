import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, UserCheck } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Privacy Policy</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                ClinicPro Egypt • Patient Data Protection & Compliance Policy
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
              <Lock className="w-5 h-5 text-sky-600" /> 1. Commitment to Health Data Confidentiality
            </h2>
            <p>
              ClinicPro Egypt operates as a cloud-hosted Dental Practice Management system. We recognize the sensitive nature of patient dental records, diagnostic radiographs, medical histories, and personal contact details. All patient information processed within ClinicPro is strictly isolated per clinic account using Google Cloud Firestore security controls.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-600" /> 2. Information Collection & Cloud Storage
            </h2>
            <p>
              We collect and process only the clinical and administrative data provided directly by authorized clinic staff. This includes patient demographics, appointment dates, odontogram records, dental procedure logs, billing entries, and diagnostic radiograph files. All data is stored with TLS/SSL encryption in transit and AES-256 encryption at rest.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-sky-600" /> 3. Data Isolation & Non-Disclosure
            </h2>
            <p>
              ClinicPro enforces multi-tenant row-level access control. Patient data recorded by your clinic is strictly partitioned and inaccessible to any other clinic, third party, or unauthorized personnel. ClinicPro does not sell, trade, or share patient information under any circumstances.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-600" /> 4. Patient Rights & Data Portability
            </h2>
            <p>
              Dentists and authorized clinic administrators retain 100% ownership of their data. You can export complete patient records, financial ledgers, and appointment data to CSV or Excel at any time through the Settings panel.
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
