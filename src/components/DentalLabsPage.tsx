import React, { useState } from 'react';
import {
  DentalLabOrder,
  Patient,
  Doctor,
  ClinicSettings,
  RestorationType,
  DentalShade,
  LabOrderStatus
} from '../types';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MessageCircle,
  Sparkles,
  Trash2,
  Edit,
  ArrowRight,
  DollarSign,
  User,
  Building,
  Check,
  X
} from 'lucide-react';
import { saveLabOrderToFirestore, deleteLabOrderFromFirestore, updateLabOrderStatusInFirestore } from '../lib/firestoreService';

interface DentalLabsPageProps {
  labOrders: DentalLabOrder[];
  patients: Patient[];
  doctors: Doctor[];
  clinicSettings: ClinicSettings;
  clinicId: string;
  onSelectPatient?: (patient: Patient) => void;
}

const COMMON_LAB_NAMES = [
  'Master Ceramic Dental Lab',
  'Cairo Elite Esthetics Lab',
  'Delta Cast Chrome Lab',
  'Alexandria Dental Prosthetics',
  'Zirconia CAD/CAM Center',
  'Al-Ahram Precision Lab'
];

const RESTORATION_TYPES: RestorationType[] = [
  'Zirconia Crown',
  'E-Max / Lithium Disilicate',
  'PFM (Porcelain Fused to Metal)',
  'Veneer',
  'Inlay / Onlay',
  'Custom Implant Abutment',
  'Bridge',
  'Full Denture',
  'Partial Acrylic / Chrome',
  'Night Guard / Splint',
  'Bleaching Tray',
  'Other'
];

const VITA_SHADES: DentalShade[] = [
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
  'BL1', 'BL2', 'BL3', 'BL4',
  'Custom'
];

export const DentalLabsPage: React.FC<DentalLabsPageProps> = ({
  labOrders,
  patients,
  doctors,
  clinicSettings,
  clinicId,
  onSelectPatient
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State for new order
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [labName, setLabName] = useState<string>(COMMON_LAB_NAMES[0]);
  const [customLabName, setCustomLabName] = useState<string>('');
  const [restorationType, setRestorationType] = useState<RestorationType>('Zirconia Crown');
  const [selectedToothNumbers, setSelectedToothNumbers] = useState<number[]>([16]);
  const [shade, setShade] = useState<DentalShade>('A2');
  const [dateSent, setDateSent] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>(clinicSettings.doctorName || 'Dr. Mohamed Al-Sayed');

  // Filter orders
  const filteredOrders = labOrders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchPatient = order.patientName.toLowerCase().includes(q);
      const matchLab = order.labName.toLowerCase().includes(q);
      const matchRestoration = order.restorationType.toLowerCase().includes(q);
      if (!matchPatient && !matchLab && !matchRestoration) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalCost = labOrders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const countSent = labOrders.filter((o) => o.status === 'Sent' || o.status === 'In Progress').length;
  const countDelivered = labOrders.filter((o) => o.status === 'Delivered').length;
  const countFitted = labOrders.filter((o) => o.status === 'Fitted').length;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient for this lab work order.');
      return;
    }

    const patient = patients.find((p) => p.id === selectedPatientId);
    const finalLabName = labName === 'custom' ? customLabName.trim() || 'Custom Dental Lab' : labName;

    const newOrder: DentalLabOrder = {
      id: `lab_${Date.now()}`,
      clinicId,
      patientId: selectedPatientId,
      patientName: patient?.name || 'Patient',
      labName: finalLabName,
      doctorName,
      toothNumbers: selectedToothNumbers,
      restorationType,
      shade,
      dateSent,
      expectedReturnDate,
      status: 'Sent',
      cost: Number(cost) || 0,
      notes: notes.trim(),
      attachmentUrls: [],
      createdAt: new Date().toISOString()
    };

    await saveLabOrderToFirestore(newOrder);
    setShowAddModal(false);
    // Reset
    setNotes('');
  };

  const handleStatusChange = async (order: DentalLabOrder, newStatus: LabOrderStatus) => {
    const dates: any = {};
    if (newStatus === 'Delivered') {
      dates.receivedDate = new Date().toISOString().split('T')[0];
    } else if (newStatus === 'Fitted') {
      dates.fittedDate = new Date().toISOString().split('T')[0];
    }
    await updateLabOrderStatusInFirestore(order.id, newStatus, dates);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this lab work order?')) {
      await deleteLabOrderFromFirestore(orderId);
    }
  };

  const handleWhatsAppLab = (order: DentalLabOrder) => {
    const teethStr = order.toothNumbers.map((t) => `#${t}`).join(', ');
    const msg = `Salam! Dental Lab Order Inquiry:\n• Clinic: ${clinicSettings.name}\n• Patient: ${order.patientName}\n• Tooth: ${teethStr}\n• Restoration: ${order.restorationType}\n• Shade: ${order.shade}\n• Date Sent: ${order.dateSent}\n• Expected Return: ${order.expectedReturnDate}\n• Status: ${order.status}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const toggleToothSelection = (tooth: number) => {
    if (selectedToothNumbers.includes(tooth)) {
      setSelectedToothNumbers(selectedToothNumbers.filter((t) => t !== tooth));
    } else {
      setSelectedToothNumbers([...selectedToothNumbers, tooth].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-purple-200 border border-white/15">
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            Prosthetics & CAD/CAM Workflow
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Dental Labs Management</h1>
          <p className="text-purple-100 text-xs sm:text-sm font-medium max-w-xl">
            Track crown, bridge, veneer, and denture orders. Manage shades, expected delivery dates, and technician communication.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="py-3 px-5 bg-white text-purple-950 hover:bg-purple-50 active:scale-[0.99] transition-all rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4 text-purple-700" />
            + New Lab Work Order
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Sent / In Progress</span>
            <span className="text-2xl font-black text-amber-600">{countSent}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Delivered (Ready)</span>
            <span className="text-2xl font-black text-blue-600">{countDelivered}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Fitted in Patient</span>
            <span className="text-2xl font-black text-emerald-600">{countFitted}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block uppercase">Total Lab Fees</span>
            <span className="text-2xl font-black text-slate-800">{totalCost.toLocaleString()} <span className="text-xs font-bold text-slate-400">EGP</span></span>
          </div>
        </div>
      </div>

      {/* Main Filter & Orders Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search and Tabs */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by patient, lab, or restoration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-purple-600 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['all', 'Sent', 'In Progress', 'Delivered', 'Fitted'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st === 'all' ? 'All Orders' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        order.status === 'Fitted'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : order.status === 'Delivered'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : order.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-purple-100 text-purple-800 border-purple-300'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs font-black text-slate-700 font-mono">
                      {order.cost ? `${order.cost.toLocaleString()} EGP` : '0 EGP'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {order.restorationType}
                  </h3>

                  <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    {order.labName}
                  </p>
                </div>

                {/* Details Table */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Patient:</span>
                    <span className="font-bold text-slate-800">{order.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Tooth / Units:</span>
                    <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {order.toothNumbers && order.toothNumbers.length > 0
                        ? order.toothNumbers.map((t) => `#${t}`).join(', ')
                        : 'Full Arch'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Shade (VITA):</span>
                    <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {order.shade}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400">Expected:</span>
                    <span className="font-bold text-slate-700">{order.expectedReturnDate}</span>
                  </div>
                </div>

                {order.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                    "{order.notes}"
                  </p>
                )}

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Status update menu */}
                  <div className="flex items-center gap-1">
                    {order.status !== 'Delivered' && order.status !== 'Fitted' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order, 'Delivered')}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-extrabold transition-all"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {order.status === 'Delivered' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order, 'Fitted')}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-extrabold transition-all"
                      >
                        Mark Fitted in Patient
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleWhatsAppLab(order)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="WhatsApp Lab Inquiry"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-12 text-center text-slate-400 space-y-3">
              <Layers className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No dental lab orders found.</p>
              <p className="text-xs text-slate-400">Click "+ New Lab Work Order" to create your first prosthetic job ticket.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Lab Work Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-300" />
                  New Dental Lab Work Order
                </h2>
                <p className="text-xs text-purple-200">Issue custom prosthetic ticket for crowns, bridges, and dentures</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-purple-300 hover:text-white rounded-full hover:bg-purple-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 text-xs font-semibold">
              {/* Select Patient */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-purple-600"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lab Name */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Dental Lab Center *
                </label>
                <select
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-purple-600"
                >
                  {COMMON_LAB_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="custom">+ Enter Custom Lab Name</option>
                </select>
                {labName === 'custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter dental lab name..."
                    value={customLabName}
                    onChange={(e) => setCustomLabName(e.target.value)}
                    className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-purple-600"
                  />
                )}
              </div>

              {/* Restoration Type & Shade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Restoration Type *
                  </label>
                  <select
                    value={restorationType}
                    onChange={(e) => setRestorationType(e.target.value as RestorationType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-purple-600"
                  >
                    {RESTORATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    VITA Shade Guide *
                  </label>
                  <select
                    value={shade}
                    onChange={(e) => setShade(e.target.value as DentalShade)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-purple-600"
                  >
                    {VITA_SHADES.map((s) => (
                      <option key={s} value={s}>
                        Shade {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tooth Number Picker (FDI) */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Tooth Target Numbers (FDI): {selectedToothNumbers.map((t) => `#${t}`).join(', ') || 'None selected'}
                </label>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => toggleToothSelection(tooth)}
                        className={`w-7 h-7 text-[10px] font-black rounded-lg transition-all ${
                          selectedToothNumbers.includes(tooth)
                            ? 'bg-purple-700 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tooth}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200">
                    {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => toggleToothSelection(tooth)}
                        className={`w-7 h-7 text-[10px] font-black rounded-lg transition-all ${
                          selectedToothNumbers.includes(tooth)
                            ? 'bg-purple-700 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tooth}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dates & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Date Sent
                  </label>
                  <input
                    type="date"
                    required
                    value={dateSent}
                    onChange={(e) => setDateSent(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Expected Return
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Lab Cost (EGP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 850 or custom"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Detailed Instructions */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Preparation & Lab Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please use high translucency multilayer zirconia, subgingival shoulder finish line, check occlusion against opposing arch..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-black text-xs shadow-md"
                >
                  Save & Issue Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
