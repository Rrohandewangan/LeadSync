const router = require('express').Router();
const webhookCtrl = require('../controllers/webhookController');

// Meta hits GET first to verify, then POST for actual events
router.get('/', webhookCtrl.verify);
router.post('/', webhookCtrl.receive);

module.exports = router;
