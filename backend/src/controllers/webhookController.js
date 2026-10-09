const Lead = require('../models/Lead');
const { fetchLeadDetails, parseLeadFields } = require('../services/metaService');
const { getIO } = require('../services/socketService');

/**
 * GET /webhook
 * Meta sends a GET request first to verify our endpoint.
 * We need to respond with the hub.challenge value if the token matches.
 */
exports.verify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.warn('Webhook verification failed — token mismatch');
  return res.sendStatus(403);
};

/**
 * POST /webhook
 * Called by Meta every time someone submits a lead form.
 *
 * The payload structure looks roughly like:
 * {
 *   object: "page",
 *   entry: [{
 *     id: "<page_id>",
 *     changes: [{
 *       field: "leadgen",
 *       value: { leadgen_id: "...", form_id: "...", page_id: "..." }
 *     }]
 *   }]
 * }
 *
 * We pull out each lead ID, hit the Graph API for the full details,
 * save to MongoDB, and push the new lead to connected clients.
 */
exports.receive = async (req, res) => {
  // Always respond 200 quickly — Meta retries if we take too long
  res.sendStatus(200);

  const body = req.body;

  if (body.object !== 'page') return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen') continue;

      const { leadgen_id, form_id, page_id } = change.value;

      console.log(`New lead received — ID: ${leadgen_id}`);

      try {
        // Fetch actual lead details from Meta
        const leadData = await fetchLeadDetails(leadgen_id);
        const fields = parseLeadFields(leadData.field_data);

        // Save to database
        const lead = await Lead.create({
          leadId: leadgen_id,
          formId: form_id || leadData.form_id,
          pageId: page_id,
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          rawFields: fields.raw,
          source: 'meta',
        });

        console.log(`Lead saved: ${fields.name} (${fields.email})`);

        // Push to all connected mobile clients
        getIO().emit('new_lead', lead);
      } catch (err) {
        console.error(`Failed to process lead ${leadgen_id}:`, err.message);
      }
    }
  }
};
