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
  Activity,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ClinicSettings, UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  permissions: UserProfile['permissions'];
  clinicSettings: ClinicSettings;
  isSuperAdmin?: boolean;
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
  isSuperAdmin,
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

      {/* Super Admin Access Button (Strictly visible only to super_admin or designated email) */}
      {isSuperAdmin && (
        <div className="pt-2 border-t border-slate-200/60">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/system-admin-portal';
              onTabChange('system-admin-portal');
            }}
            className="w-full group p-3 rounded-2xl bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500/50 hover:border-purple-400 text-left shadow-lg shadow-purple-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-black text-purple-300 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-purple-400 animate-pulse" />
                Super Admin
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-400 ring-4 ring-purple-400/20"></span>
            </div>
            <p className="text-xs font-black text-white group-hover:text-purple-200 transition-colors">
              🛡️ Super Admin Portal
            </p>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              Manage all SaaS tenants & plans
            </p>
          </button>
        </div>
      )}

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
