import React, { useState } from 'react';
import { Payment, ToothRecord, Doctor, ClinicSettings } from '../types';
import { DollarSign, Printer, TrendingUp, ShieldAlert, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface FinancialReportsPageProps {
  payments: Payment[];
  toothRecords: ToothRecord[];
  doctors: Doctor[];
  clinicSettings: ClinicSettings;
}

export const FinancialReportsPage: React.FC<FinancialReportsPageProps> = ({
  payments,
  toothRecords,
  doctors,
  clinicSettings
}) => {
  const [startDate, setStartDate] = useState<string>('2026-07-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');

  // Filter payments & records by date range
  const filteredPayments = payments.filter((p) => {
    const pDate = p.date.split('T')[0];
    return pDate >= startDate && pDate <= endDate;
  });

  const filteredRecords = toothRecords.filter((r) => {
    return r.date >= startDate && r.date <= endDate;
  });

  // Calculate Aggregates
  const totalGrossRevenue = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstandingDebt = Math.max(0, totalGrossRevenue - totalCollected);

  // Breakdown by Payment Method
  const byMethod = filteredPayments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  // Contributing Doctors Commission Owed
  const commissionsOwedMap: Record<
    string,
    { doctorName: string; doctorType: string; totalDue: number; count: number }
  > = {};

  filteredRecords.forEach((r) => {
    if (r.contributingDoctorId && r.commissionPercent && r.commissionPercent > 0) {
      const docId = r.contributingDoctorId;
      const due = (r.cost * r.commissionPercent) / 100;
      const doc = doctors.find((d) => d.id === docId);

      if (!commissionsOwedMap[docId]) {
        commissionsOwedMap[docId] = {
          doctorName: r.contributingDoctorName || doc?.name || 'External Doctor',
          doctorType: doc?.type || 'external-referral',
          totalDue: 0,
          count: 0
        };
      }
      commissionsOwedMap[docId].totalDue += due;
      commissionsOwedMap[docId].count += 1;
    }
  });

  // Procedure Breakdown
  const procedureBreakdownMap: Record<string, { count: number; totalAmount: number }> = {};

  filteredRecords.forEach((r) => {
    if (!procedureBreakdownMap[r.procedureName]) {
      procedureBreakdownMap[r.procedureName] = { count: 0, totalAmount: 0 };
    }
    procedureBreakdownMap[r.procedureName].count += 1;
    procedureBreakdownMap[r.procedureName].totalAmount += r.cost;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" /> Practice Financial & Profit Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Custom date range revenue, collected cash, outstanding debt, and doctor referral commissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs font-mono font-bold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-0 outline-none cursor-pointer"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-0 outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-xl font-extrabold text-xs hover:bg-sky-700 shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" /> Print A4 Summary
          </button>
        </div>
      </div>

      {/* PRINTABLE REPORT CANVAS */}
      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-8" id="printable-report">
        {/* Printable Header */}
        <div className="flex justify-between items-end border-b-2 border-emerald-600 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {clinicSettings.name} - FINANCIAL STATEMENT
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{clinicSettings.address}</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p className="font-bold text-slate-800">
              Period: {startDate} to {endDate}
            </p>
            <p className="text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Core KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Gross Treatment Revenue</p>
            <p className="text-2xl font-black font-mono text-slate-900">{totalGrossRevenue.toLocaleString()} EGP</p>
          </div>

          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
            <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Total Collected Payments</p>
            <p className="text-2xl font-black font-mono text-emerald-700">{totalCollected.toLocaleString()} EGP</p>
          </div>

          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
            <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Outstanding Patient Debt</p>
            <p className="text-2xl font-black font-mono text-amber-600">{outstandingDebt.toLocaleString()} EGP</p>
          </div>
        </div>

        {/* Collection Breakdown by Method */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Collections Breakdown by Payment Method
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
            {['Cash', 'InstaPay', 'Visa', 'Bank'].map((m) => (
              <div key={m} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">{m}:</span>
                <span className="font-mono font-extrabold text-slate-900">
                  {(byMethod[m] || 0).toLocaleString()} EGP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contributing & External Doctors Commission Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Referral & Specialist Doctor Commissions Owed
          </h3>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-3">Doctor Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-center">Procedures Count</th>
                  <th className="p-3 text-right">Commission Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(commissionsOwedMap).length > 0 ? (
                  Object.values(commissionsOwedMap).map((comm, idx) => (
                    <tr key={idx} className="font-medium">
                      <td className="p-3 font-bold text-slate-900">{comm.doctorName}</td>
                      <td className="p-3 font-semibold text-slate-600 capitalize">{comm.doctorType}</td>
                      <td className="p-3 text-center font-mono font-bold">{comm.count}</td>
                      <td className="p-3 text-right font-mono font-black text-amber-700">
                        {comm.totalDue.toLocaleString()} EGP
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      No referral doctor commissions recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Procedure Type Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Procedure Revenue Breakdown
          </h3>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <th className="p-3">Procedure Name</th>
                  <th className="p-3 text-center">Count</th>
                  <th className="p-3 text-right">Total Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(procedureBreakdownMap).length > 0 ? (
                  Object.entries(procedureBreakdownMap).map(([pName, data], idx) => (
                    <tr key={idx} className="font-medium">
                      <td className="p-3 font-bold text-slate-900">{pName}</td>
                      <td className="p-3 text-center font-mono font-bold">{data.count}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                        {data.totalAmount.toLocaleString()} EGP
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-400">
                      No procedures recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 pt-6 border-t border-slate-100">
          <p className="font-semibold">{clinicSettings.name} • Internal Practice Financial Summary</p>
          <p>For internal clinical record keeping and referral doctor settlement.</p>
        </div>
      </div>
    </div>
  );
};
