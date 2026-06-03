/**
 * routes/queries.js
 * ==========================================================
 * Generic query/lookup endpoints for all services
 * (decoupled from any specific platform or service)
 */

'use strict';

const express = require('express');
const router = express.Router();
const { getSupabaseAdmin } = require('../supabase');

// Helper function to query UberFix maintenance requests
async function performMaintenanceQuery(req, res, searchParams) {
  const requestId = req.requestId || 'n/a';
  try {
    const { request_number, client_phone } = searchParams;
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      throw new Error('Supabase client is not configured on the server');
    }

    const queryParams = {};
    if (request_number) queryParams.request_number = String(request_number).trim();
    if (client_phone) queryParams.client_phone = String(client_phone).trim();

    if (Object.keys(queryParams).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide request_number or client_phone to search' 
      });
    }

    // Query 'maintenance_requests' table directly
    let query = supabase.from('maintenance_requests').select('*');
    
    if (queryParams.request_number) {
      query = query.eq('request_number', queryParams.request_number);
    }
    if (queryParams.client_phone) {
      query = query.eq('client_phone', queryParams.client_phone);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error(`[SERVICES][QUERIES][MAINTENANCE][${requestId}]`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while querying maintenance requests'
    });
  }
}

// ── [1] Query UberFix Maintenance (supports POST for body params) ──
router.post('/maintenance', async (req, res) => {
  await performMaintenanceQuery(req, res, req.body || {});
});

// ── [2] Query UberFix Maintenance (supports GET for query parameters) ──
router.get('/maintenance', async (req, res) => {
  await performMaintenanceQuery(req, res, req.query || {});
});

module.exports = router;
