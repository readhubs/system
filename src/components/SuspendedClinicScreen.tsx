import React from 'react';
import { AlertOctagon, Phone, MessageSquare, CreditCard, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SuspendedClinicScreenProps {
  clinicName: string;
  onLogout: () => void;
}

export function SuspendedClinicScreen({ clinicName, onLogout }: SuspendedClinicScreenProps) {
  const adminWhatsApp = '201271476215'; // Default Egyptian admin WhatsApp

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `مرحباً، أود تجديد اشتراك عيادة (${clinicName}) عبر انستاباي InstaPay لتفعيل الحساب.`
    );
    window.open(`https://wa.me/${adminWhatsApp}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-white">Subscription Suspended</h1>
          <p className="text-sm text-slate-400">
            تم إيقاف اشتراك عيادة <span className="text-indigo-400 font-bold">{clinicName}</span> مؤقتاً.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-left space-y-2.5">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>طرق التجديد السريع (InstaPay):</span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <p>1. التحويل عبر انستاباي InstaPay إلى الحساب المعتمد.</p>
            <p>2. إرسال إيصال التحويل عبر واتساب للإدارة لتفعيل الحساب فوراً.</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleWhatsAppContact}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            تواصل لتفعيل الاشتراك عبر واتساب
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
