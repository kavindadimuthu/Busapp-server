-- 1. Operators
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info TEXT
);

-- 2. Buses
CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number TEXT NOT NULL,
    name TEXT,
    type TEXT CHECK (type IN ('AC', 'Non-AC', 'Express', 'Local')),
    fare NUMERIC,
    operator_id UUID REFERENCES operators(id),
    active BOOLEAN DEFAULT TRUE
);

-- 3. Stops
CREATE TABLE stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    location GEOGRAPHY(POINT, 4326)  -- Latitude and Longitude
);

-- 4. Routes
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_stop_id UUID REFERENCES stops(id),
    destination_stop_id UUID REFERENCES stops(id),
    total_distance INTEGER,
    total_duration INTEGER  -- in minutes
);

-- 5. Route Stops
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES stops(id),
    sequence INTEGER,  -- order in the route
    arrival_time TIME,
    departure_time TIME
);

-- 6. Bus Schedules
CREATE TABLE bus_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID REFERENCES buses(id),
    route_id UUID REFERENCES routes(id),
    day_of_week TEXT CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Daily')),
    start_time TIME
);
