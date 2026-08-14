import React, { useState } from 'react';
import { PaymentMethod, Payment } from '../types';
import { CreditCard, Camera, Check, DollarSign, FileCheck, ShieldCheck } from 'lucide-react';

interface PaymentFormModalProps {
  patientId: string;
  patientName: string;
  currentBalance: number;
  onSubmit: (paymentData: Omit<Payment, 'id'>) => void;
  onClose: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'InstaPay', 'Visa', 'Bank', 'Other'];

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  patientId,
  patientName,
  currentBalance,
  onSubmit,
  onClose
}) => {
  const [amount, setAmount] = useState<number>(currentBalance > 0 ? currentBalance : 1000);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setProofPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const remainingAfterPayment = Math.max(0, currentBalance - Number(amount));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    onSubmit({
      patientId,
      patientName,
      amount: Number(amount),
      date: new Date().toISOString(),
      method,
      proofUrl: proofPreviewUrl || (method === 'InstaPay' ? 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80' : undefined),
      notes: notes.trim(),
      remainingBalanceSnapshot: remainingAfterPayment
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Record Payment</h2>
              <p className="text-xs text-slate-500">{patientName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 text-xl font-bold rounded-xl hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
          {/* Amount Paid */}
          <div className="space-y-1 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Amount Collected (EGP) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(currentBalance)}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                Pay Full ({currentBalance} EGP)
              </button>
            </div>
            <input
              type="number"
              required
              min="1"
              step="50"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-2xl font-black font-mono text-emerald-700 bg-white p-3 rounded-xl border border-emerald-300 focus:border-emerald-500 outline-none shadow-2xs"
            />
            <div className="flex justify-between text-xs font-bold text-slate-500 pt-1">
              <span>Outstanding Before: {currentBalance} EGP</span>
              <span className={remainingAfterPayment === 0 ? 'text-emerald-700 font-extrabold' : 'text-amber-600'}>
                Remaining After: {remainingAfterPayment} EGP
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    method === m
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* InstaPay / Visa Proof Screenshot Attachment */}
          {(method === 'InstaPay' || method === 'Visa' || method === 'Bank') && (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-sky-800">
                <Camera className="w-4 h-4 text-sky-600" />
                <span>{file ? 'Proof Attached ✓' : 'Attach InstaPay / Visa Transfer Screenshot'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {proofPreviewUrl && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-sky-200">
                  <img src={proofPreviewUrl} alt="Proof" className="w-10 h-10 object-cover rounded-md" />
                  <span className="text-xs text-sky-900 font-medium truncate flex-1">{file?.name || 'InstaPay Screenshot'}</span>
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Transaction Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Partial payment for Zirconia crown, receipt issued"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 shadow-md transition-colors"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
