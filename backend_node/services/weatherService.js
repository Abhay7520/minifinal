const axios = require("axios");

// Rich mock weather details if API is not configured or fails
const MOCK_WEATHER_ALERTS = [
  {
    city: "Bangalore",
    temp: 22,
    condition: "Heavy Rain",
    alert: "Yellow Alert: Waterlogging on Outer Ring Road. Expect 15-20 mins delay.",
    severity: "moderate",
    delay_minutes: 20
  },
  {
    city: "Noida",
    temp: 34,
    condition: "Dense Fog / Smog",
    alert: "Orange Alert: Low visibility on Noida Expressway. Keep headlights on.",
    severity: "high",
    delay_minutes: 30
  },
  {
    city: "Pune",
    temp: 26,
    condition: "Thunderstorm",
    alert: "Severe Thunderstorm Warning: Localized wind gusts. Watch for fallen tree branches.",
    severity: "high",
    delay_minutes: 25
  },
  {
    city: "Mumbai",
    temp: 29,
    condition: "Monsoon Downpour",
    alert: "Red Alert: High tide warning. Avoid low-lying subways. Severe traffic delays.",
    severity: "critical",
    delay_minutes: 45
  }
];

// Helper to calculate distance
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map major coordinates to our mock regions
function getMockWeatherForCoords(lat, lng) {
  // Coords mapping:
  // Bangalore: 12.9716, 77.5946
  // Noida: 28.5996, 77.3473
  // Pune: 18.5204, 73.8567
  // Mumbai: 19.0760, 72.8777
  
  const regions = [
    { name: "Bangalore", lat: 12.9716, lng: 77.5946, index: 0 },
    { name: "Noida", lat: 28.5996, lng: 77.3473, index: 1 },
    { name: "Pune", lat: 18.5204, lng: 73.8567, index: 2 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, index: 3 }
  ];

  let closestRegion = regions[2]; // Default to Pune
  let minDistance = Infinity;

  for (const r of regions) {
    const d = distanceKm(lat, lng, r.lat, r.lng);
    if (d < minDistance) {
      minDistance = d;
      closestRegion = r;
    }
  }

  // If within 150km, return specific city alert, else return generic clear weather
  if (minDistance < 150) {
    return MOCK_WEATHER_ALERTS[closestRegion.index];
  }

  return {
    city: "Local Region",
    temp: 27,
    condition: "Clear",
    alert: null,
    severity: "none",
    delay_minutes: 0
  };
}

async function getWeatherAlerts(lat, lng) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "mock") {
    return getMockWeatherForCoords(lat, lng);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url, { timeout: 3000 });
    const data = response.data;
    
    let condition = data.weather && data.weather[0] ? data.weather[0].main : "Clear";
    let temp = data.main ? Math.round(data.main.temp) : 25;
    let alert = null;
    let severity = "none";
    let delay_minutes = 0;

    // Check weather severity for alerts
    if (condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("drizzle")) {
      alert = `Rain alert in ${data.name || "area"}: Wet roads, drive safely.`;
      severity = "moderate";
      delay_minutes = 10;
    } else if (condition.toLowerCase().includes("thunderstorm")) {
      alert = `Thunderstorm warning in ${data.name || "area"}: Risk of lightning. Speed limited to 40 km/h.`;
      severity = "high";
      delay_minutes = 20;
    } else if (condition.toLowerCase().includes("snow") || condition.toLowerCase().includes("fog") || condition.toLowerCase().includes("mist")) {
      alert = `Visibility alert in ${data.name || "area"}: Low visibility. Drive with high vigilance.`;
      severity = "high";
      delay_minutes = 15;
    }

    return {
      city: data.name || "Local Region",
      temp,
      condition,
      alert,
      severity,
      delay_minutes
    };
  } catch (error) {
    console.warn("Weather API failed, fallback to mock details:", error.message);
    return getMockWeatherForCoords(lat, lng);
  }
}

module.exports = {
  getWeatherAlerts
};
