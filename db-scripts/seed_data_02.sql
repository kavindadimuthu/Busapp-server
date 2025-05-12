-- Insert Sri Lankan Bus Operators
INSERT INTO operators (id, name, contact_info) VALUES
  (gen_random_uuid(), 'Sri Lanka Transport Board (SLTB)', 'info@sltb.lk'),
  (gen_random_uuid(), 'Private Bus Operators Association', 'contact@pboa.lk'),
  (gen_random_uuid(), 'Colombo City Bus Service', 'support@colombobus.lk'),
  (gen_random_uuid(), 'Kandy City Buses', 'admin@kandybuses.lk'),
  (gen_random_uuid(), 'Galle Bus Network', 'operations@gallebuses.lk');

-- Insert Major Sri Lankan Bus Stops with actual coordinates
INSERT INTO stops (id, name, city, location) VALUES
  -- Colombo Area
  (gen_random_uuid(), 'Colombo Fort Bus Stand', 'Colombo', ST_GeogFromText('POINT(79.8444 6.9355)')),
  (gen_random_uuid(), 'Pettah Bus Terminal', 'Colombo', ST_GeogFromText('POINT(79.8573 6.9350)')),
  (gen_random_uuid(), 'Borella Bus Stand', 'Colombo', ST_GeogFromText('POINT(79.8814 6.9139)')),
  (gen_random_uuid(), 'Dehiwala Bus Stand', 'Dehiwala', ST_GeogFromText('POINT(79.8626 6.8409)')),
  (gen_random_uuid(), 'Moratuwa Bus Stand', 'Moratuwa', ST_GeogFromText('POINT(79.8825 6.7954)')),
  
  -- Kandy Area
  (gen_random_uuid(), 'Kandy Central Bus Stand', 'Kandy', ST_GeogFromText('POINT(80.6337 7.2965)')),
  (gen_random_uuid(), 'Peradeniya Bus Stand', 'Peradeniya', ST_GeogFromText('POINT(80.5949 7.2696)')),
  (gen_random_uuid(), 'Katugastota Bus Stand', 'Kandy', ST_GeogFromText('POINT(80.6216 7.3329)')),
  
  -- Galle Area
  (gen_random_uuid(), 'Galle Bus Stand', 'Galle', ST_GeogFromText('POINT(80.2170 6.0325)')),
  (gen_random_uuid(), 'Hikkaduwa Bus Stand', 'Hikkaduwa', ST_GeogFromText('POINT(80.0984 6.1408)')),
  
  -- Other Major Cities
  (gen_random_uuid(), 'Negombo Bus Stand', 'Negombo', ST_GeogFromText('POINT(79.8358 7.2098)')),
  (gen_random_uuid(), 'Kurunegala Bus Stand', 'Kurunegala', ST_GeogFromText('POINT(80.3624 7.4865)')),
  (gen_random_uuid(), 'Anuradhapura Bus Stand', 'Anuradhapura', ST_GeogFromText('POINT(80.4029 8.3114)')),
  (gen_random_uuid(), 'Jaffna Bus Stand', 'Jaffna', ST_GeogFromText('POINT(80.0167 9.6615)')),
  (gen_random_uuid(), 'Trincomalee Bus Stand', 'Trincomalee', ST_GeogFromText('POINT(81.2339 8.5692)'));

-- Insert Buses with Sri Lankan bus types and realistic fares
INSERT INTO buses (id, bus_number, name, type, fare, operator_id, active) VALUES
  -- SLTB Buses
  (gen_random_uuid(), 'NP-2345', 'Colombo-Kandy Express', 'AC', 350.00, (SELECT id FROM operators WHERE name = 'Sri Lanka Transport Board (SLTB)'), TRUE),
  (gen_random_uuid(), 'NC-5678', 'Colombo-Galle Highway', 'Express', 250.00, (SELECT id FROM operators WHERE name = 'Sri Lanka Transport Board (SLTB)'), TRUE),
  (gen_random_uuid(), 'ND-9012', 'Colombo-Negombo Local', 'Local', 80.00, (SELECT id FROM operators WHERE name = 'Sri Lanka Transport Board (SLTB)'), TRUE),
  
  -- Private Buses
  (gen_random_uuid(), 'CP-3456', 'Colombo City Circular', 'Non-AC', 50.00, (SELECT id FROM operators WHERE name = 'Private Bus Operators Association'), TRUE),
  (gen_random_uuid(), 'KP-7890', 'Kandy-Peradeniya Shuttle', 'Non-AC', 40.00, (SELECT id FROM operators WHERE name = 'Private Bus Operators Association'), TRUE),
  (gen_random_uuid(), 'GH-1234', 'Galle-Hikkaduwa Coastal', 'Non-AC', 60.00, (SELECT id FROM operators WHERE name = 'Private Bus Operators Association'), TRUE),
  
  -- City Buses
  (gen_random_uuid(), 'CB-100', 'Colombo Fort-Dehiwala', 'Local', 30.00, (SELECT id FROM operators WHERE name = 'Colombo City Bus Service'), TRUE),
  (gen_random_uuid(), 'CB-101', 'Colombo Fort-Moratuwa', 'Local', 50.00, (SELECT id FROM operators WHERE name = 'Colombo City Bus Service'), TRUE),
  (gen_random_uuid(), 'KB-200', 'Kandy-Katugastota', 'Local', 25.00, (SELECT id FROM operators WHERE name = 'Kandy City Buses'), TRUE),
  (gen_random_uuid(), 'GB-300', 'Galle-Hikkaduwa', 'Local', 40.00, (SELECT id FROM operators WHERE name = 'Galle Bus Network'), TRUE);

-- Insert Major Routes
INSERT INTO routes (id, bus_id, source_stop_id, destination_stop_id, total_distance, total_duration) VALUES
  -- Colombo-Kandy Express (NP-2345)
  (gen_random_uuid(),
   (SELECT id FROM buses WHERE bus_number = 'NP-2345'),
   (SELECT id FROM stops WHERE name = 'Colombo Fort Bus Stand'),
   (SELECT id FROM stops WHERE name = 'Kandy Central Bus Stand'),
   115, 180),  -- 115km, 3 hours
  
  -- Colombo-Galle Highway (NC-5678)
  (gen_random_uuid(),
   (SELECT id FROM buses WHERE bus_number = 'NC-5678'),
   (SELECT id FROM stops WHERE name = 'Colombo Fort Bus Stand'),
   (SELECT id FROM stops WHERE name = 'Galle Bus Stand'),
   116, 150),  -- 116km, 2.5 hours
  
  -- Colombo-Negombo Local (ND-9012)
  (gen_random_uuid(),
   (SELECT id FROM buses WHERE bus_number = 'ND-9012'),
   (SELECT id FROM stops WHERE name = 'Colombo Fort Bus Stand'),
   (SELECT id FROM stops WHERE name = 'Negombo Bus Stand'),
   35, 60),  -- 35km, 1 hour
  
  -- Colombo City Circular (CP-3456)
  (gen_random_uuid(),
   (SELECT id FROM buses WHERE bus_number = 'CP-3456'),
   (SELECT id FROM stops WHERE name = 'Colombo Fort Bus Stand'),
   (SELECT id FROM stops WHERE name = 'Colombo Fort Bus Stand'),
   15, 90),  -- Circular route
  
  -- Kandy-Peradeniya Shuttle (KP-7890)
  (gen_random_uuid(),
   (SELECT id FROM buses WHERE bus_number = 'KP-7890'),
   (SELECT id FROM stops WHERE name = 'Kandy Central Bus Stand'),
   (SELECT id FROM stops WHERE name = 'Peradeniya Bus Stand'),
   6, 20);  -- 6km, 20 minutes

-- Insert Route Stops for Colombo-Kandy Express
INSERT INTO route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
SELECT
  (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'NP-2345')),
  id,
  sequence,
  arrival_time::time,
  departure_time::time
FROM (
  VALUES
    ('Colombo Fort Bus Stand', 1, '06:00', '06:05'),
    ('Borella Bus Stand', 2, '06:20', '06:22'),
    ('Kurunegala Bus Stand', 3, '07:30', '07:35'),
    ('Kandy Central Bus Stand', 4, '09:00', '09:00')
) AS data(stop_name, sequence, arrival_time, departure_time)
JOIN stops ON stops.name = data.stop_name;

-- Insert Route Stops for Colombo-Galle Highway
INSERT INTO route_stops (route_id, stop_id, sequence, arrival_time, departure_time)
SELECT
  (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'NC-5678')),
  id,
  sequence,
  arrival_time::time,
  departure_time::time
FROM (
  VALUES
    ('Colombo Fort Bus Stand', 1, '07:00', '07:05'),
    ('Dehiwala Bus Stand', 2, '07:25', '07:27'),
    ('Moratuwa Bus Stand', 3, '07:45', '07:47'),
    ('Hikkaduwa Bus Stand', 4, '09:00', '09:05'),
    ('Galle Bus Stand', 5, '09:30', '09:30')
) AS data(stop_name, sequence, arrival_time, departure_time)
JOIN stops ON stops.name = data.stop_name;

-- Insert Bus Schedules
INSERT INTO bus_schedules (bus_id, route_id, day_of_week, start_time) VALUES
  -- Colombo-Kandy Express
  ((SELECT id FROM buses WHERE bus_number = 'NP-2345'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'NP-2345')),
   'Daily', '06:00'::time),
  
  -- Additional morning trip
  ((SELECT id FROM buses WHERE bus_number = 'NP-2345'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'NP-2345')),
   'Daily', '08:00'::time),
  
  -- Colombo-Galle Highway
  ((SELECT id FROM buses WHERE bus_number = 'NC-5678'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'NC-5678')),
   'Daily', '07:00'::time),
  
  -- Additional afternoon trip
  ((SELECT id FROM buses WHERE bus_number = 'NC-5678'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'NC-5678')),
   'Daily', '14:00'::time),
  
  -- Colombo-Negombo Local
  ((SELECT id FROM buses WHERE bus_number = 'ND-9012'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'ND-9012')),
   'Daily', '05:30'::time),
  
  -- Frequent service every 30 minutes
  ((SELECT id FROM buses WHERE bus_number = 'ND-9012'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'ND-9012')),
   'Daily', '06:00'::time),
  
  ((SELECT id FROM buses WHERE bus_number = 'ND-9012'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'ND-9012')),
   'Daily', '06:30'::time),
  
  -- Colombo City Circular
  ((SELECT id FROM buses WHERE bus_number = 'CP-3456'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'CP-3456')),
   'Daily', '05:00'::time),
  
  -- Every 15 minutes during peak hours
  ((SELECT id FROM buses WHERE bus_number = 'CP-3456'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'CP-3456')),
   'Daily', '07:00'::time),
  
  ((SELECT id FROM buses WHERE bus_number = 'CP-3456'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'CP-3456')),
   'Daily', '07:15'::time),
  
  -- Kandy-Peradeniya Shuttle
  ((SELECT id FROM buses WHERE bus_number = 'KP-7890'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'KP-7890')),
   'Daily', '05:30'::time),
  
  -- Every 20 minutes
  ((SELECT id FROM buses WHERE bus_number = 'KP-7890'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'KP-7890')),
   'Daily', '06:00'::time),
  
  ((SELECT id FROM buses WHERE bus_number = 'KP-7890'),
   (SELECT id FROM routes WHERE bus_id = (SELECT id FROM buses WHERE bus_number = 'KP-7890')),
   'Daily', '06:20'::time);