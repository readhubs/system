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
  CheckCircle2,
  AlertCircle,
  Truck,
  MessageCircle,
  Trash2,
  ArrowRight,
  DollarSign,
  Building,
  Check,
  X,
  Printer,
  Calendar,
  User,
  Phone,
  FileText
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
  'Modern Dental Lab',
  'Apex Esthetics',
  'Precision Ceramics',
  'Digital Smile Lab',
  '3D BioDental'
];

export const DentalLabsPage: React.FC<DentalLabsPageProps> = ({
  labOrders,
  patients,
  doctors,
  clinicSettings,
  clinicId,
  onSelectPatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LabOrderStatus | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<DentalLabOrder | null>(null);

  // New Order Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [labName, setLabName] = useState(COMMON_LAB_NAMES[0]);
  const [customLabName, setCustomLabName] = useState('');
  const [restorationType, setRestorationType] = useState<RestorationType>('Crown - Zirconia');
  const [selectedToothNumbers, setSelectedToothNumbers] = useState<number[]>([]);
  const [shade, setShade] = useState<DentalShade>('2M2');
  const [dateSent, setDateSent] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [cost, setCost] = useState('800');
  const [notes, setNotes] = useState('');

  const filteredOrders = labOrders.filter((order) => {
    const matchesSearch =
      order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery);

    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || selectedToothNumbers.length === 0) {
      alert('Please select a patient and at least one tooth.');
      return;
    }

    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    const finalLabName = labName === 'custom' ? customLabName : labName;

    const newOrder: DentalLabOrder = {
      id: `lab_${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      labName: finalLabName,
      restorationType,
      toothNumbers: selectedToothNumbers,
      shade,
      orderDate: dateSent,
      dueDate: expectedReturnDate,
      status: 'Sent to Lab',
      cost: parseFloat(cost) || 0,
      notes,
      clinicId,
      createdAt: new Date().toISOString()
    };

    try {
      await saveLabOrderToFirestore(newOrder);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving lab order:', error);
      alert('Failed to save lab order. Please check permissions or connection.');
    }
  };

  const resetForm = () => {
    setSelectedPatientId('');
    setLabName(COMMON_LAB_NAMES[0]);
    setCustomLabName('');
    setSelectedToothNumbers([]);
    setNotes('');
    setCost('800');
  };

  const handleUpdateStatus = async (orderId: string, newStatus: LabOrderStatus) => {
    try {
      await updateLabOrderStatusInFirestore(orderId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Delete this lab order? This action cannot be undone.')) {
      try {
        await deleteLabOrderFromFirestore(orderId);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order.');
      }
    }
  };

  const handleWhatsAppLab = (order: DentalLabOrder) => {
    const msg = `Hello ${order.labName}, this is ${clinicSettings.name || 'ClinicPro Dental'}. Regarding order #${order.id.slice(-6).toUpperCase()} for patient ${order.patientName} (Teeth: ${order.toothNumbers.join(',')}). Status update please?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const toggleToothSelection = (num: number) => {
    if (selectedToothNumbers.includes(num)) {
      setSelectedToothNumbers(selectedToothNumbers.filter((n) => n !== num));
    } else {
      setSelectedToothNumbers([...selectedToothNumbers, num].sort((a, b) => a - b));
    }
  };

  const getStatusColor = (status: LabOrderStatus) => {
    switch (status) {
      case 'Sent to Lab':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Received':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'Fitted':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Remake/Adjustment':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusIcon = (status: LabOrderStatus) => {
    switch (status) {
      case 'Sent to Lab':
        return <Truck className="w-3.5 h-3.5 text-amber-700" />;
      case 'Received':
        return <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />;
      case 'Fitted':
        return <Check className="w-3.5 h-3.5 text-emerald-700" />;
      case 'Remake/Adjustment':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-700" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search orders, lab, or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-500"
          >
            <option value="All">All Statuses</option>
            <option value="Sent to Lab">Sent to Lab</option>
            <option value="Received">Received</option>
            <option value="Fitted">Fitted</option>
            <option value="Remake/Adjustment">Remake/Adj.</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-extrabold text-xs shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Lab Order
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const patient = patients.find((p) => p.id === order.patientId);
            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl hover:border-sky-300 hover:shadow-xs transition-all"
              >
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      ID: {order.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div
                    className="flex flex-wrap items-center gap-2 mt-1 cursor-pointer group"
                    onClick={() => patient && onSelectPatient && onSelectPatient(patient)}
                  >
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                      {order.patientName}
                    </h3>
                    <span className="text-xs font-bold text-slate-700">
                      • {order.restorationType} (Teeth: {order.toothNumbers.map((t) => `#${t}`).join(', ')})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      <Building className="w-3.5 h-3.5 text-slate-500" /> {order.labName}
                    </span>
                    <span>
                      VITA 3D Shade: <strong className="font-mono font-bold text-slate-900">{order.shade}</strong>
                    </span>
                    <span>
                      Due: <strong className="font-mono font-bold text-slate-900">{order.dueDate || 'N/A'}</strong>
                    </span>
                    {order.cost > 0 && (
                      <span className="font-mono font-bold text-emerald-700">
                        {order.cost.toLocaleString()} EGP
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value as LabOrderStatus)}
                    className="p-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer text-slate-800"
                  >
                    <option value="Sent to Lab">Sent</option>
                    <option value="Received">Received</option>
                    <option value="Fitted">Fitted</option>
                    <option value="Remake/Adjustment">Remake</option>
                  </select>

                  {/* Print Lab Slip Button */}
                  <button
                    type="button"
                    onClick={() => setOrderToPrint(order)}
                    className="p-2 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200"
                    title="Print Official Lab Slip"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppLab(order)}
                    className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                    title="WhatsApp Lab"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => patient && onSelectPatient && onSelectPatient(patient)}
                    className="p-2 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    title="Open Patient Profile"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-500 bg-white rounded-3xl border border-slate-200">
            <Layers className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-800">No lab orders found.</p>
            <p className="text-xs text-slate-500 mt-1">Click "New Lab Order" to create a prosthetic ticket.</p>
          </div>
        )}
      </div>

      {/* Add New Lab Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" /> New Dental Lab Work Order
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 text-slate-900 font-semibold"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Dental Laboratory *</label>
                  <select
                    value={labName}
                    onChange={(e) => setLabName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 text-slate-900 font-semibold"
                  >
                    {COMMON_LAB_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="custom">Custom Lab...</option>
                  </select>
                  {labName === 'custom' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom lab name..."
                      value={customLabName}
                      onChange={(e) => setCustomLabName(e.target.value)}
                      className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 text-slate-900 font-semibold"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Restoration Type *</label>
                  <select
                    value={restorationType}
                    onChange={(e) => setRestorationType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 text-slate-900 font-semibold"
                  >
                    <option value="Crown - Zirconia">Zirconia Crown</option>
                    <option value="Crown - E.max">E.max Crown</option>
                    <option value="Crown - PFM">PFM Crown</option>
                    <option value="Veneer - E.max">E.max Veneer</option>
                    <option value="Bridge - Zirconia">Zirconia Bridge</option>
                    <option value="Bridge - PFM">PFM Bridge</option>
                    <option value="Inlay / Onlay">Inlay / Onlay</option>
                    <option value="Custom Implant Abutment">Custom Implant Abutment</option>
                    <option value="Denture - Complete">Complete Denture</option>
                    <option value="Denture - Partial">Partial Denture</option>
                    <option value="Night Guard">Night Guard</option>
                    <option value="Orthodontic Retainer">Retainer</option>
                    <option value="Bleaching Tray">Bleaching Tray</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Tooth Selection Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800">
                    Select Target Teeth * (Selected: {selectedToothNumbers.length})
                  </label>
                  {selectedToothNumbers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedToothNumbers([])}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-bold text-slate-600 text-center">Upper Jaw (Q1 & Q2)</div>
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                    {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => toggleToothSelection(tooth)}
                        className={`p-1.5 text-[10px] font-bold rounded-lg transition-all ${
                          selectedToothNumbers.includes(tooth)
                            ? 'bg-sky-600 text-white shadow-xs font-black'
                            : 'bg-white text-slate-800 border border-slate-200 hover:border-sky-400'
                        }`}
                      >
                        {tooth}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600 text-center pt-1">Lower Jaw (Q4 & Q3)</div>
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                    {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => toggleToothSelection(tooth)}
                        className={`p-1.5 text-[10px] font-bold rounded-lg transition-all ${
                          selectedToothNumbers.includes(tooth)
                            ? 'bg-sky-600 text-white shadow-xs font-black'
                            : 'bg-white text-slate-800 border border-slate-200 hover:border-sky-400'
                        }`}
                      >
                        {tooth}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* VITA 3D Master Shade Guide Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    VITA 3D-Master Shade *
                  </label>
                  <select
                    value={shade}
                    onChange={(e) => setShade(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono font-bold text-slate-900"
                  >
                    <optgroup label="Bleach Shades (0M / BL)">
                      <option value="0M1">0M1 (Bleach)</option>
                      <option value="0M2">0M2 (Bleach)</option>
                      <option value="0M3">0M3 (Bleach)</option>
                      <option value="BL1">BL1</option>
                      <option value="BL2">BL2</option>
                      <option value="BL3">BL3</option>
                      <option value="BL4">BL4</option>
                    </optgroup>
                    <optgroup label="Value Group 1">
                      <option value="1M1">1M1</option>
                      <option value="1M2">1M2</option>
                    </optgroup>
                    <optgroup label="Value Group 2">
                      <option value="2L1.5">2L1.5</option>
                      <option value="2L2.5">2L2.5</option>
                      <option value="2M1">2M1</option>
                      <option value="2M2">2M2 (Standard Natural)</option>
                      <option value="2M3">2M3</option>
                      <option value="2R1.5">2R1.5</option>
                      <option value="2R2.5">2R2.5</option>
                    </optgroup>
                    <optgroup label="Value Group 3">
                      <option value="3L1.5">3L1.5</option>
                      <option value="3L2.5">3L2.5</option>
                      <option value="3M1">3M1</option>
                      <option value="3M2">3M2</option>
                      <option value="3M3">3M3</option>
                      <option value="3R1.5">3R1.5</option>
                      <option value="3R2.5">3R2.5</option>
                    </optgroup>
                    <optgroup label="Value Group 4">
                      <option value="4L1.5">4L1.5</option>
                      <option value="4L2.5">4L2.5</option>
                      <option value="4M1">4M1</option>
                      <option value="4M2">4M2</option>
                      <option value="4M3">4M3</option>
                      <option value="4R1.5">4R1.5</option>
                      <option value="4R2.5">4R2.5</option>
                    </optgroup>
                    <optgroup label="Value Group 5">
                      <option value="5M1">5M1</option>
                      <option value="5M2">5M2</option>
                      <option value="5M3">5M3</option>
                    </optgroup>
                    <optgroup label="Custom">
                      <option value="Other">Other / Custom Mix</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Date Sent</label>
                  <input
                    type="date"
                    value={dateSent}
                    onChange={(e) => setDateSent(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium text-slate-900"
                  >
                  </input>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Lab Cost (EGP)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Preparation Instructions & Clinical Directives
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 text-slate-900"
                  placeholder="Specify margin type (chamfer/shoulder), contact tightness, translucency level, stump shade..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold shadow-md transition-colors"
                >
                  Save & Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE LAB WORK ORDER SLIP MODAL */}
      {orderToPrint && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 border border-slate-200 print:border-none print:shadow-none print:m-0 print:p-0 print:rounded-none">
            {/* Top Toolbar (Hidden on print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-black text-slate-900">Lab Work Order Slip</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-md transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print A4 Slip
                </button>
                <button
                  type="button"
                  onClick={() => setOrderToPrint(null)}
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE SLIP CANVAS */}
            <div className="border-2 border-slate-800 rounded-2xl p-6 space-y-6 bg-white text-slate-900">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    {clinicSettings.name}
                  </h1>
                  <p className="text-xs font-bold text-slate-600">{clinicSettings.doctorName}</p>
                  <p className="text-xs text-slate-500">{clinicSettings.address}</p>
                  <p className="text-xs text-slate-500 font-mono">Tel: {clinicSettings.phone}</p>
                </div>
                <div className="text-right font-mono">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider mb-1">
                    DENTAL LAB SLIP
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Order #{orderToPrint.id.slice(-6).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: {orderToPrint.orderDate || new Date().toISOString().split('T')[0]}
                  </p>
                </div>
              </div>

              {/* Lab & Patient Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Target Laboratory
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">{orderToPrint.labName}</p>
                  <p className="text-[11px] text-slate-600 font-medium">Status: {orderToPrint.status}</p>
                  <p className="text-[11px] font-bold text-sky-800">
                    Expected Due Date: {orderToPrint.dueDate || 'Standard'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Patient Reference
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">{orderToPrint.patientName}</p>
                  <p className="text-[11px] text-slate-600 font-mono">ID: {orderToPrint.patientId}</p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 font-extrabold text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Restoration Specification</th>
                      <th className="p-2.5">Target FDI Teeth</th>
                      <th className="p-2.5">VITA 3D-Master Shade</th>
                      <th className="p-2.5 text-right">Agreed Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-3 font-bold text-slate-900">{orderToPrint.restorationType}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {orderToPrint.toothNumbers.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-mono font-black text-xs border border-sky-200"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-black text-slate-900 text-sm">
                        {orderToPrint.shade}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {orderToPrint.cost > 0 ? `${orderToPrint.cost.toLocaleString()} EGP` : 'Standard'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Special Clinical Instructions & Directives */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Clinical Preparation Instructions & Directives:
                </p>
                <p className="text-slate-900 leading-relaxed font-medium">
                  {orderToPrint.notes || 'Standard anatomical anatomy, tight contacts, standard margin adaptation.'}
                </p>
              </div>

              {/* Stamp & Verification Signatures */}
              <div className="flex justify-between items-end pt-8 border-t border-slate-200 text-xs font-bold text-slate-800">
                <div className="space-y-8">
                  <p>Laboratory Acceptance & Received By</p>
                  <div className="w-44 h-0.5 bg-slate-300"></div>
                </div>

                <div className="space-y-8 text-right">
                  <p>Prescribing Doctor Signature & Practice Stamp</p>
                  <div className="w-48 h-0.5 bg-slate-300 ml-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
