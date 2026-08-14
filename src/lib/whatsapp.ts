/**
 * Generates zero-cost pre-filled WhatsApp wa.me URL
 * Cleans phone number to format 201XXXXXXXXX for Egyptian numbers
 */
export function formatEgyptPhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('01')) {
    clean = '20' + clean;
  } else if (clean.startsWith('1')) {
    clean = '20' + clean;
  } else if (!clean.startsWith('20') && clean.length === 10) {
    clean = '20' + clean;
  }
  return clean;
}

export function generateAppointmentReminderWhatsAppLink(
  patientName: string,
  phone: string,
  date: string,
  time: string,
  doctorName: string = 'Dr. Mohamed',
  clinicName: string = 'ClinicPro Dental Practice'
): string {
  const cleanPhone = formatEgyptPhone(phone);

  const message = `مرحباً ${patientName} 👋
نود تذكيركم بموعدكم القادم في ${clinicName} مع ${doctorName}:
📅 التاريخ: ${date}
⏰ الساعة: ${time}

يرجى التأكيد بالحضور أو التواصل لإعادة الجدولة. شكراً لكم! 🦷

Hello ${patientName},
Reminder for your dental appointment at ${clinicName}:
📅 Date: ${date}
⏰ Time: ${time}

Please reply to confirm your attendance. Thank you!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function generateFollowUpWhatsAppLink(
  patientName: string,
  phone: string,
  procedureName: string = 'Dental Treatment',
  clinicName: string = 'ClinicPro Dental Practice'
): string {
  const cleanPhone = formatEgyptPhone(phone);

  const message = `مرحباً ${patientName} 👋
نتمنى أن تكون بخير من ${clinicName}.
لاحظنا وجود استكمال لخطة العلاج الخاصة بكم (${procedureName}) لم يتم تحديد موعد لها بعد.

هل ترغب في تحديد الموعد القادم هذا الأسبوع؟ 🦷

Hello ${patientName},
Greetings from ${clinicName}.
We noticed your treatment plan (${procedureName}) has a pending next step. Would you like to schedule your next visit?`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
