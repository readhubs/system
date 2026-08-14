import React, { useState } from 'react';
import { Patient, ToothRecord, PatientImage, Payment, Doctor, ClinicSettings, ToothStatus } from '../types';
import { PatientHeader } from './PatientHeader';
import { DentalChart } from './DentalChart';
import { AddProcedureModal } from './AddProcedureModal';
import { ImageUploadModal } from './ImageUploadModal';
import { XrayViewer } from './XrayViewer';
import { PaymentFormModal } from './PaymentFormModal';
import { ReceiptModal } from './ReceiptModal';
import {
  Stethoscope,
  FileText,
  FileImage,
  CreditCard,
  Plus,
  Upload,
  Clock,
  User,
  DollarSign,
  Maximize2,
  Printer,
  ChevronRight,
  Sparkles,
  Eye,
  Check
} from 'lucide-react';

interface PatientProfileProps {
  patient: Patient;
  toothRecords: ToothRecord[];
  patientImages: PatientImage[];
  payments: Payment[];
  doctors: Doctor[];
  clinicSettings: ClinicSettings;
  onUpdatePatient: (updated: Patient) => void;
  onAddToothRecord: (record: Omit<ToothRecord, 'id'>) => void;
  onAddPatientImage: (image: Omit<PatientImage, 'id'>) => void;
  onAddPayment: (payment: Omit<Payment, 'id'>) => void;
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
  onUpdatePatient,
  onAddToothRecord,
  onAddPatientImage,
  onAddPayment,
  onBack,
  onEditPatientModalOpen
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'history' | 'images' | 'payments'>('chart');
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(16);

  // Modals
  const [showAddProcedure, setShowAddProcedure] = useState<boolean>(false);
  const [showUploadImage, setShowUploadImage] = useState<boolean>(false);
  const [showRecordPayment, setShowRecordPayment] = useState<boolean>(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<PatientImage | null>(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  // Filtered by selected tooth
  const toothSpecificRecords = selectedToothNumber
    ? toothRecords.filter((r) => r.toothNumber === selectedToothNumber)
    : [];

  const toothSpecificImages = selectedToothNumber
    ? patientImages.filter((i) => i.toothNumber === selectedToothNumber)
    : [];

  const handleAddProcedureSubmit = (procData: Omit<ToothRecord, 'id'>) => {
    onAddToothRecord(procData);

    // Update patient toothStatus and balance
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

  const handleAddPaymentSubmit = (payData: Omit<Payment, 'id'>) => {
    onAddPayment(payData);

    const newBalance = Math.max(0, patient.balance - payData.amount);
    onUpdatePatient({
      ...patient,
      balance: newBalance
    });

    setShowRecordPayment(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-sky-600 transition-colors"
        >
          ← Back to Patients List
        </button>
      )}

      {/* Patient High Priority Header */}
      <PatientHeader patient={patient} onEditPatient={onEditPatientModalOpen} />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200/80 bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto no-print">
        {[
          { id: 'chart', label: 'Dental Chart', icon: Stethoscope },
          { id: 'history', label: `Procedure History (${toothRecords.length})`, icon: FileText },
          { id: 'images', label: `Radiographs & Photos (${patientImages.length})`, icon: FileImage },
          { id: 'payments', label: `Payments & Receipts (${payments.length})`, icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap ${
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

      {/* TAB 1: DENTAL CHART & TOOTH SPECIFIC DETAILS */}
      {activeTab === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: FDI Dental Chart */}
          <div className="lg:col-span-2 space-y-6">
            <DentalChart
              toothStatus={patient.toothStatus || {}}
              onToothSelect={(num) => setSelectedToothNumber(num)}
              selectedToothNumber={selectedToothNumber}
            />

            {/* Overall Patient Treatment Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Full Treatment Plan Overview
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Total Procedures:</span>
                  <p className="text-lg font-black font-mono text-slate-900">{toothRecords.length}</p>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                  <span className="text-sky-800 font-bold">Completed:</span>
                  <p className="text-lg font-black font-mono text-sky-700">
                    {toothRecords.filter((r) => r.status === 'completed').length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-900 font-bold">Planned / Needs Tx:</span>
                  <p className="text-lg font-black font-mono text-amber-700">
                    {toothRecords.filter((r) => r.status === 'planned').length}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-bold">Total Cost:</span>
                  <p className="text-lg font-black font-mono text-emerald-700">
                    {toothRecords.reduce((sum, r) => sum + r.cost, 0).toLocaleString()} EGP
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Selected Tooth Drawer Details */}
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
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900">{rec.procedureName}</span>
                          <span className="font-mono font-bold text-emerald-600">{rec.cost} EGP</span>
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

              {/* Tooth Radiographs List */}
              {toothSpecificImages.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    X-Rays for Tooth #{selectedToothNumber}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {toothSpecificImages.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImageForViewer(img)}
                        className="group relative cursor-pointer aspect-square rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center"
                      >
                        <img
                          src={img.url}
                          alt={img.type}
                          className="object-cover h-full w-full group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL PROCEDURE HISTORY TIMELINE */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Patient Procedure Timeline</h3>
              <p className="text-xs text-slate-500">Comprehensive chronological clinical procedure logs</p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddProcedure(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 shadow-md"
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
                      <h4 className="font-extrabold text-slate-900 text-base">{rec.procedureName}</h4>
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

                    <span className="font-mono font-black text-slate-900 text-base">{rec.cost.toLocaleString()} EGP</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    Performing Doctor: <strong className="text-slate-900">{rec.performingDoctorName || 'Dr. Mohamed'}</strong>
                    {rec.contributingDoctorName && (
                      <span className="ml-2 text-amber-800">
                        • Contributing / Referral: <strong>{rec.contributingDoctorName}</strong> ({rec.commissionPercent}% Comm.)
                      </span>
                    )}
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
      )}

      {/* TAB 3: RADIOGRAPHS & PHOTOS GALLERY */}
      {activeTab === 'images' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Radiograph & Clinical Photo Gallery</h3>
              <p className="text-xs text-slate-500">Periapical, OPG, CBCT slices with client-side contrast/invert tools</p>
            </div>

            <button
              type="button"
              onClick={() => setShowUploadImage(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 shadow-md"
            >
              <Upload className="w-4 h-4" /> Upload New Radiograph
            </button>
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

                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                    <span className="text-[10px] bg-sky-600 text-white font-mono px-2 py-0.5 rounded-md w-fit">
                      Tooth #{img.toothNumber}
                    </span>
                    <div className="text-center">
                      <Eye className="w-6 h-6 mx-auto mb-1 text-sky-400" />
                      <span className="text-xs font-bold">Open X-Ray Viewer</span>
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
                No radiographs or photos uploaded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS & RECEIPTS */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Payments & Statement of Account</h3>
              <p className="text-xs text-slate-500">Record cash, InstaPay, or Visa payments and issue receipts</p>
            </div>

            <button
              type="button"
              onClick={() => setShowRecordPayment(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold text-xs hover:bg-emerald-700 shadow-md"
            >
              <CreditCard className="w-4 h-4" /> Record New Payment
            </button>
          </div>

          {/* Account Balance Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Patient Account Balance</span>
              <p
                className={`text-2xl font-black font-mono mt-0.5 ${
                  patient.balance > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {patient.balance > 0 ? `${patient.balance.toLocaleString()} EGP (Owes)` : '0 EGP (Settled)'}
              </p>
            </div>

            {patient.balance > 0 && (
              <button
                type="button"
                onClick={() => setShowRecordPayment(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 shadow-xs"
              >
                Collect Outstanding Balance
              </button>
            )}
          </div>

          {/* Payments List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Payment Transaction History</h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {payments.length > 0 ? (
                payments.map((pay) => (
                  <div key={pay.id} className="p-4 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-emerald-700 font-mono">
                          +{pay.amount.toLocaleString()} EGP
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                          {pay.method}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium">{pay.notes || 'Payment collected'}</p>
                      <p className="text-[11px] font-mono text-slate-400">{new Date(pay.date).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {pay.proofUrl && (
                        <a
                          href={pay.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl font-bold border border-sky-200 hover:bg-sky-100"
                        >
                          View Proof Screenshot
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentForReceipt(pay)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold border border-slate-300"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Receipt
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-8 text-center text-slate-400 text-xs">No payments recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PROCEDURE */}
      {showAddProcedure && (
        <AddProcedureModal
          toothNumber={selectedToothNumber || 16}
          doctors={doctors}
          onSubmit={handleAddProcedureSubmit}
          onClose={() => setShowAddProcedure(false)}
        />
      )}

      {/* MODAL 2: UPLOAD IMAGE */}
      {showUploadImage && (
        <ImageUploadModal
          patientId={patient.id}
          toothNumber={selectedToothNumber || 16}
          onUpload={handleAddImageSubmit}
          onClose={() => setShowUploadImage(false)}
        />
      )}

      {/* MODAL 3: X-RAY VIEWER */}
      {selectedImageForViewer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <XrayViewer
              imageUrl={selectedImageForViewer.url}
              imageType={selectedImageForViewer.type}
              toothNumber={selectedImageForViewer.toothNumber}
              fileName={selectedImageForViewer.fileName}
              date={selectedImageForViewer.date}
              onClose={() => setSelectedImageForViewer(null)}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD PAYMENT */}
      {showRecordPayment && (
        <PaymentFormModal
          patientId={patient.id}
          patientName={patient.name}
          currentBalance={patient.balance}
          onSubmit={handleAddPaymentSubmit}
          onClose={() => setShowRecordPayment(false)}
        />
      )}

      {/* MODAL 5: RECEIPT */}
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
