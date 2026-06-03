/**
 * routes/requests.js
 * ==========================================================
 * Generic POST endpoints for creating/submitting requests
 * (decoupled from any specific platform or service)
 */

'use strict';

const express = require('express');
const axios = require('axios');
const router = express.Router();

const { getSupabaseAdmin } = require('../supabase');

// ── [1] Create UberFix Maintenance Request ──
router.post('/maintenance', async (req, res) => {
  const requestId = req.requestId || 'n/a';
  try {
    const { title, description, client_name, client_phone, service_type, channel } = req.body || {};
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      throw new Error('Supabase client is not configured on the server');
    }

    if (!title || !client_name || !client_phone || !service_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, client_name, client_phone, service_type' 
      });
    }

    // Generate request number in format: AZ-UF-YY-MM-00XXXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    const requestNumber = `AZ-UF-${yy}-${mm}-00${seq}`;

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        title: title.trim(),
        description: (description || 'تم إنشاؤه عبر بوابة الـ API').trim(),
        client_name: client_name.trim(),
        client_phone: client_phone.trim(),
        service_type: service_type.trim(),
        priority: 'medium',
        channel: channel || 'api_gateway',
        request_number: requestNumber,
        status: 'Open',
        workflow_stage_v2: 'draft',
        request_status_derived: 'open',
        workflow_stage: 'draft'
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Maintenance request created successfully',
      request_number: requestNumber,
      data: data
    });
  } catch (error) {
    console.error(`[SERVICES][REQUESTS][MAINTENANCE][${requestId}]`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while creating maintenance request'
    });
  }
});

// ── [2] Create Daftra Project ──
router.post('/project', async (req, res) => {
  const requestId = req.requestId || 'n/a';
  try {
    const { name, description, budget, client_id } = req.body || {};
    const daftraApiKey = process.env.DAFTRA_API_KEY;
    const daftraSubdomain = process.env.DAFTRA_SUBDOMAIN;

    if (!daftraApiKey || !daftraSubdomain) {
      throw new Error('Daftra credentials are not configured on the server');
    }

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: name' 
      });
    }

    // Normalizing subdomain
    let cleanSubdomain = daftraSubdomain.trim();
    cleanSubdomain = cleanSubdomain.replace(/^https?:\/\//i, '');
    cleanSubdomain = cleanSubdomain.replace(/\.daftra\.com.*$/i, '');
    cleanSubdomain = cleanSubdomain.replace(/\/+$/, '');

    const daftraPayload = {
      Project: {
        name: name.trim(),
        description: (description || 'مشروع تم إنشاؤه عبر بوابة الـ API').trim(),
        budget: parseFloat(budget) || 0,
        client_id: client_id ? parseInt(client_id) : null,
        status: 'active'
      }
    };

    const response = await axios.post(`https://${cleanSubdomain}.daftra.com/api2/projects`, daftraPayload, {
      headers: {
        'APIKEY': daftraApiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 201) {
      return res.status(200).json({
        success: true,
        message: 'Project created successfully in Daftra',
        project_id: response.data.id || response.data.data?.id,
        project_name: name
      });
    }

    return res.status(400).json({ 
      success: false, 
      error: 'Daftra platform failed to create project' 
    });
  } catch (error) {
    console.error(`[SERVICES][REQUESTS][PROJECT][${requestId}]`, error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while creating Daftra project'
    });
  }
});

module.exports = router;
