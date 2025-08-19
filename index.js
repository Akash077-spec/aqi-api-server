// in api_server/index.js

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
// --- NEW: Import the Google Maps Client ---
import { Client } from '@googlemaps/google-maps-services-js';

// Load environment variables and initialize clients
dotenv.config();
const app = express();
const port = 3000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
// --- NEW: Initialize the Google Maps Client ---
const mapsClient = new Client({});

// Middleware to enable CORS
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
app.get('/api/aqi/historical/:stationId', async (req, res) => {
  const { stationId } = req.params;
  console.log(`Request received for historical data for station: ${stationId}`);
  try {
    const { data, error } = await supabase
      .from('aqi_readings')
      .select('created_at, aqi, pm25')
      .eq('station_id', stationId)
      .order('created_at', { ascending: false })
      .limit(168);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching historical AQI:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 3: Get the 24-hour forecast for a specific station
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

// Endpoint 4: Get all satellite data points for the heatmap
app.get('/api/satellite/latest', async (req, res) => {
  console.log("Request received for /api/satellite/latest");
  try {
    const { data, error } = await supabase
      .from('satellite_readings')
      .select('latitude, longitude, pollutant_value');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching satellite data:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- NEW: Endpoint 5: Search for a location ---
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  console.log(`Search request received for: ${q}`);
  try {
    const geocodeResponse = await mapsClient.geocode({
      params: {
        address: q,
        key: process.env.GOOGLE_MAPS_API_KEY, // Store this in your .env and on Render
        region: 'IN'
      },
    });

    if (geocodeResponse.data.results.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    const location = geocodeResponse.data.results[0].geometry.location;
    const formattedAddress = geocodeResponse.data.results[0].formatted_address;

    const { data, error } = await supabase.rpc('get_closest_satellite_reading', {
      lat: location.lat,
      lon: location.lng
    });

    if (error) throw error;

    res.json({
      searchQuery: q,
      foundLocation: {
        name: formattedAddress,
        coords: location,
      },
      satelliteData: data[0]
    });

  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ API server listening at http://localhost:${port}`);
});
