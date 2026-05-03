const router = require('express').Router();
const ctrl = require('../controllers/reports.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/summary', requireAdmin, ctrl.summary);
router.get('/daily', requireAdmin, ctrl.daily);
router.get('/by-local', requireAdmin, ctrl.byLocal);
router.get('/by-worker', requireAdmin, ctrl.byWorker);
router.get('/by-product', requireAdmin, ctrl.byProduct);
router.get('/by-hour', requireAdmin, ctrl.byHour);

module.exports = router;
