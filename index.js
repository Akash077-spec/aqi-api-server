// in api_server/index.js

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables and initialize clients
dotenv.config();
const app = express();
const port = 3000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware to enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

// --- API ENDPOINTS ---

// Endpoint 1: Get the latest reading for all stations
app.get('/api/aqi/latest', async (req, res) => {
  console.log("Request received for /api/aqi/latest");
  try {
    const { data, error } = await supabase.rpc('get_latest_aqi');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching latest AQI:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Get historical data for a specific station
// Example: /api/aqi/historical/10705
app.get('/api/aqi/forecast/:stationId', async (req, res) => {
  const { stationId } = req.params;
  console.log(`Request received for forecast for station: ${stationId}`);
  try {
    const { data, error } = await supabase
      .from('forecasts')
      .select('forecasted_at, predicted_aqi')
      .eq('station_id', stationId)
      .order('forecasted_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching forecast:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ API server listening at http://localhost:${port}`);
});