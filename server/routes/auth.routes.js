const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { requireWorker } = require('../middleware/auth');

router.post('/admin/login', ctrl.adminLogin);
router.post('/worker/login', ctrl.workerLogin);
router.post('/worker/logout', requireWorker, ctrl.workerLogout);

module.exports = router;
