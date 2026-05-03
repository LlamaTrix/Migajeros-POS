const router = require('express').Router();
const ctrl = require('../controllers/products.controller');
const { requireAdmin, requireWorker } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/categories', requireWorker, ctrl.getCategories);
router.get('/', requireWorker, ctrl.getAll);
router.get('/:id', requireWorker, ctrl.getOne);
router.post('/', requireAdmin, upload.single('image'), ctrl.create);
router.put('/:id', requireAdmin, upload.single('image'), ctrl.update);
router.patch('/:id/availability', requireAdmin, ctrl.toggleAvailability);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
