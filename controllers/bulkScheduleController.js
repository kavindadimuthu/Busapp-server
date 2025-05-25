const db = require('../db');

/**
 * Bulk create bus schedules with all related data.
 * Expects an array of schedule objects in req.body.
 */
exports.bulkCreateSchedules = async (req, res) => {
    console.log('Bulk create schedules request body:', req.body);
    const schedules = Array.isArray(req.body) ? req.body : [req.body];
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const createdSchedules = [];

        for (const entry of schedules) {
            const {
                operator, // { name, contact_info }
                bus,      // { bus_number, name, type, fare }
                route,    // { name, source_stop, destination_stop, total_distance, total_duration, stops: [{ name, city, location, sequence }] }
                schedule  // { valid_from, valid_until, journeys: [{ departure_time, arrival_time, days_of_week, stop_times: [{ stop_name, arrival_time, departure_time }] }] }
            } = entry;

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
                    'INSERT INTO operators (name, contact_info, type) VALUES ($1, $2, $3) RETURNING id',
                    [operator.name, operator.contact_info, operator.type || 'Private']
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

                // Insert source stop (sequence 1)
                await client.query(
                    'INSERT INTO route_stops (route_id, stop_id, stop_sequence) VALUES ($1, $2, $3)',
                    [routeId, stopIds[route.source_stop.name], 1]
                );

                // Insert intermediate stops (sequence as provided)
                for (const stop of route.stops) {
                    await client.query(
                        'INSERT INTO route_stops (route_id, stop_id, stop_sequence) VALUES ($1, $2, $3)',
                        [routeId, stopIds[stop.name], stop.sequence]
                    );
                }

                // Insert destination stop (sequence = last + 1)
                const lastSeq = route.stops?.length
                    ? Math.max(...route.stops.map(s => s.sequence)) + 1
                    : 2;
                await client.query(
                    'INSERT INTO route_stops (route_id, stop_id, stop_sequence) VALUES ($1, $2, $3)',
                    [routeId, stopIds[route.destination_stop.name], lastSeq]
                );
            }

            // 5. Schedule
            const schRes = await client.query(
                'INSERT INTO schedules (bus_id, route_id, valid_from, valid_until) VALUES ($1, $2, $3, $4) RETURNING id',
                [busId, routeId, schedule.valid_from, schedule.valid_until]
            );
            const scheduleId = schRes.rows[0].id;

            // 6. Schedule Journeys
            for (const journey of schedule.journeys) {
                const journeyRes = await client.query(
                    'INSERT INTO schedule_journeys (schedule_id, departure_time, arrival_time, days_of_week) VALUES ($1, $2, $3, $4) RETURNING id',
                    [scheduleId, journey.departure_time, journey.arrival_time, journey.days_of_week]
                );
                const journeyId = journeyRes.rows[0].id;

                // 7. Journey Stop Times (optional, if provided)
                if (journey.stop_times && journey.stop_times.length) {
                    // Get route_stops for this route
                    const { rows: routeStops } = await client.query(
                        'SELECT id, stop_id FROM route_stops WHERE route_id = $1',
                        [routeId]
                    );
                    const stopIdToRouteStopId = {};
                    for (const rs of routeStops) {
                        stopIdToRouteStopId[rs.stop_id] = rs.id;
                    }
                    for (const st of journey.stop_times) {
                        const routeStopId = stopIdToRouteStopId[stopIds[st.stop_name]];
                        if (routeStopId) {
                            await client.query(
                                'INSERT INTO journey_stop_times (journey_id, route_stop_id, arrival_time, departure_time) VALUES ($1, $2, $3, $4)',
                                [journeyId, routeStopId, st.arrival_time, st.departure_time]
                            );
                        }
                    }
                }
            }

            createdSchedules.push({ schedule_id: scheduleId });
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Bus schedules created', schedules: createdSchedules });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create bus schedules', details: err.message });
    } finally {
        client.release();
    }
};

/**
 * Bulk delete bus schedules and clean up unreferenced related data.
 * Expects an array of schedule IDs in req.body.
 */
exports.bulkDeleteSchedules = async (req, res) => {
    const scheduleIds = Array.isArray(req.body) ? req.body : [req.body];
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Get related bus_id, route_id for each schedule
        const { rows: schedules } = await client.query(
            `SELECT id, bus_id, route_id FROM schedules WHERE id = ANY($1::uuid[])`,
            [scheduleIds]
        );

        // 2. Delete schedule_journeys and journey_stop_times (CASCADE handles journey_stop_times)
        await client.query(
            `DELETE FROM schedule_journeys WHERE schedule_id = ANY($1::uuid[])`,
            [scheduleIds]
        );

        // 3. Delete schedules
        await client.query(
            `DELETE FROM schedules WHERE id = ANY($1::uuid[])`,
            [scheduleIds]
        );

        // 4. For each bus, route: check if still referenced, else delete
        for (const sch of schedules) {
            // Bus
            const { rows: busRef } = await client.query(
                `SELECT 1 FROM schedules WHERE bus_id = $1 LIMIT 1`,
                [sch.bus_id]
            );
            if (busRef.length === 0) {
                await client.query(`DELETE FROM buses WHERE id = $1`, [sch.bus_id]);
            }

            // Route
            const { rows: routeRef } = await client.query(
                `SELECT 1 FROM schedules WHERE route_id = $1 LIMIT 1`,
                [sch.route_id]
            );
            if (routeRef.length === 0) {
                // Delete route_stops first (ON DELETE CASCADE may handle this)
                await client.query(`DELETE FROM route_stops WHERE route_id = $1`, [sch.route_id]);
                await client.query(`DELETE FROM routes WHERE id = $1`, [sch.route_id]);
            }
        }

        // 5. Clean up stops and operators if unreferenced
        // Stops: only delete if not referenced in routes or route_stops
        await client.query(`
            DELETE FROM stops s
            WHERE NOT EXISTS (SELECT 1 FROM route_stops rs WHERE rs.stop_id = s.id)
              AND NOT EXISTS (SELECT 1 FROM routes r WHERE r.source_stop_id = s.id OR r.destination_stop_id = s.id)
        `);

        // Operators: only delete if no buses reference them
        await client.query(`
            DELETE FROM operators o
            WHERE NOT EXISTS (SELECT 1 FROM buses b WHERE b.operator_id = o.id)
        `);

        await client.query('COMMIT');
        res.json({ message: 'Bus schedules and related data deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to delete schedules', details: err.message });
    } finally {
        client.release();
    }
};