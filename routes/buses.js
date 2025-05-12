const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /buses - List all buses with optional filters
router.get('/', async (req, res) => {
  try {
    const { source, destination, day } = req.query;

    let query = `
      SELECT 
        b.id AS bus_id,
        b.bus_number,
        b.name AS bus_name,
        b.type,
        b.fare,
        o.name AS operator_name,
        rs_src.stop_id AS source_stop,
        rs_dst.stop_id AS destination_stop,
        s.day_of_week,
        s.start_time
      FROM buses b
      JOIN operators o ON o.id = b.operator_id
      JOIN routes r ON r.bus_id = b.id
      JOIN bus_schedules s ON s.route_id = r.id
      JOIN route_stops rs_src ON rs_src.route_id = r.id
      JOIN route_stops rs_dst ON rs_dst.route_id = r.id
      WHERE rs_src.sequence < rs_dst.sequence
    `;

    const values = [];
    let count = 1;

    if (source) {
      query += ` AND rs_src.stop_id = (SELECT id FROM stops WHERE name ILIKE '%' || $${count++} || '%')`;
      values.push(source);
    }

    if (destination) {
      query += ` AND rs_dst.stop_id = (SELECT id FROM stops WHERE name ILIKE '%' || $${count++} || '%')`;
      values.push(destination);
    }

    if (day) {
      query += ` AND (s.day_of_week = $${count++} OR s.day_of_week = 'Daily')`;
      values.push(day);
    }

    // Debugging: Log the query and values
    console.log('Final Query:', query);
    console.log('Values:', values);

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching buses:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /stops - List all stops
router.get('/stops', async (req, res) => {
  try {
    const result = await db.query(`SELECT id, name, city FROM stops ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching stops:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /buses/:id - Get single bus details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, o.name AS operator_name
       FROM buses b
       JOIN operators o ON b.operator_id = o.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Bus not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching bus:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
