const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: 'db.elwzzvxszreywhuibbsg.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Kava@2000',
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
