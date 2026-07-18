from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
from collections import Counter
from PIL import Image
import io

from transformers import CLIPProcessor, CLIPModel
import torch

# Initialize AI Models
device = "cuda" if torch.cuda.is_available() else "cpu"
model_id = "openai/clip-vit-base-patch32" 
processor = CLIPProcessor.from_pretrained(model_id)
model = CLIPModel.from_pretrained(model_id).to(device)

# This is the exact variable main.py is looking for!
router = APIRouter(prefix="/api/analytics", tags=["Analytics & Demotion"])

# In-Memory Database
db = {
    "embeddings": [],
    "images": [],
    "batch_ids": [],
    "plot_data": [],
    "cluster_summaries": {},
    "top_offender": None
}

def extract_512d_vector(image_bytes: bytes) -> list:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        image_features = model.get_image_features(**inputs)
    image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
    return image_features.cpu().numpy().flatten().tolist()

def update_realtime_system():
    n_samples = len(db["embeddings"])
    if n_samples == 0: return

    X = np.array(db["embeddings"])
    
    if n_samples >= 2:
        clustering = DBSCAN(eps=0.15, min_samples=2, metric="cosine")
        labels = clustering.fit_predict(X)
    else:
        labels = np.full(n_samples, -1)

    if n_samples == 1:
        coords = np.array([[0.0, 0.0]])
    elif n_samples == 2:
        pca = PCA(n_components=1)
        x_dim = pca.fit_transform(X).flatten()
        coords = np.stack([x_dim, np.zeros(2)], axis=1)
    else:
        pca = PCA(n_components=2)
        coords = pca.fit_transform(X)

    db["plot_data"] = []
    for i in range(n_samples):
        db["plot_data"].append({
            "name": db["images"][i],
            "batch_id": db["batch_ids"][i],
            "x": float(coords[i][0]),
            "y": float(coords[i][1]),
            "cluster": int(labels[i])
        })

    db["cluster_summaries"] = {}
    db["top_offender"] = None 
    
    unique_labels = set(labels)
    largest_cluster_size = 0
    
    for label in unique_labels:
        if label == -1: continue 
            
        batches_in_cluster = [db["batch_ids"][i] for i in range(n_samples) if labels[i] == label]
        cluster_size = len(batches_in_cluster)
        
        counter = Counter(batches_in_cluster)
        top_batch, count = counter.most_common(1)[0]
        
        db["cluster_summaries"][int(label)] = {
            "top_batch_id": top_batch,
            "defect_count": count,
            "total_cluster_size": cluster_size
        }
        
        if cluster_size > largest_cluster_size:
            largest_cluster_size = cluster_size
            db["top_offender"] = {
                "cluster_id": int(label),
                "worst_batch_id": top_batch,
                "cluster_size": cluster_size
            }

@router.post("/upload")
async def process_defect(file: UploadFile = File(...), batch_id: str = Form(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    image_bytes = await file.read()
    vector = extract_512d_vector(image_bytes)
    
    db["embeddings"].append(vector)
    db["images"].append(file.filename)
    db["batch_ids"].append(batch_id)
    
    update_realtime_system()
    
    return {
        "status": "success",
        "plot_data": db["plot_data"],
        "summaries": db["cluster_summaries"],
        "system_top_offender": db.get("top_offender")
    }

@router.get("/status")
async def get_status():
    return {
        "plot_data": db["plot_data"],
        "summaries": db["cluster_summaries"],
        "system_top_offender": db.get("top_offender")
    }