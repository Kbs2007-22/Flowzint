"""
claim.py — Router for AI-triaging damage/loss claims.
"""
import io
import cv2
import numpy as np
from PIL import Image, ExifTags
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

MOCK_CUSTOMER_DB = {
    "CUST_A01": {"claims_filed": 1, "claims_denied": 0, "avg_gps_delta_meters": 5.0},
    "CUST_A02": {"claims_filed": 2, "claims_denied": 0, "avg_gps_delta_meters": 12.0},
    "CUST_A03": {"claims_filed": 0, "claims_denied": 0, "avg_gps_delta_meters": 2.5},
    "CUST_A04": {"claims_filed": 1, "claims_denied": 0, "avg_gps_delta_meters": 8.0},
    "CUST_A05": {"claims_filed": 0, "claims_denied": 0, "avg_gps_delta_meters": 14.5},
    "CUST_A06": {"claims_filed": 2, "claims_denied": 0, "avg_gps_delta_meters": 6.2},
    "CUST_A07": {"claims_filed": 1, "claims_denied": 0, "avg_gps_delta_meters": 3.8},
    "CUST_A08": {"claims_filed": 0, "claims_denied": 0, "avg_gps_delta_meters": 9.1},
    "CUST_A09": {"claims_filed": 2, "claims_denied": 0, "avg_gps_delta_meters": 1.5},
    "CUST_A10": {"claims_filed": 1, "claims_denied": 0, "avg_gps_delta_meters": 11.0},
    "CUST_A11": {"claims_filed": 0, "claims_denied": 0, "avg_gps_delta_meters": 7.4},
    "CUST_A12": {"claims_filed": 1, "claims_denied": 0, "avg_gps_delta_meters": 4.9},
    "CUST_A13": {"claims_filed": 2, "claims_denied": 0, "avg_gps_delta_meters": 13.2},
    "CUST_A14": {"claims_filed": 0, "claims_denied": 0, "avg_gps_delta_meters": 5.8},
    "CUST_A15": {"claims_filed": 1, "claims_denied": 0, "avg_gps_delta_meters": 8.7},
    "CUST_B01": {"claims_filed": 4, "claims_denied": 0, "avg_gps_delta_meters": 150.0},
    "CUST_B02": {"claims_filed": 6, "claims_denied": 1, "avg_gps_delta_meters": 65.0},
    "CUST_B03": {"claims_filed": 5, "claims_denied": 0, "avg_gps_delta_meters": 220.0},
    "CUST_B04": {"claims_filed": 3, "claims_denied": 0, "avg_gps_delta_meters": 85.0},
    "CUST_B05": {"claims_filed": 8, "claims_denied": 1, "avg_gps_delta_meters": 110.0},
    "CUST_B06": {"claims_filed": 5, "claims_denied": 0, "avg_gps_delta_meters": 350.0},
    "CUST_B07": {"claims_filed": 4, "claims_denied": 0, "avg_gps_delta_meters": 95.0},
    "CUST_C01": {"claims_filed": 4, "claims_denied": 2, "avg_gps_delta_meters": 800.0},
    "CUST_C02": {"claims_filed": 12, "claims_denied": 4, "avg_gps_delta_meters": 1200.0},
    "CUST_C03": {"claims_filed": 6, "claims_denied": 3, "avg_gps_delta_meters": 450.0},
}

MOCK_PRODUCT_DB = {
    "PROD_ELEC1": {"name": "Standard Laptop", "policy": "standard"},
    "PROD_ELEC2": {"name": "Wireless Ergonomic Mouse", "policy": "standard"},
    "PROD_ELEC3": {"name": "Mechanical Keyboard", "policy": "standard"},
    "PROD_ELEC4": {"name": "27-inch Gaming Monitor", "policy": "standard"},
    "PROD_ELEC5": {"name": "USB-C Multiport Hub", "policy": "standard"},
    "PROD_APP1":  {"name": "Men's Denim Jacket", "policy": "standard"},
    "PROD_APP2":  {"name": "Women's Running Shoes", "policy": "standard"},
    "PROD_APP3":  {"name": "Cotton T-Shirt 3-Pack", "policy": "standard"},
    "PROD_HOME1": {"name": "Ceramic Coffee Mug Set", "policy": "standard"},
    "PROD_HOME2": {"name": "Memory Foam Pillow", "policy": "standard"},
    "PROD_HOME3": {"name": "LED Desk Lamp", "policy": "standard"},
    "PROD_OUT1":  {"name": "4-Person Camping Tent", "policy": "standard"},
    "PROD_OUT2":  {"name": "65L Hiking Backpack", "policy": "standard"},
    "PROD_TOOL1": {"name": "Cordless Power Drill", "policy": "standard"},
    "PROD_TOOL2": {"name": "Magnetic Screwdriver Set", "policy": "standard"},
    "PROD_HYG1":  {"name": "Skincare Serum", "policy": "hygiene_refund_only"},
    "PROD_HYG2":  {"name": "Toothbrush Replacement Heads", "policy": "hygiene_refund_only"},
    "PROD_HYG3":  {"name": "Perfume Discovery Set", "policy": "hygiene_refund_only"},
    "PROD_CLR1":  {"name": "Digital Gift Card ($50)", "policy": "strict_final_sale"},
    "PROD_CLR2":  {"name": "Clearance Winter Coat", "policy": "strict_final_sale"}
}

def calculate_trust_score(customer_id: str) -> float:
    if customer_id not in MOCK_CUSTOMER_DB: return 50.0
    data = MOCK_CUSTOMER_DB[customer_id]
    if data["claims_denied"] >= 2: return 0.0
    T = ((1.0 - (data["claims_denied"] / (data["claims_filed"] + 1))) * 100.0) - ((data["avg_gps_delta_meters"] / 1000.0) * 20.0)
    return max(0.0, min(100.0, T))

def extract_exif_metadata(image_bytes: bytes) -> Dict[str, Any]:
    flag = False
    metadata_count = 0
    try:
        image = Image.open(io.BytesIO(image_bytes))
        exifdata = image.getexif()
        if not exifdata: flag = True
        else:
            for tag_id in exifdata: metadata_count += 1
    except Exception as e:
        flag = True
    return {"has_metadata": not flag, "flagged": flag}

def calculate_error_level_analysis(image_bytes: bytes) -> Dict[str, Any]:
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        original = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        _, encoded_img = cv2.imencode('.jpg', original, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        resaved = cv2.imdecode(encoded_img, cv2.IMREAD_COLOR)
        gray_diff = cv2.cvtColor(cv2.absdiff(original, resaved), cv2.COLOR_BGR2GRAY)
        
        max_error, mean_error = np.max(gray_diff), np.mean(gray_diff)
        
        # THE FIX: Wrap the NumPy condition in bool() to cast it to a standard Python boolean
        ela_flag = bool(max_error > 50 and (max_error / (mean_error + 1e-5)) > 15)
        
        return {"max_error": int(max_error), "mean_error": float(mean_error), "flagged": ela_flag}
    except Exception as e:
        return {"max_error": 0, "mean_error": 0.0, "flagged": True}

def mock_deepfake_classifier(image_bytes: bytes) -> float:
    size_kb = len(image_bytes) / 1024
    return float(np.random.uniform(0.6, 0.95) if size_kb < 10 else np.random.uniform(0.01, 0.15))

router = APIRouter(prefix="/api/claims", tags=["Claims"])

@router.post("/triage")
async def process_triage(
    customer_id: str = Form(...),
    order_id: str = Form(...),
    product_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image.")
        
    image_bytes = await file.read()
    product = MOCK_PRODUCT_DB.get(product_id, {"name": "Unknown", "policy": "standard"})
    
    trust_score = calculate_trust_score(customer_id)
    exif = extract_exif_metadata(image_bytes)
    ela = calculate_error_level_analysis(image_bytes)
    p_fake = mock_deepfake_classifier(image_bytes)
    is_visual_flagged = exif["flagged"] or ela["flagged"] or (p_fake > 0.5)

    decision = "Human Review"
    reason = "Standard processing."
    refund_status = "pending_review"

    if product["policy"] == "strict_final_sale":
        if trust_score >= 75 and not is_visual_flagged:
            decision = "Human Review (Policy Exception)"
            reason = f"Final sale item ({product['name']}) claims genuine defect. Escalate to human for policy exception."
            refund_status = "pending_review"
        else:
            decision = "Auto-Deny"
            reason = f"Product '{product['name']}' is final sale. Does not meet high-trust exception criteria."
            refund_status = "denied"
            
    elif product["policy"] == "hygiene_refund_only":
        if trust_score >= 75 and not is_visual_flagged:
            decision = "Auto-Approve (Refund Only)"
            reason = f"Product '{product['name']}' is a hygiene item. Defect verified. Issuing direct refund."
            refund_status = "processed"
        elif trust_score >= 75 and is_visual_flagged:
            decision = "Human Review"
            reason = "Account valid, but localized image structural anomalies detected on hygiene claim."
            refund_status = "pending_review"
        elif trust_score < 75 and is_visual_flagged:
            decision = "Auto-Deny"
            reason = "Definitive media manipulation detected on high-risk profile."
            refund_status = "denied"
        else:
            decision = "Human Review"
            reason = "Image clear, but account profile shows high fraud risk vectors."
            refund_status = "pending_review"
            
    else: 
        if trust_score >= 75:
            if not is_visual_flagged:
                decision = "Auto-Approve"
                reason = "Pristine verification matching a high-trust account. Return shipping labels generated."
                refund_status = "pending_return_scan"
            else:
                decision = "Human Review"
                reason = "Account valid, but localized image structural anomalies detected."
                refund_status = "pending_review"
        else:
            if is_visual_flagged:
                decision = "Auto-Deny"
                reason = "Definitive media manipulation detected on high-risk profile."
                refund_status = "denied"
            else:
                decision = "Human Review"
                reason = "Image clear, but account profile shows high fraud risk vectors."
                refund_status = "pending_review"
            
    if trust_score == 0.0:
        decision = "Auto-Deny"
        reason = "Account locked due to historical fraud conviction (claims_denied >= 2)."
        refund_status = "denied_fraud_lock"

    return {
        "customer_id": customer_id,
        "order_id": order_id,
        "product_id": product_id,
        "metrics": {
            "trust_score": round(trust_score, 2),
            "visual_forensics": {
                "exif_flagged": exif["flagged"],
                "ela_max_error": ela["max_error"],
                "ela_flagged": ela["flagged"],
                "deepfake_probability": round(p_fake, 4)
            }
        },
        "outcome": {
            "decision": decision,
            "reason": reason,
            "refund_status": refund_status
        }
    }