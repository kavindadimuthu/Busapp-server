const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// router.get('/', busController.getAllBuses);
// router.get('/:id', busController.getBusById);
// router.post('/', busController.createBus);
// router.put('/:id', busController.updateBus);
// router.delete('/:id', busController.deleteBus);
// Get all bus types
router.get('/types', busController.getAllBusTypes);

module.exports = router;