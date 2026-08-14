import React from 'react';
import { Payment, ToothRecord, ClinicSettings } from '../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  patientName: string;
  patientPhone: string;
  payment: Payment;
  procedures: ToothRecord[];
  clinicSettings: ClinicSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  patientName,
  patientPhone,
  payment,
  procedures,
  clinicSettings,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 no-print">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-lg">Patient Receipt & Itemized Invoice</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              Paid
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" /> Print A4 Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6" id="printable-receipt">
          {/* Clinic Header */}
          <div className="flex justify-between items-start border-b-2 border-sky-600 pb-4">
            <div>
              <h1 className="text-xl font-black text-sky-800 uppercase tracking-tight">
                {clinicSettings.name}
              </h1>
              <p className="text-xs text-slate-500 mt-1">{clinicSettings.address}</p>
              <p className="text-xs text-slate-500">Tel: {clinicSettings.phone}</p>
            </div>

            <div className="text-right font-mono">
              <h2 className="text-base font-extrabold text-slate-900 uppercase">PAYMENT RECEIPT</h2>
              <p className="text-xs text-slate-500">Receipt #: {payment.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-slate-500">Date: {new Date(payment.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 uppercase font-bold tracking-wider">Patient Name: </span>
              <span className="font-extrabold text-slate-900 text-sm">{patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider">Tel: </span>
              <span className="font-mono font-bold text-slate-800">{patientPhone}</span>
            </div>
          </div>

          {/* Itemized Procedures Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itemized Procedures</h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-2.5">Tooth #</th>
                  <th className="p-2.5">Procedure Description</th>
                  <th className="p-2.5 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {procedures.length > 0 ? (
                  procedures.map((p, idx) => (
                    <tr key={idx} className="font-medium">
                      <td className="p-2.5 font-mono font-bold text-sky-700">Tooth #{p.toothNumber}</td>
                      <td className="p-2.5">{p.procedureName}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{p.cost.toLocaleString()} EGP</td>
                    </tr>
                  ))
                ) : (
                  <tr className="font-medium">
                    <td className="p-2.5 font-mono text-slate-400">--</td>
                    <td className="p-2.5 text-slate-600">Dental Treatment Services</td>
                    <td className="p-2.5 text-right font-mono font-bold">{payment.amount.toLocaleString()} EGP</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-bold text-slate-900">{payment.method}</span>
              </div>
              <div className="flex justify-between text-base font-black text-emerald-700 border-t border-slate-200 pt-2">
                <span>Amount Paid:</span>
                <span className="font-mono">{payment.amount.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Remaining Balance:</span>
                <span className="font-mono font-bold text-amber-600">{payment.remainingBalanceSnapshot} EGP</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-slate-400 pt-6 border-t border-slate-100">
            <p className="font-semibold">Thank you for choosing {clinicSettings.name}.</p>
            <p>Computer-generated clinical statement & receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
