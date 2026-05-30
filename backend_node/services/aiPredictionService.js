const mongoose = require("mongoose");
const { getWeatherAlerts } = require("./weatherService");

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

async function predictFailureRisk(parcel) {
  const destLat = Number(parcel.dest_lat || 12.9716);
  const destLng = Number(parcel.dest_lng || 77.5946);
  const sourceLat = Number(parcel.source_lat || 18.5204);
  const sourceLng = Number(parcel.source_lng || 73.8567);

  const dist = distanceKm(sourceLat, sourceLng, destLat, destLng);
  
  // Weather impact
  const weather = await getWeatherAlerts(destLat, destLng);
  const isBadWeather = ["high", "critical"].includes(weather.severity);
  
  // Basic attributes
  const isExpress = ["express", "sameday", "fragile"].includes(parcel.parcel_type);
  const weight = Number(parcel.weight || 1.0);
  
  // Inactivity simulation or delay history
  const override = parcel.manual_stage_override;
  const isDelayed = override === -1 || parcel.status === "Delayed";

  // Score computation (ML mock heuristic)
  let baseFailureProb = 10; // 10% baseline
  let baseLateRisk = 12;

  if (isBadWeather) {
    baseFailureProb += 25;
    baseLateRisk += 45;
  }
  if (dist > 100) {
    baseLateRisk += 20;
  }
  if (weight > 8.0) {
    baseFailureProb += 15;
  }
  if (isExpress) {
    // Express has stricter timelines, higher late risk
    baseLateRisk += 15;
  }
  if (isDelayed) {
    baseFailureProb += 30;
    baseLateRisk += 35;
  }

  // Cap at 95%
  const failureProb = Math.min(95, baseFailureProb + Math.floor(Math.random() * 8));
  const lateRisk = Math.min(95, baseLateRisk + Math.floor(Math.random() * 8));
  const routeFailureProb = Math.min(95, Math.floor((failureProb + lateRisk) / 2));
  const customerUnavailableProb = Math.min(95, Math.floor(baseFailureProb * 0.7 + Math.random() * 10));

  // Determine top risk factors
  const riskFactors = [];
  if (isBadWeather) riskFactors.push(`Hazardous weather alert: ${weather.city} (${weather.condition})`);
  if (dist > 80) riskFactors.push("High travel corridor distance");
  if (weight > 8.0) riskFactors.push("Heavy cargo load limit handling");
  if (isExpress) riskFactors.push("Express SLA timeline constraint");
  if (riskFactors.length === 0) riskFactors.push("Standard transit margins");

  return {
    tracking_id: parcel.tracking_id || parcel._id.toString(),
    customer: parcel.receiver_name || "Valued Customer",
    address: parcel.destination_address || "Address",
    failure_probability: failureProb,
    late_delivery_risk: lateRisk,
    route_failure_risk: routeFailureProb,
    customer_unavailable_risk: customerUnavailableProb,
    risk_level: failureProb > 60 ? "Critical" : failureProb > 35 ? "High" : "Medium",
    confidence_percentage: 85 + Math.floor(Math.random() * 10),
    top_risk_factors: riskFactors,
    weather_impact: weather.alert || "Clear skies"
  };
}

module.exports = {
  predictFailureRisk
};
