/**
 * Utilitaires pour générer des liens d'ajout aux calendriers
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date; // Si non fourni, utilise startDate + 1h
}

/**
 * Formate une date au format ISO pour les calendriers
 * Format: YYYYMMDDTHHMMSSZ
 */
function formatDateForCalendar(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Génère un lien pour Google Calendar
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = formatDateForCalendar(event.startDate);
  const endDate = event.endDate
    ? formatDateForCalendar(event.endDate)
    : formatDateForCalendar(new Date(event.startDate.getTime() + 60 * 60 * 1000)); // +1h par défaut

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
  });

  if (event.description) {
    params.append('details', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Génère un lien pour Outlook Calendar
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const startDate = event.startDate.toISOString();
  const endDate = event.endDate
    ? event.endDate.toISOString()
    : new Date(event.startDate.getTime() + 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    subject: event.title,
    startdt: startDate,
    enddt: endDate,
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  if (event.description) {
    params.append('body', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Génère un lien pour Office 365 Calendar
 */
export function generateOffice365CalendarUrl(event: CalendarEvent): string {
  const startDate = event.startDate.toISOString();
  const endDate = event.endDate
    ? event.endDate.toISOString()
    : new Date(event.startDate.getTime() + 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    subject: event.title,
    startdt: startDate,
    enddt: endDate,
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  if (event.description) {
    params.append('body', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Génère un fichier .ics pour Apple Calendar, Thunderbird, etc.
 */
export function generateICSFile(event: CalendarEvent): string {
  const startDate = formatDateForCalendar(event.startDate);
  const endDate = event.endDate
    ? formatDateForCalendar(event.endDate)
    : formatDateForCalendar(new Date(event.startDate.getTime() + 60 * 60 * 1000));

  const now = formatDateForCalendar(new Date());

  // Nettoyer la description pour le format ICS
  const cleanDescription = (event.description || '')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ESL Team//Running Data//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@eslteam.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${cleanDescription}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return icsContent;
}

/**
 * Télécharge un fichier .ics
 */
export function downloadICSFile(event: CalendarEvent): void {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
