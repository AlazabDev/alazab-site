'use strict';

const express = require('express');
const router = express.Router();
const logger = require('../logger');

// ── GET /api/notifications (Fetch notifications) ──────────────────
router.get('/', async (req, res) => {
  try {
    // TODO: Fetch from Database (e.g. Supabase)
    const mockNotifications = [
      {
        id: 1,
        title: 'ترحيب',
        message: 'أهلاً بك في نظام الإشعارات الجديد!',
        isRead: false,
        createdAt: new Date()
      }
    ];

    res.status(200).json({
      success: true,
      data: mockNotifications
    });
  } catch (error) {
    logger.error('[Notifications] GET error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── POST /api/notifications (Create new notification) ──────────────
router.post('/', async (req, res) => {
  try {
    const { title, message, targetUserId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required to create a notification' });
    }

    // TODO: Insert into Database
    const newNotification = {
      id: Date.now().toString(),
      title: title || 'إشعار جديد',
      message,
      targetUserId: targetUserId || 'all',
      isRead: false,
      createdAt: new Date()
    };

    logger.info(`[Notifications] Created new notification: ${newNotification.title}`);
    
    res.status(201).json({
      success: true,
      data: newNotification
    });
  } catch (error) {
    logger.error('[Notifications] POST error', { error: error.message });
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// ── PATCH /api/notifications/:id/read (Mark as read) ──────────────
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Update Database record to isRead = true
    logger.info(`[Notifications] Marked notification ${id} as read`);

    res.status(200).json({
      success: true,
      message: `Notification ${id} has been marked as read`
    });
  } catch (error) {
    logger.error(`[Notifications] PATCH error for id ${req.params.id}`, { error: error.message });
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ── DELETE /api/notifications/:id (Delete a notification) ─────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Delete from Database
    logger.info(`[Notifications] Deleted notification ${id}`);

    res.status(200).json({
      success: true,
      message: `Notification ${id} deleted successfully`
    });
  } catch (error) {
    logger.error(`[Notifications] DELETE error for id ${req.params.id}`, { error: error.message });
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;
