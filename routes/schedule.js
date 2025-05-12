const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /buses/schedule - Add a new bus schedule with all related data
router.post('/', async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            operator, // { name, contact_info }
            bus,      // { bus_number, name, type, fare }
            route,    // { name, source_stop, destination_stop, total_distance, total_duration, stops: [{ name, city, location, arrival_time, departure_time, sequence }] }
            schedule  // { valid_from, valid_until, days_of_week, times: [{ departure_time, arrival_time }] }
        } = req.body;

        // 1. Operator
        let operatorId;
        const opRes = await client.query(
            'SELECT id FROM operators WHERE name = $1',
            [operator.name]
        );
        if (opRes.rows.length) {
            operatorId = opRes.rows[0].id;
        } else {
            const insOp = await client.query(
                'INSERT INTO operators (name, contact_info) VALUES ($1, $2) RETURNING id',
                [operator.name, operator.contact_info]
            );
            operatorId = insOp.rows[0].id;
        }

        // 2. Bus
        let busId;
        const busRes = await client.query(
            'SELECT id FROM buses WHERE bus_number = $1',
            [bus.bus_number]
        );
        if (busRes.rows.length) {
            busId = busRes.rows[0].id;
        } else {
            const insBus = await client.query(
                'INSERT INTO buses (bus_number, name, type, fare, operator_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [bus.bus_number, bus.name, bus.type, bus.fare, operatorId]
            );
            busId = insBus.rows[0].id;
        }

        // 3. Stops (source, destination, and all route stops)
        const stopIds = {};
        for (const stop of [route.source_stop, route.destination_stop, ...(route.stops || [])]) {
            if (stopIds[stop.name]) continue; // Already processed
            const stopRes = await client.query(
                'SELECT id FROM stops WHERE name = $1 AND city = $2',
                [stop.name, stop.city]
            );
            if (stopRes.rows.length) {
                stopIds[stop.name] = stopRes.rows[0].id;
            } else {
                const insStop = await client.query(
                    'INSERT INTO stops (name, city, location) VALUES ($1, $2, ST_GeogFromText($3)) RETURNING id',
                    [stop.name, stop.city, stop.location] // location as 'POINT(lon lat)'
                );
                stopIds[stop.name] = insStop.rows[0].id;
            }
        }

        // 4. Route
        let routeId;
        const routeRes = await client.query(
            'SELECT id FROM routes WHERE name = $1 AND source_stop_id = $2 AND destination_stop_id = $3',
            [route.name, stopIds[route.source_stop.name], stopIds[route.destination_stop.name]]
        );
        if (routeRes.rows.length) {
            routeId = routeRes.rows[0].id;
        } else {
            const insRoute = await client.query(
                'INSERT INTO routes (name, source_stop_id, destination_stop_id, total_distance, total_duration) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [route.name, stopIds[route.source_stop.name], stopIds[route.destination_stop.name], route.total_distance, route.total_duration]
            );
            routeId = insRoute.rows[0].id;
            // Insert route stops
            for (const stop of route.stops) {
                await client.query(
                    'INSERT INTO route_stops (route_id, stop_id, sequence, arrival_time, departure_time) VALUES ($1, $2, $3, $4, $5)',
                    [routeId, stopIds[stop.name], stop.sequence, stop.arrival_time, stop.departure_time]
                );
            }
        }

        // 5. Bus Schedule
        const schRes = await client.query(
            'INSERT INTO bus_schedules (bus_id, route_id, valid_from, valid_until, days_of_week) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [busId, routeId, schedule.valid_from, schedule.valid_until, schedule.days_of_week]
        );
        const scheduleId = schRes.rows[0].id;

        // 6. Schedule Times
        for (const t of schedule.times) {
            await client.query(
                'INSERT INTO schedule_times (schedule_id, departure_time, arrival_time) VALUES ($1, $2, $3)',
                [scheduleId, t.departure_time, t.arrival_time]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Bus schedule created', schedule_id: scheduleId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create bus schedule', details: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;