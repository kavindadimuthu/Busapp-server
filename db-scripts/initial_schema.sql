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
    location GEOGRAPHY(POINT, 4326)
);

-- 4. Routes (simplified without return_route_id)
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT, -- Added name for easier identification
    source_stop_id UUID REFERENCES stops(id),
    destination_stop_id UUID REFERENCES stops(id),
    total_distance INTEGER,
    total_duration INTEGER
);

-- 5. Route Stops
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES stops(id),
    sequence INTEGER,
    arrival_time TIME,
    departure_time TIME
);

-- 6. Bus Schedules (main schedule definition)
CREATE TABLE bus_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID REFERENCES buses(id),
    route_id UUID REFERENCES routes(id),
    valid_from DATE,
    valid_until DATE,
    days_of_week TEXT[] -- Array of days for more flexibility
);

-- 7. Schedule Times for multiple trips per day
CREATE TABLE schedule_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES bus_schedules(id),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL
);