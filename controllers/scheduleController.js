const db = require('../db');

function isUUID(val) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Get all schedules with advanced searching and filtering.
 * Updated for new schema: schedules, schedule_journeys, journey_stop_times.
 */
exports.getAllSchedules = async (req, res) => {
    const {
        source,
        destination,
        date,
        operator,
        bus_type,
        route_name,
        departure_time,
        departure_time_from,
        departure_time_to,
        arrival_time,
        arrival_time_from,
        arrival_time_to,
        limit = 50,
        offset = 0,
        sort_by,
        sort_order
    } = req.query;

    let filters = [];
    let values = [];
    let idx = 1;

    // Source and destination sequence validation
    let sequenceJoin = '';
    let sequenceFilter = '';

    if (source && destination) {
        // Join for source stop
        if (isUUID(source)) {
            sequenceJoin += `
                JOIN route_stops rs_src ON rs_src.route_id = r.id AND rs_src.stop_id = $${idx}
            `;
            values.push(source);
        } else {
            sequenceJoin += `
                JOIN route_stops rs_src ON rs_src.route_id = r.id
                JOIN stops s_src ON s_src.id = rs_src.stop_id AND s_src.name ILIKE $${idx}
            `;
            values.push(`%${source}%`);
        }
        idx++;

        // Join for destination stop
        if (isUUID(destination)) {
            sequenceJoin += `
                JOIN route_stops rs_dst ON rs_dst.route_id = r.id AND rs_dst.stop_id = $${idx}
            `;
            values.push(destination);
        } else {
            sequenceJoin += `
                JOIN route_stops rs_dst ON rs_dst.route_id = r.id
                JOIN stops s_dst ON s_dst.id = rs_dst.stop_id AND s_dst.name ILIKE $${idx}
            `;
            values.push(`%${destination}%`);
        }
        idx++;

        // Ensure source comes before destination in the route
        sequenceFilter = `AND rs_src.stop_sequence < rs_dst.stop_sequence`;
    } else {
        // Source stop filter (matches any stop in the route)
        if (source) {
            if (isUUID(source)) {
                filters.push(`EXISTS (
                    SELECT 1 FROM route_stops rs_src
                    WHERE rs_src.route_id = r.id AND rs_src.stop_id = $${idx}
                )`);
                values.push(source);
            } else {
                filters.push(`EXISTS (
                    SELECT 1 FROM route_stops rs_src
                    JOIN stops s_src ON s_src.id = rs_src.stop_id
                    WHERE rs_src.route_id = r.id AND s_src.name ILIKE $${idx}
                )`);
                values.push(`%${source}%`);
            }
            idx++;
        }
        // Destination stop filter (matches any stop in the route)
        if (destination) {
            if (isUUID(destination)) {
                filters.push(`EXISTS (
                    SELECT 1 FROM route_stops rs_dst
                    WHERE rs_dst.route_id = r.id AND rs_dst.stop_id = $${idx}
                )`);
                values.push(destination);
            } else {
                filters.push(`EXISTS (
                    SELECT 1 FROM route_stops rs_dst
                    JOIN stops s_dst ON s_dst.id = rs_dst.stop_id
                    WHERE rs_dst.route_id = r.id AND s_dst.name ILIKE $${idx}
                )`);
                values.push(`%${destination}%`);
            }
            idx++;
        }
    }

    // Date filter (valid_from <= date <= valid_until)
    if (date) {
        filters.push(`s.valid_from <= $${idx} AND (s.valid_until IS NULL OR s.valid_until >= $${idx})`);
        values.push(date);
        idx++;

        // Get the day of week as capitalized string (e.g., 'Monday')
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }); // 'Mon', 'Tue', etc.
        filters.push(`$${idx} = ANY(j.days_of_week)`);
        values.push(dayOfWeek);
        idx++;
    }

    // Operator filter
    if (operator) {
        if (isUUID(operator)) {
            filters.push(`op.id = $${idx}`);
            values.push(operator);
        } else {
            filters.push(`op.name ILIKE $${idx}`);
            values.push(`%${operator}%`);
        }
        idx++;
    }
    // Bus type filter
    if (bus_type) {
        filters.push(`b.type = $${idx}`);
        values.push(bus_type);
        idx++;
    }
    // Route name filter
    if (route_name) {
        filters.push(`r.name ILIKE $${idx}`);
        values.push(`%${route_name}%`);
        idx++;
    }

    // Departure and Arrival time filtering (on schedule_journeys)
    let timeFilter = [];

    // Departure time range
    if (departure_time_from) {
        timeFilter.push(`j.departure_time >= $${idx}`);
        values.push(departure_time_from);
        idx++;
    }
    if (departure_time_to) {
        timeFilter.push(`j.departure_time <= $${idx}`);
        values.push(departure_time_to);
        idx++;
    }
    if (departure_time && !departure_time_from && !departure_time_to) {
        timeFilter.push(`j.departure_time = $${idx}`);
        values.push(departure_time);
        idx++;
    }

    // Arrival time range
    if (arrival_time_from) {
        timeFilter.push(`j.arrival_time >= $${idx}`);
        values.push(arrival_time_from);
        idx++;
    }
    if (arrival_time_to) {
        timeFilter.push(`j.arrival_time <= $${idx}`);
        values.push(arrival_time_to);
        idx++;
    }
    if (arrival_time && !arrival_time_from && !arrival_time_to) {
        timeFilter.push(`j.arrival_time = $${idx}`);
        values.push(arrival_time);
        idx++;
    }

    if (timeFilter.length) {
        filters.push(...timeFilter);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // --- Sorting ---
    const SORT_FIELDS = {
        valid_from: 's.valid_from',
        valid_until: 's.valid_until',
        bus_number: 'b.bus_number',
        bus_type: 'b.type',
        fare: 'b.fare',
        operator_name: 'op.name',
        route_name: 'r.name'
    };
    let orderClause = 'ORDER BY s.valid_from DESC, s.id';
    if (sort_by && SORT_FIELDS[sort_by]) {
        const direction = (sort_order && sort_order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
        orderClause = `ORDER BY ${SORT_FIELDS[sort_by]} ${direction}, s.id`;
    }

    // --- Count query for pagination metadata ---
    const countQuery = `
        SELECT COUNT(*) AS total
        FROM schedules s
        JOIN buses b ON b.id = s.bus_id
        JOIN operators op ON op.id = b.operator_id
        JOIN routes r ON r.id = s.route_id
        JOIN schedule_journeys j ON j.schedule_id = s.id
        ${sequenceJoin}
        ${whereClause}
        ${sequenceFilter}
    `;

    // --- Main data query ---
    const query = `
        SELECT
            s.id as schedule_id,
            s.valid_from,
            s.valid_until,
            b.id as bus_id,
            b.bus_number,
            b.name as bus_name,
            b.type as bus_type,
            b.fare,
            b.is_active,
            op.id as operator_id,
            op.name as operator_name,
            op.contact_info,
            r.id as route_id,
            r.name as route_name,
            r.total_distance,
            r.total_duration,
            (
                SELECT json_agg(json_build_object(
                    'id', s2.id,
                    'name', s2.name,
                    'city', s2.city,
                    'location', ST_AsText(s2.location),
                    'sequence', rs.stop_sequence
                ) ORDER BY rs.stop_sequence)
                FROM route_stops rs
                JOIN stops s2 ON s2.id = rs.stop_id
                WHERE rs.route_id = r.id
            ) as stops,
            (
                SELECT json_agg(json_build_object(
                    'id', j2.id,
                    'departure_time', j2.departure_time,
                    'arrival_time', j2.arrival_time,
                    'days_of_week', j2.days_of_week,
                    'stop_times', (
                        SELECT json_agg(json_build_object(
                            'id', jt.id,
                            'route_stop_id', jt.route_stop_id,
                            'arrival_time', jt.arrival_time,
                            'departure_time', jt.departure_time
                        ) ORDER BY jt.id)
                        FROM journey_stop_times jt
                        WHERE jt.journey_id = j2.id
                    )
                ))
                FROM schedule_journeys j2
                WHERE j2.schedule_id = s.id
            ) as journeys
        FROM schedules s
        JOIN buses b ON b.id = s.bus_id
        JOIN operators op ON op.id = b.operator_id
        JOIN routes r ON r.id = s.route_id
        JOIN schedule_journeys j ON j.schedule_id = s.id
        ${sequenceJoin}
        ${whereClause}
        ${sequenceFilter}
        ${orderClause}
        LIMIT $${idx} OFFSET $${idx + 1}
    `;

    values.push(limit);
    values.push(offset);

    try {
        // Get total count for pagination
        const countResult = await db.query(countQuery, values.slice(0, values.length - 2));
        const total = parseInt(countResult.rows[0].total, 10);

        // Get paginated data
        const { rows } = await db.query(query, values);

        res.json({
            total,
            limit: Number(limit),
            offset: Number(offset),
            schedules: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch schedules', details: err.message });
    }
};