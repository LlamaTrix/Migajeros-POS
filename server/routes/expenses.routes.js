const router = require('express').Router();
const ctrl = require('../controllers/expenses.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/categories', requireAdmin, ctrl.getCategories);
router.get('/summary',    requireAdmin, ctrl.summary);
router.get('/',           requireAdmin, ctrl.getAll);
router.post('/',          requireAdmin, ctrl.create);
router.put('/:id',        requireAdmin, ctrl.update);
router.delete('/:id',     requireAdmin, ctrl.remove);

module.exports = router;
