jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({})),
    },
    calendar: jest.fn(),
  },
}));

const { google } = require('googleapis');
const { checkAvailability, createCalendarEvent } = require('../calendar');

const mockFreeBusy = jest.fn();
const mockEventsInsert = jest.fn();

google.calendar.mockReturnValue({
  freebusy: { query: mockFreeBusy },
  events: { insert: mockEventsInsert },
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = Buffer.from(
    JSON.stringify({ type: 'service_account', client_email: 'bot@test.iam.gserviceaccount.com', private_key: 'fake' })
  ).toString('base64');
  process.env.GOOGLE_CALENDAR_ID = 'owner@gmail.com';
});

describe('checkAvailability', () => {
  test('returns horario_laboral for Saturday', async () => {
    const result = await checkAvailability('2026-06-13', '10:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns horario_laboral for Sunday', async () => {
    const result = await checkAvailability('2026-06-14', '10:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns horario_laboral before 9am', async () => {
    const result = await checkAvailability('2026-06-15', '08:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns horario_laboral after 17:00', async () => {
    const result = await checkAvailability('2026-06-15', '18:00');
    expect(result).toEqual({ available: false, reason: 'horario_laboral' });
  });

  test('returns available when calendar slot is free', async () => {
    mockFreeBusy.mockResolvedValue({
      data: { calendars: { 'owner@gmail.com': { busy: [] } } },
    });
    const result = await checkAvailability('2026-06-15', '10:00');
    expect(result).toEqual({ available: true });
  });

  test('returns ocupado when calendar has a conflict', async () => {
    mockFreeBusy.mockResolvedValue({
      data: {
        calendars: {
          'owner@gmail.com': {
            busy: [{ start: '2026-06-15T10:00:00-03:00', end: '2026-06-15T11:00:00-03:00' }],
          },
        },
      },
    });
    const result = await checkAvailability('2026-06-15', '10:00');
    expect(result).toEqual({ available: false, reason: 'ocupado' });
  });
});

describe('createCalendarEvent', () => {
  test('creates event with correct summary and attendee', async () => {
    mockEventsInsert.mockResolvedValue({ data: { id: 'event-123' } });

    await createCalendarEvent({
      nombre: 'María García',
      email: 'maria@example.com',
      fecha: '2026-06-15',
      hora: '10:00',
      interes: 'Redes sociales',
    });

    expect(mockEventsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'owner@gmail.com',
        requestBody: expect.objectContaining({
          summary: 'Reunión Hermes Studio — María García',
          description: expect.stringContaining('maria@example.com'),
          start: expect.objectContaining({ timeZone: 'America/Argentina/Buenos_Aires' }),
          attendees: expect.arrayContaining([{ email: 'maria@example.com' }]),
        }),
      })
    );
  });

  test('skips creation silently when fecha or hora is missing', async () => {
    await createCalendarEvent({ nombre: 'Test', email: 'test@test.com' });
    expect(mockEventsInsert).not.toHaveBeenCalled();
  });
});
