const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const bulkScheduleController = require('../controllers/bulkScheduleController');

// Bulk entry for schedules (was POST /)
router.post('/bulk', bulkScheduleController.bulkCreateSchedules);

// Bulk delete schedules
router.delete('/bulk', bulkScheduleController.bulkDeleteSchedules);

router.get('/', scheduleController.getAllSchedules);
// router.get('/:id', scheduleController.getScheduleById);
// router.post('/', scheduleController.createSchedule);
// router.put('/:id', scheduleController.updateSchedule);
// router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;