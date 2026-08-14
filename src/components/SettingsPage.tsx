import React, { useState } from 'react';
import { ClinicSettings } from '../types';
import { Settings, Globe, MapPin, Link2, ShieldCheck, Database, CheckCircle2, Copy } from 'lucide-react';

interface SettingsPageProps {
  settings: ClinicSettings;
  onUpdateSettings: (updated: ClinicSettings) => void;
  lang: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  lang,
  onLanguageChange
}) => {
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [multiBranchEnabled, setMultiBranchEnabled] = useState(settings.multiBranchEnabled);
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(settings.onlineBookingEnabled);
  const [copied, setCopied] = useState(false);

  const publicBookingUrl = `https://clinical-mang.web.app/book/${settings.clinicId || 'cairo'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicBookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      multiBranchEnabled,
      onlineBookingEnabled
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Practice & System Configuration</h2>
            <p className="text-xs text-slate-500">Manage clinic profile, language, multi-branch, and online booking</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-sm font-medium">
          {/* Clinic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinic Branding & Address</h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinic Center Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Address Location *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinic Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-600" /> Interface Language & Layout Direction
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`p-4 rounded-2xl border text-left font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <p className="text-base">English (Primary)</p>
                <p className="text-xs opacity-80 mt-0.5">LTR Layout • Dental terms in English</p>
              </button>

              <button
                type="button"
                onClick={() => onLanguageChange('ar')}
                className={`p-4 rounded-2xl border text-right font-bold transition-all ${
                  lang === 'ar'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <p className="text-base">العربية (Arabic)</p>
                <p className="text-xs opacity-80 mt-0.5">RTL Layout • مصطلحات الأسنان بالإنجليزية</p>
              </button>
            </div>
          </div>

          {/* Multi-Branch Mode Switcher */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="space-y-0.5">
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" /> Multi-Branch Support Mode
                </span>
                <p className="text-xs text-slate-500">
                  Enable multi-branch management UI (default: Off for single location)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMultiBranchEnabled(!multiBranchEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  multiBranchEnabled ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform"></span>
              </button>
            </div>
          </div>

          {/* Public Online Booking Link Toggle */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="space-y-0.5">
                <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-sky-600" /> Public Online Appointment Booking Link
                </span>
                <p className="text-xs text-slate-500">
                  Allow patients to request appointments online via direct shareable link
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOnlineBookingEnabled(!onlineBookingEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  onlineBookingEnabled ? 'bg-sky-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform"></span>
              </button>
            </div>

            {onlineBookingEnabled && (
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200/80 flex items-center justify-between gap-2 text-xs">
                <span className="font-mono text-sky-900 truncate">{publicBookingUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg font-bold shrink-0 hover:bg-sky-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            )}
          </div>

          {/* Offline & Firebase Status Info */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Database className="w-4 h-4 text-emerald-600" /> Firebase Offline Cache Active
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Firestore offline persistence (IndexedDB) is enabled. Your clinic records, dental charts, and payments will keep working even during Cairo internet outages, syncing automatically once reconnected.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-sky-600 text-white rounded-xl font-extrabold text-sm hover:bg-sky-700 shadow-md transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
