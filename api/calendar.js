const { google } = require('googleapis');

function getCalendarClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set');
  }
  const raw = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8');
  const credentials = JSON.parse(raw);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
  });
  return google.calendar({ version: 'v3', auth });
}

function isBusinessHours(fecha, hora) {
  const [year, month, day] = fecha.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
  const hour = parseInt(hora.split(':')[0], 10);
  return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17;
}

async function checkAvailability(fecha, hora) {
  if (!isBusinessHours(fecha, hora)) {
    return { available: false, reason: 'horario_laboral' };
  }

  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const timeMin = new Date(`${fecha}T${hora}:00-03:00`);
  const timeMax = new Date(timeMin.getTime() + 60 * 60 * 1000);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
      items: [{ id: calendarId }],
    },
  });

  const calendarData = response.data.calendars?.[calendarId];
  if (!calendarData) {
    throw new Error(`Calendar ID "${calendarId}" not found in freebusy response`);
  }
  const busy = calendarData.busy;
  return busy.length === 0
    ? { available: true }
    : { available: false, reason: 'ocupado' };
}

async function createCalendarEvent({ nombre, email, fecha, hora, interes }) {
  if (!fecha || !hora) return;

  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const startTime = new Date(`${fecha}T${hora}:00-03:00`);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Reunión Hermes Studio — ${nombre}`,
      description: `Email: ${email}\nInterés: ${interes || 'No especificado'}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      attendees: [{ email }],
    },
  });
}

module.exports = { checkAvailability, createCalendarEvent };
