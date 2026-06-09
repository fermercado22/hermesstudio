# Google Calendar Integration — Hermes Studio Bot

**Date:** 2026-06-09  
**Status:** Approved

## Context

The Hermes Studio bot (`api/chat.js`) collects meeting requests via Claude AI and notifies via Make.com webhook. This spec adds real-time Google Calendar availability checking and automatic event creation so meetings never overlap.

## Goals

- Bot checks a proposed time slot before confirming it to the user
- If the slot is taken, bot asks for an alternative within the same conversation
- When confirmed, bot creates the calendar event automatically
- Only allow meetings Monday–Friday 9:00–17:00 (last slot ends at 18:00)
- Meeting duration: 1 hour

## Architecture

### Authentication

A Google Cloud **Service Account** is used — no OAuth flow, no user login. The service account gets read/write access to the owner's personal Google Calendar by sharing the calendar with the service account email.

Credentials are stored as environment variables in Vercel:
- `GOOGLE_SERVICE_ACCOUNT_JSON` — base64-encoded JSON credentials file
- `GOOGLE_CALENDAR_ID` — owner's Google account email (calendar ID)

### New Tools Exposed to Claude

**`verificar_disponibilidad`**
```json
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM"
}
```
Returns: `"disponible"` or `"ocupado"` (or a business-hours rejection message before even calling the API).

**`registrar_lead`** (existing — extended)  
Unchanged interface. Backend now also calls `createCalendarEvent` after saving the lead.

### New Backend Functions in `api/chat.js`

**`getCalendarClient()`**  
Initializes the Google Calendar API client using the service account credentials from env vars. Returns a `google.calendar` instance.

**`checkAvailability(fecha, hora)`**  
- Validates day is Monday–Friday and hour is 09:00–17:00. Returns `{ available: false, reason: 'horario_laboral' }` immediately if not.
- Calls Google Calendar `freebusy` query for the 1-hour window.
- Returns `{ available: true }` or `{ available: false, reason: 'ocupado' }`.

**`createCalendarEvent(leadData)`**  
- Creates a Google Calendar event with: title `"Reunión Hermes Studio — {nombre}"`, description including email and interest, start/end time (1 hour), attendee email.
- Returns the created event ID.

### Conversation Flow

```
User proposes time
      ↓
Bot calls verificar_disponibilidad(fecha, hora)
      ↓
  [business hours?] — No → bot rejects, asks for L–V 9–18hs slot
      ↓ Yes
  [slot free?] — No → bot says slot taken, asks for alternative
      ↓ Yes
Bot confirms with user
      ↓
User confirms → bot calls registrar_lead(nombre, email, horario, interes)
      ↓
Backend: notifyMake() + createCalendarEvent()  ← parallel, both fire
      ↓
Bot sends confirmation message to user
```

### Error Handling

| Scenario | Behavior |
|---|---|
| Outside L–V 9–17hs | Rejected before API call; bot asks for valid slot |
| Slot occupied | Bot informs user and asks for alternative |
| Google API unreachable | Lead saved via Make.com anyway; bot confirms and notes team will confirm the time |
| Invalid credentials | Same fallback as above; error logged server-side |

## System Prompt Changes

The system prompt must instruct Claude to:
1. Always call `verificar_disponibilidad` before accepting any proposed meeting time
2. Only call `registrar_lead` after a slot has been confirmed as available
3. If the bot gets `ocupado`, naturally propose an alternative (e.g., next business day, same hour)

## Environment Variables (new)

| Variable | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Base64-encoded service account JSON from Google Cloud |
| `GOOGLE_CALENDAR_ID` | Google account email used as calendar ID |

## Dependencies

- `googleapis` npm package — Google's official Node.js client library (free, no usage cost)

## One-Time Setup Steps (owner does this once)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project
2. Enable the **Google Calendar API**
3. Create a **Service Account**, download the JSON key file
4. Base64-encode the JSON: `base64 -i credentials.json`
5. Add `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_CALENDAR_ID` to Vercel environment variables
6. In Google Calendar settings, share your calendar with the service account email (give it "Make changes to events" permission)

## Out of Scope

- WhatsApp notifications (has cost)
- Multi-timezone support
- Automatic slot suggestions (bot asks user to propose an alternative, not auto-suggest)
