import React, { useState } from 'react';
import { UserProfile, PermissionsMap, Role } from '../types';
import { ShieldCheck, UserCheck, Key, Lock, CheckCircle, Plus } from 'lucide-react';

interface StaffManagementPageProps {
  staffList: UserProfile[];
  onUpdateStaffPermissions: (uid: string, permissions: PermissionsMap) => void;
  onAddStaffMember: (newStaff: UserProfile) => void;
  currentUserRole: Role;
}

const PERMISSION_CONFIG: { id: keyof PermissionsMap; label: string; desc: string }[] = [
  { id: 'viewPatients', label: 'View Patients', desc: 'Search and open patient demographic files' },
  { id: 'editClinical', label: 'Edit Clinical Records', desc: 'Create and edit patient demographic data' },
  { id: 'editToothChart', label: 'Manage Tooth Chart', desc: 'Record procedures on interactive dental chart' },
  { id: 'uploadViewImages', label: 'Upload & View Radiographs', desc: 'Upload X-rays, OPG, CBCT and use image tools' },
  { id: 'manageAppointments', label: 'Manage Schedule', desc: 'Book, confirm and reschedule appointments' },
  { id: 'viewFinancials', label: 'View Financial Reports', desc: 'Access revenue stats and profit reports' },
  { id: 'viewPaymentAmounts', label: 'View Payment Amounts', desc: 'View payment totals and patient balances' },
  { id: 'recordPayments', label: 'Record Payments', desc: 'Collect cash/InstaPay and issue receipts' },
  { id: 'manageStaff', label: 'Manage Staff & Permissions', desc: 'Grant or revoke staff permissions' },
  { id: 'accessSettings', label: 'Access Clinic Settings', desc: 'Configure multi-branch and booking links' },
  { id: 'sendWhatsApp', label: 'Send WhatsApp Reminders', desc: 'Trigger wa.me reminder messages' }
];

export const StaffManagementPage: React.FC<StaffManagementPageProps> = ({
  staffList,
  onUpdateStaffPermissions,
  onAddStaffMember,
  currentUserRole
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('assistant');
  const [specialty, setSpecialty] = useState('Clinical Receptionist');

  const handleTogglePermission = (staff: UserProfile, permId: keyof PermissionsMap) => {
    if (staff.role === 'doctor') return; // Doctor cannot be locked out

    const updatedPermissions: PermissionsMap = {
      ...staff.permissions,
      [permId]: !staff.permissions[permId]
    };

    onUpdateStaffPermissions(staff.uid, updatedPermissions);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const defaultPerms: PermissionsMap = {
      viewPatients: true,
      editClinical: role === 'doctor',
      editToothChart: role === 'doctor',
      uploadViewImages: true,
      manageAppointments: true,
      viewFinancials: role === 'doctor',
      viewPaymentAmounts: role === 'doctor',
      recordPayments: true,
      manageStaff: role === 'doctor',
      accessSettings: role === 'doctor',
      sendWhatsApp: true
    };

    onAddStaffMember({
      uid: `staff_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      specialty: specialty.trim(),
      clinicId: 'clinic_cairo_1',
      permissions: defaultPerms
    });

    setShowAddModal(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600" /> Staff Accounts & Granular Permissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Doctor has full access; Assistant staff permissions can be individually toggled
          </p>
        </div>

        {currentUserRole === 'doctor' && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        )}
      </div>

      {/* Staff List */}
      <div className="space-y-6">
        {staffList.map((staff) => (
          <div key={staff.uid} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl font-extrabold text-xs ${
                    staff.role === 'doctor'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  <UserCheck className="w-5 h-5 mx-auto" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900">{staff.name}</h3>
                    <span
                      className={`text-[10px] uppercase font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                        staff.role === 'doctor'
                          ? 'bg-sky-600 text-white'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {staff.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{staff.email} • {staff.specialty || 'Staff'}</p>
                </div>
              </div>

              {staff.role === 'doctor' && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
                  <Lock className="w-3.5 h-3.5" /> Full Practice Owner Access
                </div>
              )}
            </div>

            {/* Individual Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {PERMISSION_CONFIG.map((perm) => {
                const isEnabled = staff.role === 'doctor' || Boolean(staff.permissions?.[perm.id]);
                const disabled = staff.role === 'doctor' || currentUserRole !== 'doctor';

                return (
                  <label
                    key={perm.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                    } ${
                      isEnabled
                        ? 'bg-sky-50/60 border-sky-200 text-slate-900'
                        : 'bg-slate-50 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={disabled}
                      onChange={() => handleTogglePermission(staff, perm.id)}
                      className="mt-1 w-4 h-4 text-sky-600 rounded focus:ring-sky-500 accent-sky-600"
                    />
                    <div>
                      <p className="text-xs font-extrabold">{perm.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{perm.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-slate-900">Add Staff Account</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-sm font-medium">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mariam Ali"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="mariam@clinicpro.eg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="assistant">Assistant</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specialty / Title</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-extrabold hover:bg-sky-700 shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
