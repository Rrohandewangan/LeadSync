const Lead = require('../models/Lead');
const { getIO } = require('../services/socketService');

/**
 * GET /api/leads
 * Return all saved leads, newest first.
 */
exports.getAll = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    console.error('Error fetching leads:', err.message);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

/**
 * POST /api/leads
 * Manually add a lead — handy for testing without Meta.
 * Send JSON body: { name, email, phone }
 */
exports.create = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const lead = await Lead.create({
      name: name || '',
      email: email || '',
      phone: phone || '',
      source: 'manual',
    });

    // Push to connected clients just like a real webhook lead
    getIO().emit('new_lead', lead);

    res.status(201).json(lead);
  } catch (err) {
    console.error('Error creating lead:', err.message);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

/**
 * POST /api/leads/simulate-webhook
 * Simulates the exact same path a real Meta webhook would take:
 *   save to DB → emit Socket.IO event → lead appears on phone.
 *
 * The only difference is we skip the Graph API call since there's
 * no real Meta lead ID. This lets you test the full real-time
 * pipeline without any Meta configuration.
 *
 * Body: { name, email, phone }
 */
exports.simulateWebhook = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const lead = await Lead.create({
      leadId: `sim_${Date.now()}`,
      formId: 'simulated_form',
      pageId: 'simulated_page',
      name: name || 'Test Lead',
      email: email || 'test@example.com',
      phone: phone || '+0000000000',
      rawFields: { full_name: name, email, phone_number: phone },
      source: 'meta', // marked as meta to mimic real behaviour
    });

    console.log(`[Simulated Webhook] Lead saved: ${lead.name} (${lead.email})`);

    getIO().emit('new_lead', lead);

    res.status(201).json({
      message: 'Simulated webhook processed — lead pushed to connected clients',
      lead,
    });
  } catch (err) {
    console.error('Simulation error:', err.message);
    res.status(500).json({ error: 'Simulation failed' });
  }
};

/**
 * DELETE /api/leads/:id
 * Remove a single lead by its Mongo _id.
 */
exports.remove = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    console.error('Error deleting lead:', err.message);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};
