const express = require('express');
const cors = require('cors');
require('dotenv').config();

const busesRouter = require('./routes/buses');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/buses', busesRouter);

// Root
app.get('/', (req, res) => {
  res.send('Bus App API is running 🚍');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
