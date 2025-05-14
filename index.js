const express = require('express');
const cors = require('cors');
require('dotenv').config();

const busesRouter = require('./routes/buses');
const scheduleRouter = require('./routes/schedule');
const operatorsRouter = require('./routes/operators');
const stopsRouter = require('./routes/stops');
const routesRouter = require('./routes/routes');
const routeStopsRouter = require('./routes/routeStops')
const journeyRouter = require('./routes/journey')


const app = express();
app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/buses', busesRouter);
app.use('/schedule', scheduleRouter);
app.use('/operators', operatorsRouter);
app.use('/stops', stopsRouter);
app.use('/routes', routesRouter);
app.use('/routeStops', routeStopsRouter);
app.use('/journey', journeyRouter);

// Root
app.get('/', (req, res) => {
  res.send('Bus App API is running 🚍');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
