const router = require('express').Router();
const ctrl = require('../controllers/orders.controller');
const { requireAdmin, requireWorker } = require('../middleware/auth');

router.get('/', requireAdmin, ctrl.getAll);
router.get('/local/:localId/today', requireWorker, ctrl.getTodayByLocal);
router.get('/:id', requireWorker, ctrl.getOne);
router.get('/:id/qr', requireWorker, ctrl.getQR);
router.post('/', requireWorker, ctrl.create);
router.patch('/:id/confirm', requireWorker, ctrl.confirmPayment);

module.exports = router;
