import React from 'react';
import { PermissionsMap, ClinicSettings } from '../types';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Settings,
  MapPin
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  permissions: PermissionsMap;
  clinicSettings: ClinicSettings;
  todayAppointmentsCount?: number;
  pendingFollowupsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  permissions,
  clinicSettings,
  todayAppointmentsCount = 0,
  pendingFollowupsCount = 0
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true
    },
    {
      id: 'patients',
      label: 'Patients & Tooth Chart',
      icon: Users,
      visible: permissions.viewPatients
    },
    {
      id: 'appointments',
      label: 'Schedule & Reminders',
      icon: Calendar,
      badge: todayAppointmentsCount > 0 ? todayAppointmentsCount : undefined,
      visible: permissions.manageAppointments
    },
    {
      id: 'smart-scheduler',
      label: 'Smart Follow-ups',
      icon: Sparkles,
      badge: pendingFollowupsCount > 0 ? pendingFollowupsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
      visible: permissions.manageAppointments
    },
    {
      id: 'financials',
      label: 'Financial Reports',
      icon: DollarSign,
      visible: permissions.viewFinancials
    },
    {
      id: 'staff',
      label: 'Staff Permissions',
      icon: ShieldCheck,
      visible: permissions.manageStaff
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      visible: permissions.accessSettings
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 p-4 space-y-6 shrink-0 no-print">
      <nav className="space-y-1.5">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-extrabold text-xs transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-white text-sky-800' : 'bg-sky-100 text-sky-800')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Multi-Branch Section (Hidden unless enabled in settings) */}
      {clinicSettings.multiBranchEnabled && (
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Clinic Branches
          </p>

          {clinicSettings.branches?.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200/60"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">{b.name}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
