const express = require('express');
const router = express.Router();
const journeyController = require('../controllers/journeyController');

router.get('/', journeyController.getAllJourneys);
router.get('/:id', journeyController.getJourneyById);

module.exports = router;