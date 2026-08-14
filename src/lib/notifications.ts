import { Appointment } from '../types';

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied' as NotificationPermission);
  }
  return Notification.requestPermission();
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options
      });
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  }
}

// Checks upcoming appointments and triggers notifications 30 minutes before
export function checkUpcomingAppointmentsAndNotify(appointments: Appointment[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  appointments.forEach((appt) => {
    if (appt.date !== todayStr || appt.status === 'cancelled' || appt.status === 'completed') return;

    const [hours, minutes] = appt.time.split(':').map(Number);
    const apptDate = new Date();
    apptDate.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.floor((apptDate.getTime() - now.getTime()) / (1000 * 60));

    // Notify if appointment is in 29 to 31 minutes
    if (diffMinutes >= 29 && diffMinutes <= 31) {
      const storageKey = `notified_appt_${appt.id}_30m`;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, 'true');
        sendLocalNotification(`Upcoming Appointment in 30 mins`, {
          body: `Patient: ${appt.patientName}\nTime: ${appt.time} - ${appt.procedure}`,
          tag: `appt_30m_${appt.id}`
        });
      }
    }
  });
}

// Fired daily around 7 AM
export function checkDaily7AMSummaryAndNotify(appointments: Appointment[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const hours = now.getHours();

  if (hours === 7) {
    const todayStr = now.toISOString().split('T')[0];
    const storageKey = `notified_7am_${todayStr}`;

    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, 'true');
      const todayAppts = appointments.filter((a) => a.date === todayStr);
      sendLocalNotification(`Daily Practice Morning Briefing ☀️`, {
        body: `You have ${todayAppts.length} scheduled appointment(s) today. Click to open ClinicPro.`,
        tag: `daily_summary_${todayStr}`
      });
    }
  }
}
