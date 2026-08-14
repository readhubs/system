import React from 'react';
import { UserProfile, ClinicSettings } from '../types';
import { Globe, Download, Wifi, WifiOff, Stethoscope, User, LogOut } from 'lucide-react';

interface NavbarProps {
  clinicSettings: ClinicSettings;
  userProfile: UserProfile;
  lang: 'en' | 'ar';
  onLanguageToggle: () => void;
  isOnline: boolean;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  onSwitchUserRole?: (role: UserProfile['role']) => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  clinicSettings,
  userProfile,
  lang,
  onLanguageToggle,
  isOnline,
  canInstallPWA,
  onInstallPWA,
  onSwitchUserRole,
  onSignOut
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Clinic Name */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-md shadow-sky-600/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              {clinicSettings.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                ClinicPro PWA
              </span>

              {/* Online / Offline Indicator */}
              <span
                className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
                title={isOnline ? 'Online Sync Active' : 'Offline Mode Active (Cached)'}
              >
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
                {isOnline ? 'Online' : 'Offline Cache'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Menu Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          {canInstallPWA && (
            <button
              type="button"
              onClick={onInstallPWA}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl font-extrabold text-xs shadow-sm hover:opacity-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install PWA</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            type="button"
            onClick={onLanguageToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* User Profile Badge & Logout Button */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 pl-3 rounded-2xl border border-slate-200">
            <div className="text-right hidden md:block">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">{userProfile.name}</p>
              <p className="text-[10px] font-bold text-slate-500 capitalize">{userProfile.role}</p>
            </div>

            <div
              className={`p-2 rounded-xl text-xs font-bold ${
                userProfile.role === 'doctor'
                  ? 'bg-sky-600 text-white'
                  : 'bg-purple-600 text-white'
              }`}
            >
              <User className="w-4 h-4" />
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-extrabold text-xs transition-colors"
                title="Log out of Firebase session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
