-- 1. Operators table: Stores transport operators (Private or CTB)
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('Private', 'CTB')), -- Type of operator
    name TEXT NOT NULL, -- Operator's name
    contact_info TEXT -- Optional contact details
);

-- 2. Buses table: Stores information about individual buses
CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number TEXT NOT NULL, -- Unique identifier or registration number
    name TEXT, -- Optional name of the bus (e.g., branding)
    type TEXT NOT NULL CHECK (type IN ('AC', 'Non-AC', 'Express', 'Local')), -- Type of bus
    fare NUMERIC, -- Base fare for this bus
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE, -- Owning operator
    is_active BOOLEAN DEFAULT TRUE -- Whether the bus is currently active
);

-- 3. Stops table: Represents geographical bus stops
CREATE TABLE stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Stop name
    city TEXT, -- City where the stop is located
    location GEOGRAPHY(POINT, 4326) -- Geolocation (latitude/longitude)
);

-- 4. Routes table: Describes a route from source to destination stop
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Name/label for the route
    source_stop_id UUID NOT NULL REFERENCES stops(id), -- Start stop
    destination_stop_id UUID NOT NULL REFERENCES stops(id), -- End stop
    total_distance INTEGER, -- Total distance in kilometers
    total_duration INTEGER -- Total expected duration in minutes
);

-- 5. Route Stops table: Defines stops and their sequence on a route
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE, -- Route
    stop_id UUID NOT NULL REFERENCES stops(id), -- Stop on the route
    stop_sequence INTEGER NOT NULL -- Order of stop in the route
);

-- 6. Schedules table: Represents the validity of a bus on a specific route
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE, -- Assigned bus
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE, -- Assigned route
    valid_from DATE NOT NULL, -- Schedule start date
    valid_until DATE -- Schedule end date (nullable for indefinite)
);

-- 7. Schedule Journeys table: Contains individual trip times within a schedule
CREATE TABLE schedule_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE, -- Associated schedule
    departure_time TIME NOT NULL, -- Departure time from source
    arrival_time TIME NOT NULL, -- Arrival time at destination
    days_of_week TEXT[] NOT NULL -- Days of the week this journey runs (e.g., ['Mon', 'Wed'])
);

-- 8. Journey Stop Times table: Captures stop-level timings for a journey
CREATE TABLE journey_stop_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES schedule_journeys(id) ON DELETE CASCADE, -- Journey reference
    route_stop_id UUID NOT NULL REFERENCES route_stops(id) ON DELETE CASCADE, -- Associated route stop
    arrival_time TIME, -- Arrival at this stop
    departure_time TIME -- Departure from this stop
);
