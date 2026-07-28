const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const express = require('express');
const cors = require('cors');
const { z } = require('zod');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GATEWAY_URL = process.env.MAINTENANCE_GATEWAY_URL || 'https://zrrffsjbfkphridqyais.supabase.co/functions/v1/maintenance-gateway';
const API_KEY = process.env.MAINTENANCE_API_KEY;
const PORT = process.env.MCP_UBERFIX_PORT || 4006;

if (!API_KEY) {
  console.error("MAINTENANCE_API_KEY is not set in the environment.");
  process.exit(1);
}

// Helper for making Gateway calls
async function callGateway(payload) {
  try {
    const response = await axios.post(GATEWAY_URL, payload, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    return {
      content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
    };
  } catch (error) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    return {
      isError: true,
      content: [{ type: "text", text: `Gateway call failed: ${errorMsg}` }]
    };
  }
}

const server = new McpServer({
  name: "Uberfix Maintenance MCP",
  version: "1.0.0"
});

// Tool 1: Create Request
server.tool(
  "uberfix_create_request",
  "Create a new maintenance request through the Uberfix Gateway",
  {
    client_name: z.string().describe("The full name of the client (e.g., 'أحمد عزب - فرع أبوعوف')"),
    client_phone: z.string().describe("The phone number of the client"),
    service_type: z.enum(["plumbing", "electrical", "ac", "painting", "carpentry", "cleaning", "general", "appliance", "pest_control", "landscaping", "finishing", "renovation", "structural", "facade"]).describe("The category of the service"),
    description: z.string().describe("Detailed description of the maintenance issue"),
    priority: z.enum(["low", "normal", "high", "urgent"]).describe("Priority level of the request")
  },
  async (args) => {
    const payload = {
      channel: "api",
      client_name: args.client_name,
      client_phone: args.client_phone,
      service_type: args.service_type,
      description: args.description,
      priority: args.priority
    };
    return await callGateway(payload);
  }
);

// Tool 2: Get Status
server.tool(
  "uberfix_get_status",
  "Get the current status and workflow stage of a maintenance request",
  {
    request_id: z.string().describe("The UUID of the maintenance request")
  },
  async (args) => {
    const payload = {
      channel: "api",
      action: "get_status",
      client_name: "mcp_agent",
      request_id: args.request_id
    };
    return await callGateway(payload);
  }
);

// Tool 3: Transition Stage
server.tool(
  "uberfix_transition_stage",
  "Transition a maintenance request to a new workflow stage",
  {
    request_id: z.string().describe("The UUID of the maintenance request"),
    to_stage: z.enum([
      "triaged", "assigned", "scheduled", "in_progress",
      "inspection", "waiting_parts", "completed", "billed", "paid", "closed"
    ]).describe("The target workflow stage"),
    reason: z.string().describe("The reason or context for this transition (e.g., 'تم تعيين الفني')")
  },
  async (args) => {
    const payload = {
      channel: "api",
      action: "transition_stage",
      client_name: "mcp_agent",
      request_id: args.request_id,
      to_stage: args.to_stage,
      reason: args.reason
    };
    return await callGateway(payload);
  }
);

// Tool 4: Add Note
server.tool(
  "uberfix_add_note",
  "Add a text note or comment to a maintenance request",
  {
    request_id: z.string().describe("The UUID of the maintenance request"),
    note: z.string().describe("The content of the note to be added")
  },
  async (args) => {
    const payload = {
      channel: "api",
      action: "add_note",
      client_name: "mcp_agent",
      request_id: args.request_id,
      note: args.note
    };
    return await callGateway(payload);
  }
);

// Delay helper
const delay = ms => new Promise(res => setTimeout(res, ms));

// Tool 5: Super Macro Execution (Agentic Auto-Pilot)
server.tool(
  "uberfix_execute_macro",
  "Run a complete automated workflow (macro) with a single command.",
  {
    macro_name: z.enum(["simulate_full_lifecycle", "assign_and_schedule"]).describe("The name of the macro to execute"),
    payload: z.any().describe("Optional payload for the macro. E.g., for assign_and_schedule, provide { request_id: '...' }")
  },
  async (args) => {
    try {
      const logs = [];
      const log = (msg) => logs.push(`[${new Date().toISOString()}] ${msg}`);

      if (args.macro_name === "simulate_full_lifecycle") {
        log("Starting full lifecycle simulation...");
        
        // 1. Create Request
        const createRes = await axios.post(GATEWAY_URL, {
          channel: "api",
          client_name: "Auto-Pilot Simulator",
          client_phone: "01000000000",
          service_type: "general",
          description: "Full simulation test from MCP Macro",
          priority: "urgent"
        }, { headers: { 'x-api-key': API_KEY } });
        
        const reqId = createRes.data.request_id;
        log(`Created request: ${reqId}`);
        await delay(2000);

        // Stages to walk through
        const stages = ["triaged", "assigned", "scheduled", "in_progress", "completed", "closed"];
        for (const stage of stages) {
          log(`Transitioning to ${stage}...`);
          await axios.post(GATEWAY_URL, {
            channel: "api",
            action: "transition_stage",
            client_name: "mcp_agent",
            request_id: reqId,
            to_stage: stage,
            reason: `Auto-transitioning to ${stage} via Macro`
          }, { headers: { 'x-api-key': API_KEY } });
          await delay(2000);
        }

        log("Full lifecycle simulation completed successfully.");
        return { content: [{ type: "text", text: logs.join('\n') }] };
      } 
      
      else if (args.macro_name === "assign_and_schedule") {
        const reqId = args.payload?.request_id;
        if (!reqId) throw new Error("Missing request_id in payload");

        log(`Starting assign_and_schedule for ${reqId}...`);
        
        // Assign
        log("Assigning technician...");
        await axios.post(GATEWAY_URL, {
          channel: "api", action: "transition_stage", client_name: "mcp_agent", request_id: reqId, to_stage: "assigned", reason: "Auto assigned"
        }, { headers: { 'x-api-key': API_KEY } });
        await delay(1500);

        // Add Note
        log("Adding scheduling note...");
        await axios.post(GATEWAY_URL, {
          channel: "api", action: "add_note", client_name: "mcp_agent", request_id: reqId, note: "The technician will arrive at 5 PM."
        }, { headers: { 'x-api-key': API_KEY } });
        await delay(1500);

        // Schedule
        log("Setting to scheduled...");
        await axios.post(GATEWAY_URL, {
          channel: "api", action: "transition_stage", client_name: "mcp_agent", request_id: reqId, to_stage: "scheduled", reason: "Auto scheduled"
        }, { headers: { 'x-api-key': API_KEY } });

        log("Macro assign_and_schedule completed.");
        return { content: [{ type: "text", text: logs.join('\n') }] };
      }
      
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      return { isError: true, content: [{ type: "text", text: `Macro failed: ${errorMsg}` }] };
    }
  }
);

// Depending on how this is launched, start Stdio or SSE transport
const args = process.argv.slice(2);
if (args.includes('--stdio')) {
  // Stdio Mode (for Cursor, Claude Desktop, etc.)
  async function runStdio() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Uberfix Maintenance MCP server running on stdio");
  }
  runStdio().catch(console.error);
} else {
  // SSE Mode (for Remote Agents like Dify)
  const app = express();
  app.use(cors());

  // Authentication Middleware to prevent unauthorized access
  app.use((req, res, next) => {
    let apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    // Support Authorization: Bearer <token>
    if (!apiKey && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        apiKey = parts[1];
      } else if (parts.length === 1) {
        apiKey = parts[0];
      }
    }

    if (apiKey !== API_KEY) {
      console.warn("Unauthorized access attempt rejected.");
      return res.status(401).json({ error: "Unauthorized. Invalid API Key." });
    }
    next();
  });

  let transport;
  
  app.get('/sse', async (req, res) => {
    console.log("New SSE Connection");
    // Pass the absolute callback path considering Nginx reverse proxy
    transport = new SSEServerTransport('/mcp-uberfix/message', res);
    await server.connect(transport);
  });

  app.post('/message', async (req, res) => {
    if (!transport) {
      res.status(400).send('No active SSE connection');
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Uberfix Maintenance MCP SSE server listening on http://127.0.0.1:${PORT}/sse`);
    console.log(`Run with --stdio flag to run in stdio mode.`);
  });
}
