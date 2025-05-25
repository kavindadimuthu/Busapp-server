const db = require('../db');

/**
 * Get all available bus types from the database.
 * Returns an array of distinct types from the buses table.
 */
exports.getAllBusTypes = async (req, res) => {
    try {
        const result = await db.query('SELECT DISTINCT type FROM buses ORDER BY type');
        const types = result.rows.map(row => row.type);
        res.json({ types });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch bus types', details: err.message });
    }
};