import React, { useState, useMemo } from 'react';
import {
  Patient,
  ToothRecord,
  PatientImage,
  Payment,
  Doctor,
  ClinicSettings,
  ToothStatus,
  DentalLabOrder
} from '../types';
import { PatientHeader } from './PatientHeader';
import { DentalChart } from './DentalChart';
import { AddProcedureModal } from './AddProcedureModal';
import { ImageUploadModal } from './ImageUploadModal';
import { XrayViewer } from './XrayViewer';
import { PaymentFormModal } from './PaymentFormModal';
import { ReceiptModal } from './ReceiptModal';
import { DicomViewer } from './DicomViewer';
import { ExcelFinancialReport } from './ExcelFinancialReport';
import { exportPatientFileToPptx } from '../lib/exportToPptx';
import {
  User,
  Stethoscope,
  FileImage,
  CreditCard,
  Plus,
  Upload,
  Clock,
  DollarSign,
  Printer,
  ChevronRight,
  Sparkles,
  Eye,
  Check,
  Download,
  AlertTriangle,
  Layers,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HeartPulse,
  Truck,
  Trash2
} from 'lucide-react';

interface PatientProfileProps {
  patient: Patient;
  toothRecords: ToothRecord[];
  patientImages: PatientImage[];
  payments: Payment[];
  doctors: Doctor[];
  clinicSettings: ClinicSettings;
  labOrders?: DentalLabOrder[];
  onUpdatePatient: (updated: Patient) => void;
  onAddToothRecord: (record: Omit<ToothRecord, 'id'>) => void;
  onAddPatientImage: (image: Omit<PatientImage, 'id'>) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
  onDeleteToothRecord?: (recordId: string, cost?: number) => void;
  onDeletePatientImage?: (imageId: string) => void;
  onDeletePayment?: (paymentId: string, amount: number) => void;
  onDeletePatient?: (patientId: string) => void;
  onDeleteLabOrder?: (orderId: string) => void;
  onBack?: () => void;
  onEditPatientModalOpen: () => void;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({
  patient,
  toothRecords,
  patientImages,
  payments,
  doctors,
  clinicSettings,
  labOrders = [],
  onUpdatePatient,
  onAddToothRecord,
  onAddPatientImage,
  onAddPayment,
  onDeleteToothRecord,
  onDeletePatientImage,
  onDeletePayment,
  onDeletePatient,
  onDeleteLabOrder,
  onBack,
  onEditPatientModalOpen
}) => {
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(null);

  // Modals
  const [showAddProcedure, setShowAddProcedure] = useState<boolean>(false);
  const [showUploadImage, setShowUploadImage] = useState<boolean>(false);
  const [showRecordPayment, setShowRecordPayment] = useState<boolean>(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<PatientImage | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
  const [showDicomViewer, setShowDicomViewer] = useState<boolean>(false);
  const [dicomFileToView, setDicomFileToView] = useState<File | null>(null);
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [exportingPptx, setExportingPptx] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddProcedureSubmit = (procData: Omit<ToothRecord, 'id'>) => {
    onAddToothRecord(procData);
    const newStatus: ToothStatus = procData.status === 'completed' ? 'treated' : 'needs-treatment';
    const updatedStatusMap = {
      ...patient.toothStatus,
      [procData.toothNumber]: newStatus
    };
    onUpdatePatient({
      ...patient,
      toothStatus: updatedStatusMap,
      balance: patient.balance + procData.cost,
      hasPendingTreatment: procData.status === 'planned' || patient.hasPendingTreatment
    });
    setShowAddProcedure(false);
  };

  const handleAddImageSubmit = (imgData: Omit<PatientImage, 'id'>) => {
    onAddPatientImage(imgData);
    setShowUploadImage(false);
  };

  const handleQuickAction = (
    toothNum: number,
    action: 'fill' | 'extract' | 'endo' | 'clean' | 'crown' | 'healthy'
  ) => {
    let statusToSet: ToothStatus = 'healthy';
    let procName = '';
    let estimatedCost = 500;

    switch (action) {
      case 'fill':
        statusToSet = 'treated';
        procName = `Composite Filling on Tooth #${toothNum}`;
        estimatedCost = 600;
        break;
      case 'endo':
        statusToSet = 'endo';
        procName = `Root Canal Treatment (RCT) on Tooth #${toothNum}`;
        estimatedCost = 1500;
        break;
      case 'crown':
        statusToSet = 'crown';
        procName = `Porcelain / Zirconia Crown on Tooth #${toothNum}`;
        estimatedCost = 2500;
        break;
      case 'extract':
        statusToSet = 'extracted';
        procName = `Surgical / Simple Extraction of Tooth #${toothNum}`;
        estimatedCost = 400;
        break;
      case 'clean':
        statusToSet = 'healthy';
        procName = `Ultrasonic Scaling & Polishing`;
        estimatedCost = 500;
        break;
      case 'healthy':
        statusToSet = 'healthy';
        break;
    }

    const updatedStatusMap = {
      ...patient.toothStatus,
      [toothNum]: statusToSet
    };

    onUpdatePatient({
      ...patient,
      toothStatus: updatedStatusMap,
      balance: action !== 'healthy' ? patient.balance + estimatedCost : patient.balance
    });

    if (action !== 'healthy') {
      onAddToothRecord({
        patientId: patient.id,
        toothNumber: toothNum,
        procedureName: procName,
        surfaces: ['O'],
        performingDoctorId: doctors[0]?.id || 'unknown',
        performingDoctorName: clinicSettings.doctorName || 'Chief Doctor',
        status: 'completed',
        cost: estimatedCost,
        date: new Date().toISOString().split('T')[0],
        notes: `Quick recorded via Interactive Odontogram (${action.toUpperCase()})`
      });
    }
  };

  const handleAddPaymentSubmit = (payData: Omit<Payment, 'id'>) => {
    onAddPayment(payData);
    const newBalance = Math.max(0, patient.balance - payData.amount);
    onUpdatePatient({
      ...patient,
      balance: newBalance
    });
    setShowRecordPayment(false);
  };

  const handleExportPptx = async () => {
    setExportingPptx(true);
    try {
      await exportPatientFileToPptx({
        patient,
        toothRecords,
        patientImages,
        payments,
        clinicSettings
      });
    } catch (err) {
      console.error('PPTX export error:', err);
      setToastMessage('Failed to generate PowerPoint file. Please check clinical assets.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setExportingPptx(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!patient.phone) return;
    const cleanPhone = patient.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone.replace(/^0/, '')}`;
    const msg = `Salam ${patient.name}, this is ${clinicSettings.name || 'ClinicPro Dental'}. Regarding your dental treatment file and upcoming appointments...`;
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
    const anchor = document.createElement('a');
    anchor.href = waUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const isHighRisk = patient.medicalAlerts && patient.medicalAlerts.length > 0;

  const timelineItems = useMemo(() => {
    const items: {
      id: string;
      dateStr: string;
      sortDate: number;
      type: 'procedure' | 'payment' | 'image' | 'lab';
      data: any;
      toothNumber?: number;
    }[] = [];

    toothRecords.forEach((rec) => {
      if (selectedToothNumber && rec.toothNumber !== selectedToothNumber) return;
      items.push({
        id: `proc-${rec.id}`,
        dateStr: rec.date,
        sortDate: new Date(rec.date).getTime() || 0,
        type: 'procedure',
        data: rec,
        toothNumber: rec.toothNumber
      });
    });

    payments.forEach((pay) => {
      if (selectedToothNumber) return;
      items.push({
        id: `pay-${pay.id}`,
        dateStr: pay.date,
        sortDate: new Date(pay.date).getTime() || 0,
        type: 'payment',
        data: pay
      });
    });

    patientImages.forEach((img) => {
      if (selectedToothNumber && img.toothNumber !== selectedToothNumber && img.toothNumber !== undefined) return;
      items.push({
        id: `img-${img.id}`,
        dateStr: img.date,
        sortDate: new Date(img.date).getTime() || 0,
        type: 'image',
        data: img,
        toothNumber: img.toothNumber
      });
    });

    labOrders.filter(l => l.patientId === patient.id).forEach((lab) => {
      if (selectedToothNumber && !lab.toothNumbers.includes(selectedToothNumber)) return;
      const orderDateStr = lab.orderDate || lab.dateSent || lab.createdAt || '';
      items.push({
        id: `lab-${lab.id}`,
        dateStr: orderDateStr,
        sortDate: orderDateStr ? new Date(orderDateStr).getTime() : 0,
        type: 'lab',
        data: lab
      });
    });

    return items.sort((a, b) => b.sortDate - a.sortDate);
  }, [toothRecords, payments, patientImages, labOrders, selectedToothNumber, patient.id]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Non-blocking feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Back & Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-sky-600 transition-colors"
          >
            ← Back to Patient Directory
          </button>
        )}

        <div className="flex items-center gap-2">
          {/* WhatsApp Direct */}
          {patient.phone && (
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-extrabold border border-emerald-200 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Patient
            </button>
          )}

          {/* Full Ledger */}
          <button
            type="button"
            onClick={() => setShowExcelModal(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black border border-slate-200 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Financial Ledger
          </button>

          {/* Export PPTX */}
          <button
            type="button"
            disabled={exportingPptx}
            onClick={handleExportPptx}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-sky-600/20 disabled:opacity-50"
          >
            {exportingPptx ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export Clinical Dossier
          </button>
        </div>
      </div>

      {/* Patient Header Banner */}
      <PatientHeader
        patient={patient}
        onEditPatient={onEditPatientModalOpen}
        onDeletePatient={onDeletePatient ? () => onDeletePatient(patient.id) : undefined}
      />

      {/* 2-Pane Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Pane (60%) - Canvas */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Medical Alerts (Strict Red / Yellow / Green Color Coding) */}
          {isHighRisk && (
            <div className="bg-rose-50 p-4 rounded-3xl border border-rose-200 shadow-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-black text-rose-900">
                  Medical Health Alerts & Clinical Risk Contraindications
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(patient.medicalAlerts || []).map((alert, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-rose-200/50 rounded-xl text-rose-900 font-extrabold text-[10px] uppercase tracking-wide"
                    >
                      {alert}
                    </span>
                  ))}
                </div>
                {patient.medicalNotes && (
                  <p className="mt-2 p-3 bg-rose-100/50 border border-rose-200/50 rounded-2xl text-xs text-rose-800 leading-relaxed font-bold italic">
                    Doctor's Notes: {patient.medicalNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* The Workspace Canvas */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[700px] sticky top-6">
            
            {/* Top: Odontogram */}
            <div className="flex-1 p-6 overflow-y-auto">
               <DentalChart
                  toothStatus={patient.toothStatus || {}}
                  onToothSelect={(num) => setSelectedToothNumber(selectedToothNumber === num ? null : num)}
                  onQuickAction={handleQuickAction}
                  selectedToothNumber={selectedToothNumber}
                />
            </div>

            {/* Bottom: Mini Media Gallery */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 shrink-0">
               <div className="flex items-center justify-between mb-3">
                   <h3 className="font-black text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                       <FileImage className="w-4 h-4 text-slate-400" />
                       Patient Media & Radiographs
                   </h3>
                   <button onClick={() => setShowDicomViewer(true)} className="text-[10px] font-black uppercase text-sky-600 hover:text-sky-700 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Launch DICOM Engine
                   </button>
               </div>
               
               <div className="flex overflow-x-auto gap-2 pb-2 snap-x">
                   {patientImages.length > 0 ? patientImages.map(img => (
                      <div key={img.id} onClick={() => setSelectedImageForViewer(img)} className="snap-start shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md hover:border-sky-300 transition-all relative group bg-slate-950">
                          <img src={img.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                      </div>
                   )) : (
                      <div className="w-full text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                         No images or X-Rays uploaded.
                      </div>
                   )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Pane (40%) - Unified Timeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-220px)] min-h-[700px] sticky top-6">
           
           {/* Timeline Header (Sticky) */}
           <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white rounded-t-3xl z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)]">
               <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600" /> Clinical Timeline
               </h3>
               {selectedToothNumber ? (
                   <button onClick={() => setSelectedToothNumber(null)} className="text-[10px] uppercase font-black bg-sky-100 text-sky-700 hover:bg-sky-200 px-3 py-1 rounded-full transition-colors flex items-center gap-1">
                       Tooth #{selectedToothNumber} <span className="text-sky-900 ml-1">✕</span>
                   </button>
               ) : (
                   <span className="text-[10px] uppercase font-black text-slate-400">All History</span>
               )}
           </div>

           {/* Timeline Feed (Scrollable) */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
               {timelineItems.length > 0 ? timelineItems.map(item => (
                   <div key={item.id} className="relative pl-6 before:absolute before:left-2 before:top-3 before:bottom-[-24px] before:w-[2px] before:bg-slate-200 last:before:hidden">
                       
                       {/* Timeline Dot */}
                       <div className={`absolute left-[3px] top-3 w-2.5 h-2.5 rounded-full ring-4 ring-slate-50 ${
                           item.type === 'procedure' ? 'bg-sky-500' :
                           item.type === 'payment' ? 'bg-emerald-500' :
                           item.type === 'image' ? 'bg-purple-500' : 'bg-amber-500'
                       }`} />
                       
                       {/* Item Card */}
                       <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                           {item.type === 'procedure' && (
                               <div>
                                   <div className="flex justify-between items-start mb-1.5">
                                       <h4 className="text-sm font-extrabold text-slate-900">{item.data.procedureName}</h4>
                                       <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-xs text-slate-700">{(item.data.cost || 0).toLocaleString()} EGP</span>
                                          {onDeleteToothRecord && (
                                             <button type="button" onClick={() => onDeleteToothRecord(item.data.id, item.data.cost)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                             </button>
                                          )}
                                       </div>
                                   </div>
                                   <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mb-2">
                                       <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-black">Tooth #{item.data.toothNumber}</span>
                                       <span className="font-medium text-slate-400">{item.dateStr}</span>
                                       <span className="font-medium truncate max-w-[100px]">{item.data.performingDoctorName}</span>
                                       <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${item.data.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.data.status}</span>
                                   </div>
                                   {item.data.notes && <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl font-medium border border-slate-100">{item.data.notes}</p>}
                               </div>
                           )}
                           {item.type === 'payment' && (
                               <div>
                                   <div className="flex justify-between items-start mb-1">
                                       <h4 className="text-sm font-extrabold text-slate-900">Payment Received</h4>
                                       <div className="flex items-center gap-2">
                                          <span className="font-mono font-bold text-sm text-emerald-600">+{(item.data.amount || 0).toLocaleString()} EGP</span>
                                          {onDeletePayment && (
                                             <button type="button" onClick={() => onDeletePayment(item.data.id, item.data.amount)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                             </button>
                                          )}
                                       </div>
                                   </div>
                                   <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                       <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{item.data.method}</span>
                                       <span className="font-medium text-slate-400">{item.dateStr}</span>
                                   </div>
                               </div>
                           )}
                           {item.type === 'image' && (
                               <div className="flex gap-3 items-center cursor-pointer group" onClick={() => setSelectedImageForViewer(item.data)}>
                                   <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative bg-slate-950">
                                       <img src={item.data.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                   </div>
                                   <div className="flex-1">
                                       <div className="flex justify-between items-start">
                                          <h4 className="text-sm font-extrabold text-slate-900">Media Uploaded</h4>
                                          {onDeletePatientImage && (
                                             <button type="button" onClick={(e) => { e.stopPropagation(); onDeletePatientImage(item.data.id); }} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                             </button>
                                          )}
                                       </div>
                                       <p className="text-[11px] font-bold text-slate-600 mt-0.5">{item.data.type}</p>
                                       <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-1.5">
                                           {item.data.toothNumber && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">Tooth #{item.data.toothNumber}</span>}
                                           <span className="font-medium text-slate-400">{item.dateStr}</span>
                                       </div>
                                   </div>
                               </div>
                           )}
                           {item.type === 'lab' && (
                               <div>
                                   <div className="flex justify-between items-start mb-1">
                                       <h4 className="text-sm font-extrabold text-slate-900 truncate pr-2">Lab: {item.data.restorationType}</h4>
                                       <div className="flex items-center gap-2">
                                          <span className={`text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded border shrink-0 ${item.data.status === 'Fitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{item.data.status}</span>
                                          {onDeleteLabOrder && (
                                             <button type="button" onClick={() => onDeleteLabOrder(item.data.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                             </button>
                                          )}
                                       </div>
                                   </div>
                                   <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mb-1.5">
                                       <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded font-black">Teeth: {item.data.toothNumbers.join(', ')}</span>
                                       <span className="font-bold text-slate-700">{item.data.labName}</span>
                                       <span className="font-medium text-slate-400">Due: {item.data.dueDate}</span>
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
               )) : (
                   <div className="text-center py-16">
                       <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                           <Activity className="w-6 h-6 text-slate-300" />
                       </div>
                       <p className="text-sm font-black text-slate-400">No clinical history yet.</p>
                       {selectedToothNumber && <p className="text-[11px] font-bold text-slate-400 mt-1">Clear the tooth filter to see all records.</p>}
                   </div>
               )}
           </div>

           {/* Floating Action Bar (Bottom) */}
           <div className="p-4 border-t border-slate-100 bg-white rounded-b-3xl shrink-0 grid grid-cols-2 gap-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.03)] z-10">
               <button onClick={() => setShowAddProcedure(true)} className="col-span-2 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5 group">
                   <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add Clinical Note / Procedure
               </button>
               <button onClick={() => setShowRecordPayment(true)} className="py-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                   <DollarSign className="w-4 h-4 text-emerald-600" /> Record Payment
               </button>
               <button onClick={() => setShowUploadImage(true)} className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                   <Upload className="w-4 h-4 text-slate-400" /> Upload X-Ray
               </button>
           </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODALS & FULLSCREEN VIEWS */}
      {/* ============================================================== */}
      
      {showExcelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-50 w-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
               <h2 className="font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Full Financial Ledger
               </h2>
               <button onClick={() => setShowExcelModal(false)} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl transition-colors">
                  Close Ledger
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ExcelFinancialReport
                payments={payments}
                patients={[patient]}
                doctors={doctors}
                toothRecords={toothRecords}
                clinicSettings={clinicSettings}
                onDeletePayment={onDeletePayment ? (pId, _pName, amt) => onDeletePayment(pId, amt) : undefined}
                onPrintReceipt={(pay) => setSelectedPaymentForReceipt(pay)}
              />
            </div>
          </div>
        </div>
      )}

      {showAddProcedure && (
        <AddProcedureModal
          toothNumber={selectedToothNumber || 16}
          doctors={doctors}
          onSubmit={handleAddProcedureSubmit}
          onClose={() => setShowAddProcedure(false)}
        />
      )}

      {showUploadImage && (
        <ImageUploadModal
          patientId={patient.id}
          toothNumber={selectedToothNumber || 16}
          onUpload={handleAddImageSubmit}
          onClose={() => setShowUploadImage(false)}
          onOpenDicomViewer={(file) => {
            setDicomFileToView(file);
            setShowUploadImage(false);
            setShowDicomViewer(true);
          }}
        />
      )}

      {selectedImageForViewer && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <XrayViewer
              imageUrl={selectedImageForViewer.url}
              imageType={selectedImageForViewer.type}
              toothNumber={selectedImageForViewer.toothNumber}
              fileName={selectedImageForViewer.fileName}
              date={selectedImageForViewer.date}
              onDelete={
                onDeletePatientImage
                  ? () => {
                      onDeletePatientImage(selectedImageForViewer.id);
                      setSelectedImageForViewer(null);
                    }
                  : undefined
              }
              onClose={() => setSelectedImageForViewer(null)}
            />
          </div>
        </div>
      )}

      {showDicomViewer && (
        <div className="fixed inset-0 z-[100]">
            <DicomViewer
              initialFile={dicomFileToView}
              patientName={patient.name}
              onCaptureFrame={(dataUrl, fileName) => {
                onAddPatientImage({
                  patientId: patient.id,
                  toothNumber: selectedToothNumber || 16,
                  type: 'CBCT Slice',
                  url: dataUrl,
                  fileName,
                  date: new Date().toISOString().split('T')[0],
                  uploadedBy: clinicSettings.doctorName || 'Lead Doctor',
                  fileSizeMb: 0.3
                });
                alert('Captured DICOM snapshot saved to patient media gallery!');
              }}
              onClose={() => {
                setShowDicomViewer(false);
                setDicomFileToView(null);
              }}
            />
        </div>
      )}

      {showRecordPayment && (
        <PaymentFormModal
          patientId={patient.id}
          patientName={patient.name}
          currentBalance={patient.balance}
          onSubmit={handleAddPaymentSubmit}
          onClose={() => setShowRecordPayment(false)}
        />
      )}

      {selectedPaymentForReceipt && (
        <ReceiptModal
          patientName={patient.name}
          patientPhone={patient.phone}
          payment={selectedPaymentForReceipt}
          procedures={toothRecords}
          clinicSettings={clinicSettings}
          onClose={() => setSelectedPaymentForReceipt(null)}
        />
      )}
    </div>
  );
};
