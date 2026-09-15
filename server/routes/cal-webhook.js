'use strict';

const express = require('express');
const crypto = require('crypto');

const logger = require('../logger');
const db = require('../db');

const router = express.Router();


// ============================================================
// Helpers
// ============================================================

function verifyCalSignature(req) {
  const secret = process.env.CAL_WEBHOOK_SECRET;

  if (!secret) {
    return {
      ok: false,
      status: 500,
      error: 'CAL_WEBHOOK_SECRET is missing',
    };
  }

  const signatureHeader = req.headers['x-cal-signature-256'];

  if (!signatureHeader) {
    return {
      ok: false,
      status: 401,
      error: 'Missing x-cal-signature-256 header',
    };
  }

  if (!req.rawBody || !Buffer.isBuffer(req.rawBody)) {
    return {
      ok: false,
      status: 400,
      error: 'Raw webhook body is unavailable',
    };
  }

  const received = String(signatureHeader)
    .trim()
    .replace(/^sha256=/i, '')
    .toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(received)) {
    return {
      ok: false,
      status: 401,
      error: 'Invalid Cal.com signature format',
    };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  const receivedBuffer = Buffer.from(received, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return {
      ok: false,
      status: 401,
      error: 'Invalid Cal.com signature',
    };
  }

  return { ok: true };
}


function eventHash(rawBody) {
  return crypto
    .createHash('sha256')
    .update(rawBody)
    .digest('hex');
}


function normalizeEvent(body) {
  const triggerEvent =
    typeof body?.triggerEvent === 'string'
      ? body.triggerEvent
      : null;

  /*
   * MEETING_STARTED / MEETING_ENDED use a flat payload.
   *
   * Everything else normally uses body.payload.
   *
   * Fallback to body makes the receiver tolerant of future
   * Cal.com payload changes instead of rejecting new events.
   */
  const flat =
    triggerEvent === 'MEETING_STARTED' ||
    triggerEvent === 'MEETING_ENDED';

  const data = flat
    ? body
    : (
        body?.payload &&
        typeof body.payload === 'object'
          ? body.payload
          : body
      );

  return {
    triggerEvent,
    createdAt: body?.createdAt || data?.createdAt || null,
    data,
    raw: body,
  };
}


function responseValue(responses, key) {
  const item = responses?.[key];

  if (item == null) {
    return null;
  }

  if (
    typeof item === 'string' ||
    typeof item === 'number' ||
    typeof item === 'boolean'
  ) {
    return item;
  }

  if (item.value !== undefined) {
    return item.value;
  }

  if (item.response !== undefined) {
    return item.response;
  }

  return null;
}


function firstAttendee(data) {
  if (Array.isArray(data?.attendees) && data.attendees.length) {
    return data.attendees[0] || {};
  }

  return {};
}


function bookingIdentity(data) {
  return {
    bookingId:
      data?.bookingId ??
      data?.id ??
      data?.booking?.id ??
      null,

    bookingUid:
      data?.uid ??
      data?.bookingUid ??
      data?.booking?.uid ??
      null,

    eventTypeId:
      data?.eventTypeId ??
      data?.eventType?.id ??
      data?.booking?.eventTypeId ??
      data?.booking?.eventType?.id ??
      null,
  };
}


function statusFromEvent(triggerEvent, data) {
  if (data?.status) {
    return data.status;
  }

  switch (triggerEvent) {
    case 'BOOKING_CANCELLED':
      return 'CANCELLED';

    case 'BOOKING_REJECTED':
      return 'REJECTED';

    case 'BOOKING_REQUESTED':
      return 'PENDING';

    case 'BOOKING_CREATED':
    case 'BOOKING_RESCHEDULED':
    case 'BOOKING_PAID':
    case 'INSTANT_MEETING_ACCEPTED':
      return 'ACCEPTED';

    default:
      return null;
  }
}


function textLocation(location) {
  if (location == null) {
    return null;
  }

  if (typeof location === 'string') {
    return location;
  }

  try {
    return JSON.stringify(location);
  } catch {
    return String(location);
  }
}


// ============================================================
// Database
// ============================================================

async function storeWebhookEvent(req, event) {
  const identity = bookingIdentity(event.data);
  const hash = eventHash(req.rawBody);

  const result = await db.query(
    `
      INSERT INTO cal_webhook_events (
        event_hash,
        trigger_event,
        cal_created_at,

        booking_id,
        booking_uid,
        event_type_id,

        webhook_version,
        request_id,

        payload,
        raw_payload,

        processing_status
      )
      VALUES (
        $1,
        $2,
        $3,

        $4,
        $5,
        $6,

        $7,
        $8,

        $9::jsonb,
        $10::jsonb,

        'received'
      )

      ON CONFLICT (event_hash)
      DO NOTHING

      RETURNING id
    `,
    [
      hash,
      event.triggerEvent,
      event.createdAt,

      identity.bookingId,
      identity.bookingUid,
      identity.eventTypeId,

      req.headers['x-cal-webhook-version'] || null,
      req.requestId || null,

      JSON.stringify(event.data || {}),
      JSON.stringify(event.raw || {}),
    ]
  );

  return {
    hash,
    id: result.rows[0]?.id || null,
    duplicate: result.rowCount === 0,
  };
}


async function markEventProcessed(eventId) {
  if (!eventId) {
    return;
  }

  await db.query(
    `
      UPDATE cal_webhook_events
      SET
        processing_status = 'processed',
        processed_at = NOW(),
        processing_attempts = processing_attempts + 1,
        last_error = NULL
      WHERE id = $1
    `,
    [eventId]
  );
}


async function markEventFailed(eventId, error) {
  if (!eventId) {
    return;
  }

  await db.query(
    `
      UPDATE cal_webhook_events
      SET
        processing_status = 'failed',
        processing_attempts = processing_attempts + 1,
        last_error = $2
      WHERE id = $1
    `,
    [
      eventId,
      String(error || 'Unknown processing error').slice(0, 4000),
    ]
  );
}


async function upsertBooking(event) {
  const data = event.data || {};
  const identity = bookingIdentity(data);

  /*
   * Many Cal events do not represent bookings:
   *
   * FORM_SUBMITTED
   * FORM_SUBMITTED_NO_EVENT
   * OOO_CREATED
   * delegation credential events
   * WRONG_ASSIGNMENT_REPORT in some forms
   *
   * These remain safely stored in cal_webhook_events.
   */
  if (!identity.bookingUid) {
    return null;
  }

  const attendee = firstAttendee(data);

  const attendeeName =
    attendee?.name ||
    responseValue(data.responses, 'name') ||
    null;

  const attendeeEmail =
    attendee?.email ||
    responseValue(data.responses, 'email') ||
    null;

  const attendeePhone =
    attendee?.phoneNumber ||
    attendee?.phone ||
    responseValue(data.responses, 'attendeePhoneNumber') ||
    null;

  const attendeeTimezone =
    attendee?.timeZone ||
    null;

  let noShow = null;

  if (typeof attendee?.noShow === 'boolean') {
    noShow = attendee.noShow;
  } else if (Array.isArray(data.attendees)) {
    const noShowAttendee = data.attendees.find(
      (item) => typeof item?.noShow === 'boolean'
    );

    if (noShowAttendee) {
      noShow = noShowAttendee.noShow;
    }
  }

  const status = statusFromEvent(event.triggerEvent, data);

  const result = await db.query(
    `
      INSERT INTO cal_bookings (
        cal_booking_id,
        booking_uid,
        event_type_id,

        event_title,
        title,
        description,

        status,

        start_time,
        end_time,

        location,

        organizer_name,
        organizer_email,

        attendee_name,
        attendee_email,
        attendee_phone,
        attendee_timezone,

        cancellation_reason,
        rejection_reason,

        reschedule_id,
        reschedule_uid,

        no_show,

        last_trigger_event,
        raw_booking
      )

      VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7,
        $8, $9,
        $10,
        $11, $12,
        $13, $14, $15, $16,
        $17, $18,
        $19, $20,
        $21,
        $22,
        $23::jsonb
      )

      ON CONFLICT (booking_uid)

      DO UPDATE SET
        cal_booking_id =
          COALESCE(EXCLUDED.cal_booking_id, cal_bookings.cal_booking_id),

        event_type_id =
          COALESCE(EXCLUDED.event_type_id, cal_bookings.event_type_id),

        event_title =
          COALESCE(EXCLUDED.event_title, cal_bookings.event_title),

        title =
          COALESCE(EXCLUDED.title, cal_bookings.title),

        description =
          COALESCE(EXCLUDED.description, cal_bookings.description),

        status =
          COALESCE(EXCLUDED.status, cal_bookings.status),

        start_time =
          COALESCE(EXCLUDED.start_time, cal_bookings.start_time),

        end_time =
          COALESCE(EXCLUDED.end_time, cal_bookings.end_time),

        location =
          COALESCE(EXCLUDED.location, cal_bookings.location),

        organizer_name =
          COALESCE(EXCLUDED.organizer_name, cal_bookings.organizer_name),

        organizer_email =
          COALESCE(EXCLUDED.organizer_email, cal_bookings.organizer_email),

        attendee_name =
          COALESCE(EXCLUDED.attendee_name, cal_bookings.attendee_name),

        attendee_email =
          COALESCE(EXCLUDED.attendee_email, cal_bookings.attendee_email),

        attendee_phone =
          COALESCE(EXCLUDED.attendee_phone, cal_bookings.attendee_phone),

        attendee_timezone =
          COALESCE(EXCLUDED.attendee_timezone, cal_bookings.attendee_timezone),

        cancellation_reason =
          COALESCE(
            EXCLUDED.cancellation_reason,
            cal_bookings.cancellation_reason
          ),

        rejection_reason =
          COALESCE(
            EXCLUDED.rejection_reason,
            cal_bookings.rejection_reason
          ),

        reschedule_id =
          COALESCE(EXCLUDED.reschedule_id, cal_bookings.reschedule_id),

        reschedule_uid =
          COALESCE(EXCLUDED.reschedule_uid, cal_bookings.reschedule_uid),

        no_show =
          COALESCE(EXCLUDED.no_show, cal_bookings.no_show),

        last_trigger_event =
          EXCLUDED.last_trigger_event,

        raw_booking =
          EXCLUDED.raw_booking,

        updated_at =
          NOW()

      RETURNING *
    `,
    [
      identity.bookingId,
      identity.bookingUid,
      identity.eventTypeId,

      data.eventTitle || null,
      data.title || null,
      data.description || null,

      status,

      data.startTime || null,
      data.endTime || null,

      textLocation(data.location),

      data.organizer?.name || data.user?.name || null,
      data.organizer?.email || data.user?.email || null,

      attendeeName,
      attendeeEmail,
      attendeePhone,
      attendeeTimezone,

      data.cancellationReason || null,
      data.rejectionReason || null,

      data.rescheduleId || null,
      data.rescheduleUid || null,

      noShow,

      event.triggerEvent,

      JSON.stringify(data),
    ]
  );

  return result.rows[0] || null;
}


// ============================================================
// Routes
// ============================================================

router.get('/health', async (req, res) => {
  try {
    const dbCheck = await db.query(
      `
        SELECT
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'cal_webhook_events'
          ) AS events_table,

          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'cal_bookings'
          ) AS bookings_table
      `
    );

    const tables = dbCheck.rows[0];

    return res.status(200).json({
      ok:
        Boolean(process.env.CAL_WEBHOOK_SECRET) &&
        tables.events_table &&
        tables.bookings_table,

      service: 'cal-webhook',

      secretConfigured:
        Boolean(process.env.CAL_WEBHOOK_SECRET),

      database: {
        eventsTable: tables.events_table,
        bookingsTable: tables.bookings_table,
      },

      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[CAL][HEALTH]', {
      message: error.message,
    });

    return res.status(503).json({
      ok: false,
      service: 'cal-webhook',
      secretConfigured:
        Boolean(process.env.CAL_WEBHOOK_SECRET),
      database: {
        ok: false,
      },
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});


router.post('/', async (req, res) => {
  const verification = verifyCalSignature(req);

  if (!verification.ok) {
    logger.warn('[CAL][WEBHOOK] Signature rejected', {
      requestId: req.requestId,
      error: verification.error,
    });

    return res.status(verification.status).json({
      ok: false,
      error: verification.error,
      requestId: req.requestId,
    });
  }

  const event = normalizeEvent(req.body);

  if (!event.triggerEvent) {
    return res.status(400).json({
      ok: false,
      error: 'Missing triggerEvent',
      requestId: req.requestId,
    });
  }

  let stored = null;

  try {
    /*
     * IMPORTANT:
     * Do not whitelist triggerEvent here.
     *
     * Any current or future Cal.com event is accepted and
     * persisted first.
     */
    stored = await storeWebhookEvent(req, event);

    if (stored.duplicate) {
      logger.info('[CAL][WEBHOOK] Duplicate delivery acknowledged', {
        triggerEvent: event.triggerEvent,
        eventHash: stored.hash,
        requestId: req.requestId,
      });

      return res.status(200).json({
        ok: true,
        received: true,
        duplicate: true,
        triggerEvent: event.triggerEvent,
        requestId: req.requestId,
      });
    }

    const booking = await upsertBooking(event);

    await markEventProcessed(stored.id);

    logger.info('[CAL][WEBHOOK] Event processed', {
      eventId: stored.id,
      triggerEvent: event.triggerEvent,
      bookingId: booking?.cal_booking_id || null,
      bookingUid: booking?.booking_uid || null,
      requestId: req.requestId,
    });

    return res.status(200).json({
      ok: true,
      received: true,
      duplicate: false,

      eventId: stored.id,
      triggerEvent: event.triggerEvent,

      bookingId:
        booking?.cal_booking_id || null,

      bookingUid:
        booking?.booking_uid || null,

      requestId: req.requestId,
    });
  } catch (error) {
    logger.error('[CAL][WEBHOOK] Processing failed', {
      message: error.message,
      triggerEvent: event.triggerEvent,
      requestId: req.requestId,
    });

    if (stored?.id) {
      try {
        await markEventFailed(stored.id, error.message);
      } catch (markError) {
        logger.error('[CAL][WEBHOOK] Failed to mark event failed', {
          message: markError.message,
          eventId: stored.id,
        });
      }
    }

    /*
     * 5xx intentionally asks Cal.com to retry delivery.
     */
    return res.status(500).json({
      ok: false,
      error: 'Webhook persistence failed',
      requestId: req.requestId,
    });
  }
});


module.exports = router;
