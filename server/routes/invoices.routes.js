const router = require('express').Router();
const ctrl = require('../controllers/invoices.controller');
const { requireWorker } = require('../middleware/auth');

router.get('/:orderId', requireWorker, ctrl.getByOrder);

module.exports = router;
