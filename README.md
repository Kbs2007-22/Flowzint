Executive Summary
Flowzint is a Zero-Trust Autonomous Resolution Engine designed to revolutionize e-commerce customer support. Traditional chatbots act as mere routing layers, frustrating users and ultimately defaulting to human agents for high-stakes resolutions. Flowzint replaces this bottleneck with an autonomous operating system capable of making definitive, risk-assessed decisions on refunds, missing deliveries, and defect claims.
By cross-referencing multi-modal data — including visual AI embeddings, geospatial coordinates, and historical CRM data — Flowzint creates a frictionless experience for high-trust customers while serving as an ironclad digital fraud-prevention layer. It instantly approves legitimate claims, flags geographical anomalies in real-time, and uses advanced machine learning to visually cluster systemic manufacturing defects, fundamentally transforming customer care from a cost center into an intelligent operational asset.
Unique Selling Proposition (USP)
Flowzint's competitive advantage lies in its ability to resolve rather than route, utilizing three distinct decision engines to eliminate human intervention for up to 80% of routine claims without compromising security:
Dynamic Trust-Based Resolution: Flowzint calculates a real-time "Trust Score" by evaluating a user's historical spend against their lifetime claim value. High-trust customers experience zero friction and receive instant, automated store credit for eligible items. High-risk profiles or non-returnable item claims automatically trigger a hard stop and escalate to human review.
Geospatial Delivery Verification: To combat "False Delivery" claims, Flowzint bypasses text-based disputes entirely. It utilizes the geopy engine to calculate the exact physical distance between the delivery agent's recorded drop-off coordinates and the user's live location. Claims outside the acceptable radius (e.g., 100 meters) are flagged with mathematical certainty, eliminating "he-said, she-said" disputes.
Visual Pattern Recognition & Auto-Demotion: Instead of relying on text ticket volume, Flowzint analyzes the physical reality of defects. By processing defect image embeddings (e.g., 128-dimensional vectors) through DBSCAN clustering and PCA 2D visualization, the system visually groups identical physical flaws. It autonomously identifies the exact manufacturing batch causing the issue and flags it for procurement, enabling proactive rather than reactive quality control.
Automated Defect Validation (claims.py / Returns & Exchanges) ; What it does: Uses Vision AI & Media processing to handle live camera APIs and media uploads via the frontend. ; The USP: Instead of manual inspection, it runs the Hugging Face CLIP model to automatically analyze images and validate item defects in real time. This minimizes fraudulent return claims and slashes customer service review times.
Risk-Aware Autonomous Refunds (refunds.py / Autonomous Refunds) ; What it does: Executes intelligent backend state logic during the checkout/return lifecycle. ; The USP: It dynamically queries a local database to pull customer Trust Scores and securely mutates data to orchestrate automated, instant refund or re-shipment flows (mocking the OMS API). This allows good actors to get instant resolutions while shielding the business from high-risk exploiters.
Core Tech Stack
Frontend: React, Vite (UI/Dashboard rendering dynamic PCA coordinate plots), react-router-dom (Main router), React Webcam (Camera API handling), React State, and Chart.js (Admin Dashboard UI).

Backend: Python, python-multipart (File/media uploads), FastAPI, SQLAlchemy (SQLite/Vector Data handling)
AI & Machine Learning: Hugging Face transformers (CLIP model for defect validation), Scikit-Learn (DBSCAN, PCA) for Anomaly detection & pattern recognition

Geospatial & Analytics: geopy (Coordinates & distance calculations for delivery validation), pandas (Ticket data aggregation), Numpy


Final section for README.md. It covers the prerequisites, setup steps, and how to get both servers running smoothly for local development.

Getting Started
Follow these instructions to set up Flowzint on your local machine.

Prerequisites
Ensure you have the following installed before proceeding:
Python 3.8+ (For the FastAPI backend and AI engines)
Node.js (v18+) & npm (For the React/Vite frontend)
Git
1. Clone the Repository
Bash
git clone https://github.com/Kbs2007-22/Flowzint.git
cd Flowzint


2. Backend Setup (FastAPI)
It is highly recommended to use a virtual environment to manage the Python dependencies (including the machine learning libraries like torch and scikit-learn).

Bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install the required dependencies
pip install -r requirements.txt


Note on Database: You do not need to manually configure a database. The SQLite database (customer_care.db) and its tables will automatically generate, and mock user profiles (for high-trust and low-trust testing) will seed on the first startup.

3. Frontend Setup (React/Vite)
Open a new terminal window (keep your backend terminal available) and navigate to your frontend directory (assuming it is in the root or a specific client folder).

Bash
# Install Node modules
npm install


Running the Application
To run Flowzint locally, you will need to start both the backend and frontend servers simultaneously in separate terminal windows.

Start the Backend Engine
With your virtual environment activated, run the main Python file. This will spin up the Uvicorn server on port 8000.

Bash
python main.py


API Base URL: http://localhost:8000
Interactive API Docs (Swagger UI): http://localhost:8000/docs

Start the Frontend Dashboard
In your second terminal, run the Vite development server:

Bash
npm run dev


Frontend Dashboard: http://localhost:5173 (or the port specified in your terminal)
Once both servers are running, the React application will automatically poll the backend health endpoint and connect to the agentic decision engines!
Add the USP and the working.
