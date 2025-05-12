-- Insert Operators
INSERT INTO operators (id, name, contact_info) VALUES
  (gen_random_uuid(), 'City Bus Corp', 'contact@citybus.com'),
  (gen_random_uuid(), 'MetroLine Express', 'support@metroline.com');

-- Insert Stops
INSERT INTO stops (id, name, city, location) VALUES
  (gen_random_uuid(), 'Central Station', 'Metro City', ST_GeogFromText('POINT(77.5946 12.9716)')),
  (gen_random_uuid(), 'North Terminal', 'Metro City', ST_GeogFromText('POINT(77.6050 12.9900)')),
  (gen_random_uuid(), 'South Terminal', 'Metro City', ST_GeogFromText('POINT(77.5900 12.9500)')),
  (gen_random_uuid(), 'East Station', 'Metro City', ST_GeogFromText('POINT(77.6200 12.9800)')),
  (gen_random_uuid(), 'West Station', 'Metro City', ST_GeogFromText('POINT(77.5700 12.9600)'));

-- Insert a Bus (you can later query operator ID or hardcode one from the INSERT above)
INSERT INTO buses (id, bus_number, name, type, fare, operator_id) VALUES
  (gen_random_uuid(), 'B100', 'City Express', 'AC', 25.00,
   (SELECT id FROM operators WHERE name = 'City Bus Corp'));

-- Insert a Route
INSERT INTO routes (id, bus_id, source_stop_id, destination_stop_id, total_distance, total_duration) VALUES
  (gen_random_uuid(),
   (SELECT id FROM buses WHERE bus_number = 'B100'),
   (SELECT id FROM stops WHERE name = 'Central Station'),
   (SELECT id FROM stops WHERE name = 'West Station'),
   15, 40);

-- Insert Route Stops (sequence)
INSERT INTO route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
SELECT
  (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'B100')),
  id,
  sequence,
  arrival_time::time,  -- Cast to time
  departure_time::time  -- Cast to time
FROM (
  VALUES
    ('Central Station', 1, '08:00', '08:05'),
    ('North Terminal', 2, '08:15', '08:17'),
    ('West Station', 3, '08:40', '08:40')
) AS data(stop_name, sequence, arrival_time, departure_time)
JOIN stops ON stops.name = data.stop_name;

-- Insert Bus Schedule
INSERT INTO bus_schedules (bus_id, route_id, day_of_week, start_time)
VALUES (
  (SELECT id FROM buses WHERE bus_number = 'B100'),
  (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'B100')),
  'Daily',
  '08:00'::time  -- Cast to time
);