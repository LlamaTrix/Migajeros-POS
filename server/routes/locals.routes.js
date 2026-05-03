const router = require('express').Router();
const ctrl = require('../controllers/locals.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, ctrl.getAll);
router.get('/:id', requireAdmin, ctrl.getOne);
router.post('/', requireAdmin, ctrl.create);
router.put('/:id', requireAdmin, ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
