import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'media' | 'treatments' | 'financials'>('overview');
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(16);

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

  // Filtered by selected tooth
  const toothSpecificRecords = selectedToothNumber
    ? toothRecords.filter((r) => r.toothNumber === selectedToothNumber)
    : [];

  const toothSpecificImages = selectedToothNumber
    ? patientImages.filter((i) => i.toothNumber === selectedToothNumber)
    : [];

  // Filtered lab orders for this patient
  const patientLabOrders = labOrders.filter((o) => o.patientId === patient.id);

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
        surface: 'O',
        doctorName: clinicSettings.doctorName || 'Chief Doctor',
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
      alert('Failed to generate PowerPoint file. Please check console.');
    } finally {
      setExportingPptx(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!patient.phone) return;
    const cleanPhone = patient.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone.replace(/^0/, '')}`;
    const msg = `Salam ${patient.name}, this is ${clinicSettings.name || 'ClinicPro Dental'}. Regarding your dental treatment file and upcoming appointments...`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Color coding calculations
  const isHighRisk = patient.medicalAlerts && patient.medicalAlerts.length > 0;
  const isBalanceDue = patient.balance > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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
            Export Clinical Dossier (.PPTX)
          </button>
        </div>
      </div>

      {/* Patient Header Banner */}
      <PatientHeader
        patient={patient}
        onEditPatient={onEditPatientModalOpen}
        onDeletePatient={onDeletePatient ? () => onDeletePatient(patient.id) : undefined}
      />

      {/* 5-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto no-print">
        {[
          { id: 'overview', label: '1. Overview & Bio', icon: User },
          { id: 'chart', label: '2. Dental Chart & FDI Odontogram', icon: Stethoscope },
          { id: 'media', label: `3. Media & DICOM Viewer (${patientImages.length})`, icon: FileImage },
          { id: 'treatments', label: `4. Treatments & Labs (${toothRecords.length + patientLabOrders.length})`, icon: Layers },
          { id: 'financials', label: `5. Financials & Excel (${payments.length})`, icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & CLINICAL BIO */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Demographics & Medical Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Medical Alerts (Strict Red / Yellow / Green Color Coding) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  Medical Health Alerts & Clinical Risk Contraindications
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    isHighRisk
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {isHighRisk ? 'High Clinical Risk' : 'Cleared for Treatment'}
                </span>
              </div>

              {isHighRisk ? (
                <div className="flex flex-wrap gap-2">
                  {patient.medicalAlerts!.map((alert, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-900 font-extrabold text-xs shadow-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  No known systemic medical allergies, cardiac risks, or bleeding disorders.
                </div>
              )}

              {patient.medicalNotes && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
                  <strong className="text-slate-900 font-bold block mb-1">Doctor's Medical Notes:</strong>
                  {patient.medicalNotes}
                </div>
              )}
            </div>

            {/* Quick Treatment Snapshot */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                Odontogram Treatment Summary
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Logged Procedures</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{toothRecords.length}</span>
                </div>
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-emerald-700 font-bold block text-[10px] uppercase">Completed</span>
                  <span className="text-xl font-black text-emerald-800 font-mono mt-1 block">
                    {toothRecords.filter((r) => r.status === 'completed').length}
                  </span>
                </div>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-amber-800 font-bold block text-[10px] uppercase">Planned / Pending</span>
                  <span className="text-xl font-black text-amber-900 font-mono mt-1 block">
                    {toothRecords.filter((r) => r.status === 'planned').length}
                  </span>
                </div>
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl">
                  <span className="text-purple-800 font-bold block text-[10px] uppercase">Lab Work Orders</span>
                  <span className="text-xl font-black text-purple-900 font-mono mt-1 block">
                    {patientLabOrders.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Quick Actions & Financial Due Card */}
          <div className="space-y-6">
            {/* Account Status Card (Strict Color Coding: Red if balance > 0, Green if 0) */}
            <div
              className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                isBalanceDue ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Account Balance</span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    isBalanceDue
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {isBalanceDue ? 'Unpaid Balance Due' : 'Account Fully Settled'}
                </span>
              </div>

              <div>
                <span
                  className={`text-3xl font-black font-mono block ${
                    isBalanceDue ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {patient.balance.toLocaleString()} <span className="text-xs font-bold text-slate-500">EGP</span>
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPayment(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Collect Payment / Issue Receipt
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('financials')}
                  className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  View Financial Statement
                </button>
              </div>
            </div>

            {/* Quick Actions Drawer */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Quick Actions</h4>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('chart');
                  setShowAddProcedure(true);
                }}
                className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-extrabold border border-sky-200 transition-all flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-600" /> Record Dental Procedure
                </span>
                <ChevronRight className="w-4 h-4 text-sky-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('media');
                  setShowUploadImage(true);
                }}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-extrabold border border-slate-200 transition-all flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-600" /> Upload X-Ray / Photo
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleExportPptx}
                className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-extrabold border border-purple-200 transition-all flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-purple-600" /> Generate PowerPoint (.PPTX)
                </span>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DENTAL CHART (ODONTOGRAM) */}
      {/* ============================================================== */}
      {activeTab === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Odontogram */}
          <div className="lg:col-span-2 space-y-6">
            <DentalChart
              toothStatus={patient.toothStatus || {}}
              onToothSelect={(num) => setSelectedToothNumber(num)}
              onQuickAction={handleQuickAction}
              selectedToothNumber={selectedToothNumber}
            />
          </div>

          {/* Right Col: Selected Tooth Details */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-sky-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono text-sky-700">
                    #{selectedToothNumber || 16}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Tooth #{selectedToothNumber || 16} Details
                    </h3>
                    <p className="text-[11px] text-slate-400 capitalize">
                      Status: {patient.toothStatus?.[selectedToothNumber || 16] || 'Healthy'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono">
                  {toothSpecificRecords.length} Procedures
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProcedure(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" /> Record Treatment on #{selectedToothNumber}
                </button>

                <button
                  type="button"
                  onClick={() => setShowUploadImage(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 shadow-sm transition-all"
                >
                  <Upload className="w-4 h-4" /> Upload Radiograph for #{selectedToothNumber}
                </button>
              </div>

              {/* Tooth History List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Procedures for Tooth #{selectedToothNumber}
                </h4>

                {toothSpecificRecords.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {toothSpecificRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs group relative"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900">{rec.procedureName}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-600">{rec.cost} EGP</span>
                            {onDeleteToothRecord && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete procedure "${rec.procedureName}" for Tooth #${rec.toothNumber}?`)) {
                                    onDeleteToothRecord(rec.id, rec.cost);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Delete procedure"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">{rec.date} • {rec.performingDoctorName}</p>
                        {rec.notes && <p className="text-[11px] italic text-slate-600">{rec.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No procedures recorded yet for Tooth #{selectedToothNumber}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MEDIA & DICOM VIEWER */}
      {/* ============================================================== */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* DICOM Viewer Inline Bar / Launcher */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">Client-Side DICOM 2D/3D Slice Engine</h3>
              </div>
              <p className="text-xs text-slate-400">
                Directly inspect raw DICOM (.dcm) dental files with live contrast/windowing, bone/soft-tissue filters, and frame capture.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDicomViewer(true)}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-sky-600/30"
              >
                <Sparkles className="w-4 h-4" />
                Launch DICOM Viewer
              </button>

              <button
                type="button"
                onClick={() => setShowUploadImage(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload New Photo / X-Ray
              </button>
            </div>
          </div>

          {/* Embedded DICOM Viewer if toggled */}
          {showDicomViewer && (
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
              onClose={() => setShowDicomViewer(false)}
            />
          )}

          {/* Radiograph & Photo Gallery */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Radiograph & Photo Archive</h3>
                <p className="text-xs text-slate-500">Auto-compressed images under 500KB for offline instant preview</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {patientImages.length > 0 ? (
                patientImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImageForViewer(img)}
                    className="group relative cursor-pointer aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs hover:shadow-lg transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.type}
                      className="object-cover h-full w-full group-hover:scale-105 transition-transform"
                    />

                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-sky-600 text-white font-mono px-2 py-0.5 rounded-md w-fit font-bold">
                          Tooth #{img.toothNumber || 'All'}
                        </span>
                        {onDeletePatientImage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this radiograph / image?')) {
                                onDeletePatientImage(img.id);
                              }
                            }}
                            className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-md"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-center">
                        <Eye className="w-6 h-6 mx-auto mb-1 text-sky-400" />
                        <span className="text-xs font-bold">Open Fullscreen Viewer</span>
                      </div>
                      <span className="text-[10px] text-slate-300 truncate">{img.type}</span>
                    </div>

                    {/* Corner Badge */}
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-700">
                      {img.type}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-slate-400 text-xs">
                  No radiographs or photos uploaded yet. Click "Upload New Photo / X-Ray" to add clinical images.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: TREATMENTS & DENTAL LABS */}
      {/* ============================================================== */}
      {activeTab === 'treatments' && (
        <div className="space-y-6">
          {/* Linked Dental Lab Orders for this patient */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Dental Lab Prosthetics & Orders ({patientLabOrders.length})
                </h3>
                <p className="text-xs text-slate-500">Zirconia crowns, veneers, and dentures ordered for {patient.name}</p>
              </div>
            </div>

            {patientLabOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientLabOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-2 text-xs relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{order.restorationType}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            order.status === 'Fitted'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : order.status === 'Delivered'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {order.status}
                        </span>
                        {onDeleteLabOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete lab order "${order.restorationType}" for ${order.labName}?`)) {
                                onDeleteLabOrder(order.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Lab Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-purple-800 font-bold">Lab: {order.labName}</p>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span>Teeth: <strong>{order.toothNumbers.map((t) => `#${t}`).join(', ')}</strong></span>
                      <span>•</span>
                      <span>Shade: <strong className="text-amber-700">{order.shade}</strong></span>
                      <span>•</span>
                      <span>Cost: <strong>{order.cost.toLocaleString()} EGP</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No external dental lab orders currently assigned to this patient.
              </p>
            )}
          </div>

          {/* Full Clinical Procedures Timeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Clinical Procedures Log</h3>
                <p className="text-xs text-slate-500">Comprehensive chronological treatment history</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProcedure(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl font-black text-xs hover:bg-sky-700 shadow-md"
              >
                <Plus className="w-4 h-4" /> Record Procedure
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {toothRecords.length > 0 ? (
                toothRecords.map((rec) => (
                  <div key={rec.id} className="py-4 space-y-2 hover:bg-slate-50/60 p-3 rounded-2xl transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-md">
                          Tooth #{rec.toothNumber}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm">{rec.procedureName}</h4>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            rec.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-slate-900 text-sm">{rec.cost.toLocaleString()} EGP</span>
                        {onDeleteToothRecord && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete procedure "${rec.procedureName}" (Tooth #${rec.toothNumber})?`)) {
                                onDeleteToothRecord(rec.id, rec.cost);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Procedure"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      Doctor: <strong className="text-slate-900">{rec.performingDoctorName || 'Dr. Mohamed'}</strong>
                    </p>

                    {rec.notes && (
                      <p className="text-xs italic text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        "{rec.notes}"
                      </p>
                    )}

                    <div className="text-[11px] font-mono text-slate-400">Date: {rec.date}</div>
                  </div>
                ))
              ) : (
                <p className="text-center py-12 text-slate-400 text-xs">No procedures recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: FINANCIALS & EXCEL PRINTING */}
      {/* ============================================================== */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Excel-Style Financial Ledger Component */}
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
      )}

      {/* ============================================================== */}
      {/* MODALS */}
      {/* ============================================================== */}
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
            setShowDicomViewer(true);
            setActiveTab('media');
          }}
        />
      )}

      {selectedImageForViewer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <XrayViewer
              imageUrl={selectedImageForViewer.url}
              imageType={selectedImageForViewer.type}
              toothNumber={selectedImageForViewer.toothNumber}
              fileName={selectedImageForViewer.fileName}
              date={selectedImageForViewer.date}
              onDelete={
                onDeletePatientImage
                  ? () => onDeletePatientImage(selectedImageForViewer.id)
                  : undefined
              }
              onClose={() => setSelectedImageForViewer(null)}
            />
          </div>
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
