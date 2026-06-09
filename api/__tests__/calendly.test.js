beforeEach(() => {
  jest.resetModules();
  process.env.CALENDLY_TOKEN = 'test-token';
  process.env.CALENDLY_EVENT_SLUG = '30min';
});

afterEach(() => {
  jest.restoreAllMocks();
});

function mockFetch(responses) {
  let callCount = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    const response = responses[callCount++];
    return Promise.resolve({
      ok: response.ok !== false,
      status: response.status || 200,
      json: () => Promise.resolve(response.data),
    });
  });
}

const USER_URI = 'https://api.calendly.com/users/abc123';
const EVENT_TYPE_URI = 'https://api.calendly.com/event_types/xyz789';
const SCHEDULING_URL = 'https://calendly.com/mercadomarcaida/30min';

const mockUserResponse = {
  data: { resource: { uri: USER_URI } },
};

const mockEventTypesResponse = {
  data: {
    collection: [
      { uri: EVENT_TYPE_URI, slug: '30min', scheduling_url: SCHEDULING_URL },
    ],
  },
};

describe('getAvailableSlots', () => {
  test('returns available times in HH:MM format (Buenos Aires UTC-3)', async () => {
    mockFetch([
      mockUserResponse,
      mockEventTypesResponse,
      {
        data: {
          collection: [
            { start_time: '2026-06-15T12:00:00.000000Z', status: 'available' },
            { start_time: '2026-06-15T13:00:00.000000Z', status: 'available' },
          ],
        },
      },
    ]);

    const { getAvailableSlots } = require('../calendly');
    const slots = await getAvailableSlots('2026-06-15');

    expect(slots).toEqual(['09:00', '10:00']);
  });

  test('returns empty array when no slots available', async () => {
    mockFetch([
      mockUserResponse,
      mockEventTypesResponse,
      { data: { collection: [] } },
    ]);

    const { getAvailableSlots } = require('../calendly');
    const slots = await getAvailableSlots('2026-06-15');

    expect(slots).toEqual([]);
  });

  test('filters out unavailable slots', async () => {
    mockFetch([
      mockUserResponse,
      mockEventTypesResponse,
      {
        data: {
          collection: [
            { start_time: '2026-06-15T12:00:00.000000Z', status: 'available' },
            { start_time: '2026-06-15T13:00:00.000000Z', status: 'unavailable' },
          ],
        },
      },
    ]);

    const { getAvailableSlots } = require('../calendly');
    const slots = await getAvailableSlots('2026-06-15');

    expect(slots).toEqual(['09:00']);
  });

  test('throws when CALENDLY_TOKEN is missing', async () => {
    delete process.env.CALENDLY_TOKEN;
    const { getAvailableSlots } = require('../calendly');
    await expect(getAvailableSlots('2026-06-15')).rejects.toThrow('CALENDLY_TOKEN env var is not set');
  });

  test('throws when event type slug is not found', async () => {
    mockFetch([
      mockUserResponse,
      { data: { collection: [{ uri: EVENT_TYPE_URI, slug: 'other-slug', scheduling_url: SCHEDULING_URL }] } },
    ]);

    const { getAvailableSlots } = require('../calendly');
    await expect(getAvailableSlots('2026-06-15')).rejects.toThrow('Event type with slug "30min" not found');
  });
});

describe('buildCalendlyLink', () => {
  test('returns scheduling URL with date parameter', async () => {
    mockFetch([mockUserResponse, mockEventTypesResponse]);

    const { buildCalendlyLink } = require('../calendly');
    const link = await buildCalendlyLink('2026-06-15');

    expect(link).toBe('https://calendly.com/mercadomarcaida/30min?date=2026-06-15');
  });
});
