import React, { useState } from 'react';
import { Payment, Patient, ToothRecord, Doctor, ClinicSettings } from '../types';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle2,
  X,
  Trash2,
  Receipt
} from 'lucide-react';
import { exportToCSV } from '../lib/firestoreService';

interface ExcelFinancialReportProps {
  payments: Payment[];
  patients: Patient[];
  doctors: Doctor[];
  toothRecords?: ToothRecord[];
  clinicSettings?: ClinicSettings;
  onDeletePayment?: (paymentId: string, patientId: string, amount: number) => void;
  onPrintReceipt?: (payment: Payment) => void;
  onClose?: () => void;
}

export const ExcelFinancialReport: React.FC<ExcelFinancialReportProps> = ({
  payments,
  patients,
  doctors,
  toothRecords = [],
  clinicSettings,
  onDeletePayment,
  onPrintReceipt,
  onClose
}) => {
  const [filterDoctorId, setFilterDoctorId] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (filterMethod !== 'all' && p.method !== filterMethod) return false;
    if (filterDoctorId !== 'all') {
      const patient = patients.find((pat) => pat.id === p.patientId);
      // check if any procedure was performed by this doctor for the patient
    }
    if (startDate && p.date && p.date.slice(0, 10) < startDate) return false;
    if (endDate && p.date && p.date.slice(0, 10) > endDate) return false;
    return true;
  });

  // Calculate metrics
  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalCash = filteredPayments.filter((p) => p.method === 'Cash').reduce((acc, p) => acc + p.amount, 0);
  const totalInstaPay = filteredPayments.filter((p) => p.method === 'InstaPay').reduce((acc, p) => acc + p.amount, 0);
  const totalCard = filteredPayments.filter((p) => p.method === 'Card').reduce((acc, p) => acc + p.amount, 0);
  const totalVodafone = filteredPayments.filter((p) => p.method === 'Vodafone Cash').reduce((acc, p) => acc + p.amount, 0);

  const totalOutstandingBalance = patients.reduce((acc, pat) => acc + (pat.balance > 0 ? pat.balance : 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcelCsv = () => {
    const rows = filteredPayments.map((p, idx) => ({
      'Row #': idx + 1,
      'Receipt ID': p.id,
      'Date & Time': p.date ? new Date(p.date).toLocaleString('en-GB') : 'N/A',
      'Patient Name': p.patientName,
      'Amount (EGP)': p.amount,
      'Payment Method': p.method,
      'Notes': p.notes || '',
      'Proof Reference': p.proofUrl ? 'Attached' : 'None',
      'Remaining Balance Snapshot': p.remainingBalanceSnapshot ?? 0
    }));

    exportToCSV(`Clinic_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0">
      {/* Top Excel Ribbon Toolbar (Hidden when printing) */}
      <div className="bg-emerald-800 text-white p-5 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              Financial Summary & Revenue Ledger
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                Excel Sheet View
              </span>
            </h2>
            <p className="text-xs text-emerald-200">
              {clinicSettings?.name || 'ClinicPro Dental Center'} • Generated: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcelCsv}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV / Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            Print Ledger (PDF)
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar (Hidden when printing) */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs font-semibold print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700 font-bold">Method:</span>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-800"
          >
            <option value="all">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="InstaPay">InstaPay</option>
            <option value="Card">Visa / Card</option>
            <option value="Vodafone Cash">Vodafone Cash</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-slate-700 font-bold">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-800"
          />
          <span className="text-slate-700 font-bold">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-800"
          />
        </div>

        {(filterMethod !== 'all' || startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setFilterMethod('all');
              setStartDate('');
              setEndDate('');
            }}
            className="text-rose-600 hover:text-rose-700 font-bold text-xs underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Print Document Header (Visible ONLY on print) */}
      <div className="hidden print:block p-6 border-b-2 border-emerald-800 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{clinicSettings?.name || 'ClinicPro Dental Center'}</h1>
            <p className="text-xs text-slate-600 mt-0.5">{clinicSettings?.address || 'Cairo, Egypt'} • Tel: {clinicSettings?.phone || '01012345678'}</p>
            <p className="text-sm font-bold text-emerald-800 mt-2">OFFICIAL FINANCIAL SUMMARY & CASH REVENUE LEDGER</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
            <p>Doctor: {clinicSettings?.doctorName || 'Dr. Mohamed Al-Sayed'}</p>
            <p>Transactions: {filteredPayments.length}</p>
          </div>
        </div>
      </div>

      {/* Excel Formula Summary Metrics Box */}
      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 border-b border-slate-200">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            =SUM(Total Collections)
          </span>
          <span className="text-xl font-black text-emerald-600 block mt-1">
            {totalCollected.toLocaleString()} <span className="text-xs font-bold text-slate-500">EGP</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">{filteredPayments.length} entries</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            =SUM(Cash Drawer)
          </span>
          <span className="text-xl font-black text-slate-800 block mt-1">
            {totalCash.toLocaleString()} <span className="text-xs font-bold text-slate-500">EGP</span>
          </span>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
            {totalCollected > 0 ? Math.round((totalCash / totalCollected) * 100) : 0}% of collections
          </span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            =SUM(InstaPay & Electronic)
          </span>
          <span className="text-xl font-black text-purple-700 block mt-1">
            {(totalInstaPay + totalCard + totalVodafone).toLocaleString()} <span className="text-xs font-bold text-slate-500">EGP</span>
          </span>
          <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">
            InstaPay: {totalInstaPay.toLocaleString()} EGP
          </span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Total Patients Outstanding Due
          </span>
          <span className="text-xl font-black text-rose-600 block mt-1">
            {totalOutstandingBalance.toLocaleString()} <span className="text-xs font-bold text-slate-500">EGP</span>
          </span>
          <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">Receivables from active patients</span>
        </div>
      </div>

      {/* Styled Excel Grid Table */}
      <div className="overflow-x-auto p-4 sm:p-6">
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          {/* Excel Column Headers */}
          <thead>
            <tr className="bg-emerald-800 text-white font-bold tracking-wider text-[11px] uppercase border border-emerald-900">
              <th className="border border-emerald-700 p-2.5 text-center w-12">#</th>
              <th className="border border-emerald-700 p-2.5">Date & Time</th>
              <th className="border border-emerald-700 p-2.5">Receipt #</th>
              <th className="border border-emerald-700 p-2.5">Patient Name</th>
              <th className="border border-emerald-700 p-2.5">Payment Method</th>
              <th className="border border-emerald-700 p-2.5 text-right">Amount (EGP)</th>
              <th className="border border-emerald-700 p-2.5 text-right">Balance After</th>
              <th className="border border-emerald-700 p-2.5">Notes / Reference</th>
              {(onDeletePayment || onPrintReceipt) && (
                <th className="border border-emerald-700 p-2.5 text-center w-24 print:hidden">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p, index) => (
                <tr
                  key={p.id}
                  className={`hover:bg-emerald-50/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <td className="border border-slate-200 p-2.5 text-center font-mono text-slate-400 text-[11px]">
                    {index + 1}
                  </td>
                  <td className="border border-slate-200 p-2.5 whitespace-nowrap text-slate-700 font-semibold">
                    {p.date ? new Date(p.date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                  </td>
                  <td className="border border-slate-200 p-2.5 font-mono text-slate-500 text-[11px]">
                    {p.id.slice(0, 10)}
                  </td>
                  <td className="border border-slate-200 p-2.5 font-bold text-slate-900">
                    {p.patientName}
                  </td>
                  <td className="border border-slate-200 p-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        p.method === 'Cash'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : p.method === 'InstaPay'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : p.method === 'Vodafone Cash'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-sky-100 text-sky-800 border-sky-300'
                      }`}
                    >
                      {p.method}
                    </span>
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-black text-emerald-700 font-mono text-sm">
                    {p.amount.toLocaleString()} EGP
                  </td>
                  <td className="border border-slate-200 p-2.5 text-right font-semibold text-slate-600 font-mono text-[11px]">
                    {p.remainingBalanceSnapshot !== undefined ? `${p.remainingBalanceSnapshot.toLocaleString()} EGP` : '-'}
                  </td>
                  <td className="border border-slate-200 p-2.5 text-slate-500 text-[11px] truncate max-w-xs">
                    {p.notes || '-'}
                  </td>
                  {(onDeletePayment || onPrintReceipt) && (
                    <td className="border border-slate-200 p-2 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        {onPrintReceipt && (
                          <button
                            type="button"
                            onClick={() => onPrintReceipt(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Print / View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        {onDeletePayment && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete payment of ${p.amount.toLocaleString()} EGP for ${p.patientName}? This will restore ${p.amount.toLocaleString()} EGP to patient's outstanding balance.`)) {
                                onDeletePayment(p.id, p.patientId, p.amount);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Payment Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={onDeletePayment || onPrintReceipt ? 9 : 8} className="p-8 text-center text-slate-400">
                  No payment records match the selected filter.
                </td>
              </tr>
            )}
          </tbody>

          {/* Excel Formula Summary Footer */}
          <tfoot>
            <tr className="bg-emerald-50 border-t-2 border-emerald-600 font-black text-slate-900">
              <td colSpan={5} className="border border-slate-300 p-3 text-right uppercase tracking-wider text-xs">
                Grand Total Collected:
              </td>
              <td className="border border-slate-300 p-3 text-right text-emerald-800 font-mono text-base">
                {totalCollected.toLocaleString()} EGP
              </td>
              <td colSpan={(onDeletePayment || onPrintReceipt) ? 3 : 2} className="border border-slate-300 p-3 text-slate-500 text-xs font-normal">
                {filteredPayments.length} Total Verified Receipts
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Print Signature Footer */}
      <div className="hidden print:flex justify-between items-end p-8 mt-12 border-t border-slate-300 text-xs">
        <div>
          <p className="font-bold text-slate-800">Prepared By: Reception / Accounting</p>
          <div className="w-48 h-0.5 bg-slate-300 mt-8"></div>
        </div>
        <div>
          <p className="font-bold text-slate-800">Authorized Signature & Stamp</p>
          <div className="w-48 h-0.5 bg-slate-300 mt-8"></div>
        </div>
      </div>
    </div>
  );
};
