import re
from typing import Dict, Any

def predict_category_from_description(description: str) -> Dict[str, Any]:
    text = description.lower()
    
    # Define rules
    rules = [
        (r"(laptop|charger|phone|mobile|electronics|screen|watch|cable|battery|computer|tablet|usb|headphone|earphone|device)", "electronics", 0.95),
        (r"(book|paper|document|passport|contract|certificate|visa|letter|report|invoice|file|card)", "documents", 0.98),
        (r"(shirt|pants|clothes|apparel|shoe|dress|jacket|t-shirt|sock|hat|jeans|sweater|bag|wear)", "apparel", 0.92),
        (r"(food|chocolate|snack|cake|fruit|cookie|sweet|spices|rice|grain|beverage|coffee|tea|oil)", "food", 0.90),
        (r"(medicine|drug|pill|tablet|prescription|syrup|pharma|vaccine|cream|capsule|medical)", "medicine", 0.96)
    ]
    
    for pattern, category, confidence in rules:
        if re.search(pattern, text):
            return {"category": category, "confidence": confidence}
            
    # Default fallback
    return {"category": "other", "confidence": 0.50}
