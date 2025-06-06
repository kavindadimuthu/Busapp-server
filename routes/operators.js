const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');

// router.get('/', operatorController.getAllOperators);
// router.get('/:id', operatorController.getOperatorById);
// router.post('/', operatorController.createOperator);
// router.put('/:id', operatorController.updateOperator);
// router.delete('/:id', operatorController.deleteOperator);
// Get all operator types
router.get('/types', operatorController.getAllOperatorTypes);

module.exports = router;