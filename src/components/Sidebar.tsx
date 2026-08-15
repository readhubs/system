import React from 'react';
import {
  Users,
  Calendar,
  Settings,
  LayoutDashboard,
  LogOut,
  MapPin,
  ClipboardList,
  DollarSign,
  Layers,
  Activity
} from 'lucide-react';
import { ClinicSettings, UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  permissions: UserProfile['permissions'];
  clinicSettings: ClinicSettings;
  todayAppointmentsCount?: number;
  tomorrowAppointmentsCount?: number;
  pendingFollowupsCount?: number;
  activeLabOrdersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  permissions,
  clinicSettings,
  todayAppointmentsCount,
  tomorrowAppointmentsCount,
  pendingFollowupsCount,
  activeLabOrdersCount
}) => {
  const navItems = [
    {
      id: 'desk',
      label: 'Desk',
      icon: LayoutDashboard,
      visible: true
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      visible: permissions.viewPatients
    },
    {
      id: 'appointments',
      label: 'Calendar',
      icon: Calendar,
      badge: todayAppointmentsCount ? todayAppointmentsCount : undefined,
      visible: true
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Activity,
      badge: (activeLabOrdersCount || 0) + (pendingFollowupsCount || 0) > 0 ? (activeLabOrdersCount || 0) + (pendingFollowupsCount || 0) : undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      visible: permissions.editClinical !== false
    },
    {
      id: 'financials',
      label: 'Financials',
      icon: DollarSign,
      visible: permissions.viewFinancials
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      visible: permissions.accessSettings
    }
  ];

  return (
    <aside className="w-full md:w-56 bg-transparent border-r border-slate-200/50 p-4 space-y-4 shrink-0 no-print">
      <nav className="space-y-1">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      item.badgeColor || (isActive ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/50 text-slate-500')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* Multi-Branch Section */}
      {clinicSettings.multiBranchEnabled && (
        <div className="pt-4 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Branches
          </p>

          {clinicSettings.branches?.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{b.name}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
