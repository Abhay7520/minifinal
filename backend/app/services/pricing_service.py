from typing import List, Dict, Any

def calculate_pricing(
    weight: float,
    length: float,
    width: float,
    height: float,
    parcel_type: str,
    smart_options: List[str],
    insurance: str
) -> Dict[str, Any]:
    # Calculate volumetric weight
    volumetric = round((length * width * height) / 5000.0, 2)
    chargeable_weight = max(weight, volumetric)
    
    # Smart Options pricing
    smart_options_prices = {
        "gps": 0.0,
        "iot": 40.0,
        "contactless": 0.0,
        "otp": 0.0,
        "eco": 15.0,
        "carbon": 20.0,
        "signature": 10.0,
        "priority": 50.0,
    }
    addons_charge = sum(smart_options_prices.get(opt, 0.0) for opt in smart_options)
    
    # Insurance pricing
    insurance_prices = {
        "basic": 0.0,
        "standard": 25.0,
        "premium": 75.0,
    }
    insurance_charge = insurance_prices.get(insurance, 25.0)
    
    # Type multiplier
    type_multiplier = {
        "standard": 1.0,
        "express": 1.6,
        "sameday": 2.2,
        "fragile": 1.3,
        "document": 0.7,
    }
    multiplier = type_multiplier.get(parcel_type, 1.0)
    
    base_fare = 60.0
    weight_charge = float(round(chargeable_weight * 40.0 * multiplier))
    subtotal = base_fare + weight_charge + addons_charge + insurance_charge
    gst = float(round(subtotal * 0.18))
    total = subtotal + gst
    
    return {
        "volumetric_weight": volumetric,
        "chargeable_weight": chargeable_weight,
        "base_fare": base_fare,
        "weight_charge": weight_charge,
        "addons_charge": addons_charge,
        "insurance_charge": insurance_charge,
        "subtotal": subtotal,
        "gst": gst,
        "total": total
    }
