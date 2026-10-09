const router = require('express').Router();
const leadCtrl = require('../controllers/leadController');

router.get('/', leadCtrl.getAll);
router.post('/', leadCtrl.create);
router.delete('/:id', leadCtrl.remove);

// Simulate a Meta webhook payload — useful for testing the full
// webhook pipeline (save + socket push) without needing Meta at all.
// POST /api/leads/simulate-webhook with { name, email, phone }
router.post('/simulate-webhook', leadCtrl.simulateWebhook);

module.exports = router;
