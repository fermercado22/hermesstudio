const CALENDLY_API = 'https://api.calendly.com';

async function fetchCalendly(path) {
  if (!process.env.CALENDLY_TOKEN) {
    throw new Error('CALENDLY_TOKEN env var is not set');
  }
  const response = await fetch(`${CALENDLY_API}${path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.CALENDLY_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Calendly API error: ${response.status}`);
  }
  return response.json();
}

let cachedEventType = null;

async function getEventType() {
  if (cachedEventType) return cachedEventType;

  const userResponse = await fetchCalendly('/users/me');
  const userUri = userResponse.resource.uri;

  const eventTypesResponse = await fetchCalendly(
    `/event_types?user=${encodeURIComponent(userUri)}&active=true`
  );

  const slug = process.env.CALENDLY_EVENT_SLUG;
  const eventType = eventTypesResponse.collection.find(et => et.slug === slug)
    || eventTypesResponse.collection[0];

  if (!eventType) {
    throw new Error('No active event types found in Calendly account');
  }

  cachedEventType = eventType;
  return cachedEventType;
}

async function getAvailableSlots(fecha) {
  console.log('[calendly] step 1: getting event type');
  const eventType = await getEventType();
  console.log('[calendly] step 2: event type uri:', eventType.uri);

  const startTime = `${fecha}T00:00:00-03:00`;
  const endTime = `${fecha}T23:59:59-03:00`;
  console.log('[calendly] step 3: querying availability', startTime, endTime);

  const response = await fetchCalendly(
    `/event_type_available_times?event_type=${encodeURIComponent(eventType.uri)}&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`
  );

  console.log('[calendly] step 4: slots raw count:', response.collection?.length);

  return response.collection
    .filter(slot => slot.status === 'available')
    .map(slot => {
      const date = new Date(slot.start_time);
      const hours = (date.getUTCHours() - 3 + 24) % 24;
      const minutes = date.getUTCMinutes();
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    });
}

async function buildCalendlyLink(fecha) {
  const eventType = await getEventType();
  return `${eventType.scheduling_url}?date=${fecha}`;
}

module.exports = { getAvailableSlots, buildCalendlyLink };
