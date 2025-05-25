const db = require('../db');

/**
 * Get all available operator types from the database.
 * Returns an array of distinct types from the operators table.
 */
exports.getAllOperatorTypes = async (req, res) => {
    try {
        const result = await db.query('SELECT DISTINCT type FROM operators ORDER BY type');
        const types = result.rows.map(row => row.type);
        res.json({ types });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch operator types', details: err.message });
    }
};