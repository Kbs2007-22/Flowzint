"""
delivery.py — Router for AI-driven logistics verification and NDR (Non-Delivery Report) triage.
"""
import math
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/delivery", tags=["Delivery & Logistics"])

MOCK_DELIVERIES = {
    "DEL_1001": {
        "customer_gps": (28.4595, 77.0266), 
        "dropoff_gps": (28.4596, 77.0266),  
        "courier_id": "COUR_ALPHA"
    },
    "DEL_1002": {
        "customer_gps": (28.4595, 77.0266),
        "dropoff_gps": (28.4625, 77.0296),  
        "courier_id": "COUR_BETA"
    },
    "DEL_1003": {
        "customer_gps": (28.4595, 77.0266),
        "dropoff_gps": (28.4595, 77.0267),  
        "courier_id": "COUR_ROGUE"
    }
}

MOCK_COURIERS = {
    "COUR_ALPHA": {"name": "Logistics Pro", "trust_score": 98.5},
    "COUR_BETA":  {"name": "Standard Ship", "trust_score": 85.0},
    "COUR_ROGUE": {"name": "Gig Walker", "trust_score": 42.0} 
}

def calculate_haversine_distance(coord1: tuple, coord2: tuple) -> float:
    R = 6371000.0  
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class NDRResponse(BaseModel):
    delivery_id: str
    variance_meters: float
    courier_trust: float
    decision: str
    reason: str

@router.get("/verify_ndr", response_model=NDRResponse)
def verify_non_delivery_report(delivery_id: str = Query(...)):
    if delivery_id not in MOCK_DELIVERIES:
        raise HTTPException(status_code=404, detail="Delivery record not found.")

    delivery = MOCK_DELIVERIES[delivery_id]
    courier = MOCK_COURIERS.get(delivery["courier_id"], {"trust_score": 50.0})
    
    variance = calculate_haversine_distance(delivery["customer_gps"], delivery["dropoff_gps"])
    
    decision = "Pending Manual Review"
    reason = "Anomalies detected in multiple vectors."
    
    if variance <= 50.0:
        if courier["trust_score"] >= 80.0:
            decision = "Reject Customer NDR (Auto-Deny)"
            reason = f"GPS dropoff is accurate ({variance:.1f}m variance) and Courier trust is high ({courier['trust_score']}/100). Customer claim flagged as fraudulent."
        else:
            decision = "Approve Customer NDR (Courier Penalty)"
            reason = f"GPS dropoff is accurate, but Courier trust is critically low ({courier['trust_score']}/100). Suspected courier theft. Customer claim approved."
    else:
        decision = "Approve Customer NDR (Misdelivery)"
        reason = f"Massive spatial anomaly detected. Courier dropped package {variance:.1f} meters away from registered address. Issuing replacement to customer."

    return {
        "delivery_id": delivery_id,
        "variance_meters": round(variance, 2),
        "courier_trust": courier["trust_score"],
        "decision": decision,
        "reason": reason
    }