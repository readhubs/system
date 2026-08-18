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
  'Modern Dental Lab',
  'Apex Esthetics',
  'Precision Ceramics',
  'Digital Smile Lab',
  '3D BioDental'
];

export const DentalLabsPage: React.FC<DentalLabsPageProps> = ({
  labOrders,
  patients,
  clinicSettings,
  clinicId,
  onSelectPatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LabOrderStatus | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

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
      console.error("Error saving lab order:", error);
      alert("Failed to save lab order. Please check permissions or connection.");
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
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Delete this lab order? This action cannot be undone.')) {
      try {
        await deleteLabOrderFromFirestore(orderId);
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Failed to delete order.");
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
      case 'Sent to Lab': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Received': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Fitted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Remake/Adjustment': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getStatusIcon = (status: LabOrderStatus) => {
    switch (status) {
      case 'Sent to Lab': return <Truck className="w-3.5 h-3.5" />;
      case 'Received': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Fitted': return <Check className="w-3.5 h-3.5" />;
      case 'Remake/Adjustment': return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-400 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-400"
          >
            <option value="All">All Statuses</option>
            <option value="Sent to Lab">Sent to Lab</option>
            <option value="Received">Received</option>
            <option value="Fitted">Fitted</option>
            <option value="Remake/Adjustment">Remake/Adj.</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Order
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const patient = patients.find(p => p.id === order.patientId);
            return (
              <div key={order.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      ID: {order.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  
                  <div 
                    className="flex items-center gap-2 mt-1 cursor-pointer group"
                    onClick={() => patient && onSelectPatient && onSelectPatient(patient)}
                  >
                     <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-slate-600 transition-colors">
                        {order.patientName}
                     </h3>
                     <span className="text-xs font-medium text-slate-500">
                        • {order.restorationType} (Teeth: {order.toothNumbers.join(', ')})
                     </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" /> {order.labName}
                    </span>
                    <span>Shade: <strong className="text-slate-700">{order.shade}</strong></span>
                    <span>Due: <strong className="text-slate-700">{order.dueDate}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value as LabOrderStatus)}
                    className="p-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="Sent to Lab">Sent</option>
                    <option value="Received">Received</option>
                    <option value="Fitted">Fitted</option>
                    <option value="Remake/Adjustment">Remake</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppLab(order)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="WhatsApp Lab"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => patient && onSelectPatient && onSelectPatient(patient)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-600">No lab orders found.</p>
            <p className="text-xs">Click "New Order" to create a prosthetic ticket.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">New Lab Order</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
             </div>
             
             <form onSubmit={handleCreateOrder} className="p-4 space-y-4 text-xs font-medium">
               {/* Simplified Form Content Here */}
               <div>
                 <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
                 <select
                   required
                   value={selectedPatientId}
                   onChange={(e) => setSelectedPatientId(e.target.value)}
                   className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                 >
                   <option value="">-- Choose Patient --</option>
                   {patients.map((p) => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block font-bold text-slate-700 mb-1">Dental Lab *</label>
                   <select
                     value={labName}
                     onChange={(e) => setLabName(e.target.value)}
                     className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                   >
                     {COMMON_LAB_NAMES.map((name) => (
                       <option key={name} value={name}>{name}</option>
                     ))}
                     <option value="custom">Custom...</option>
                   </select>
                   {labName === 'custom' && (
                      <input type="text" required placeholder="Enter lab name..." value={customLabName} onChange={e => setCustomLabName(e.target.value)} className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400" />
                   )}
                 </div>
                 <div>
                   <label className="block font-bold text-slate-700 mb-1">Restoration Type</label>
                   <select
                     value={restorationType}
                     onChange={(e) => setRestorationType(e.target.value as any)}
                     className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
                   >
                     <option value="Crown - Zirconia">Zirconia Crown</option>
                     <option value="Crown - E.max">E.max Crown</option>
                     <option value="Crown - PFM">PFM Crown</option>
                     <option value="Veneer - E.max">E.max Veneer</option>
                     <option value="Bridge - Zirconia">Zirconia Bridge</option>
                     <option value="Denture - Complete">Complete Denture</option>
                     <option value="Denture - Partial">Partial Denture</option>
                     <option value="Night Guard">Night Guard</option>
                     <option value="Orthodontic Retainer">Retainer</option>
                   </select>
                 </div>
               </div>

               <div>
                 <label className="block font-bold text-slate-700 mb-1">Select Teeth</label>
                 <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                    {[18,17,16,15,14,13,12,11, 21,22,23,24,25,26,27,28, 48,47,46,45,44,43,42,41, 31,32,33,34,35,36,37,38].map((tooth) => (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => toggleToothSelection(tooth)}
                        className={`p-1 text-[10px] font-bold rounded-md ${selectedToothNumbers.includes(tooth) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {tooth}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <div>
                    <label className="block font-bold text-slate-700 mb-1">Shade</label>
                    <select value={shade} onChange={e => setShade(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                       <option value="1M1">1M1</option>
                       <option value="1M2">1M2</option>
                       <option value="2M1">2M1</option>
                       <option value="2M2">2M2</option>
                       <option value="2M3">2M3</option>
                       <option value="3M1">3M1</option>
                       <option value="3M2">3M2</option>
                       <option value="3M3">3M3</option>
                       <option value="4M1">4M1</option>
                       <option value="4M2">4M2</option>
                       <option value="4M3">4M3</option>
                       <option value="5M1">5M1</option>
                       <option value="0M1">0M1 (Bleach)</option>
                       <option value="0M2">0M2 (Bleach)</option>
                       <option value="0M3">0M3 (Bleach)</option>
                       <option value="Other">Other</option>
                    </select>
                 </div>
                 <div>
                    <label className="block font-bold text-slate-700 mb-1">Sent</label>
                    <input type="date" value={dateSent} onChange={e => setDateSent(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                 </div>
                 <div>
                    <label className="block font-bold text-slate-700 mb-1">Due</label>
                    <input type="date" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                 </div>
                 <div>
                    <label className="block font-bold text-slate-700 mb-1">Cost (EGP)</label>
                    <input type="number" value={cost} onChange={e => setCost(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                 </div>
               </div>

               <div>
                 <label className="block font-bold text-slate-700 mb-1">Instructions</label>
                 <textarea
                   rows={2}
                   value={notes}
                   onChange={e => setNotes(e.target.value)}
                   className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                   placeholder="Add special instructions..."
                 />
               </div>

               <div className="pt-4 flex justify-end gap-2">
                 <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl font-bold">Cancel</button>
                 <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-sm hover:bg-slate-800">Save Order</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
