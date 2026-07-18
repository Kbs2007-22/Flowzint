import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function ClaimTriageForm({ onTriageComplete }) {
    const [customerId, setCustomerId] = useState('');
    const [orderId, setOrderId] = useState('');
    const [productId, setProductId] = useState('');
    const [loading, setLoading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            // Save the stream in the ref
            streamRef.current = stream;
            // Trigger a re-render so the <video> element appears on screen
            setCameraActive(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Camera access is required to enforce liveness.");
        }
    };

    // Wait for the video element to mount, then attach the stream
    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraActive]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // Cleanup camera if the component unmounts
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const handleCaptureAndSubmit = async (e) => {
        e.preventDefault();
        if (!customerId || !orderId || !productId || !cameraActive) {
            alert("Please populate all fields and activate the secure camera.");
            return;
        }

        setLoading(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                alert("Failed to capture frame.");
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', blob, `live_capture_${Date.now()}.jpg`);
            formData.append('customer_id', customerId);
            formData.append('order_id', orderId);
            formData.append('product_id', productId);

            try {
                const res = await axios.post('/api/claims/triage', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                onTriageComplete(res.data);
                setCustomerId('');
                setOrderId('');
                setProductId('');
                stopCamera();
            } catch (err) {
                console.error("Triage engine connection failed:", err);
                alert("Failed to process triage. Backend running?");
            } finally {
                setLoading(false);
            }
        }, 'image/jpeg', 0.95);
    };

    return (
        <div style={{ padding: '25px', background: '#121216', border: '1px solid #25252b', borderRadius: '8px', color: '#fff' }}>
            <h3 style={{ fontFamily: 'Rajdhani', margin: '0 0 5px 0', fontSize: '20px', color: '#ccc' }}>Autonomous AI Triage Portal</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Liveness enforcement active. Gallery image uploads disabled.</p>

            <form onSubmit={handleCaptureAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 250px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Customer ID (Mock): </label>
                        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#1a1a20', color: '#fff', border: '1px solid #333', borderRadius: '4px', outline: 'none' }}>
                            <option value="">Select a Customer</option>
                            <option value="CUST_A01">CUST_A01 (High Trust)</option>
                            <option value="CUST_B02">CUST_B02 (Borderline Risk)</option>
                            <option value="CUST_C01">CUST_C01 (Flagged Fraud)</option>
                        </select>
                    </div>

                    <div style={{ flex: '1 1 250px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Product ID (Mock Policy): </label>
                        <select value={productId} onChange={(e) => setProductId(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#1a1a20', color: '#fff', border: '1px solid #333', borderRadius: '4px', outline: 'none' }}>
                            <option value="">Select an Item</option>
                            <optgroup label="Standard Returnable" style={{ color: '#aaa' }}>
                                <option value="PROD_ELEC1">PROD_ELEC1 (Laptop)</option>
                                <option value="PROD_ELEC2">PROD_ELEC2 (Wireless Mouse)</option>
                                <option value="PROD_ELEC3">PROD_ELEC3 (Mechanical Keyboard)</option>
                                <option value="PROD_ELEC4">PROD_ELEC4 (Gaming Monitor)</option>
                                <option value="PROD_ELEC5">PROD_ELEC5 (USB-C Hub)</option>
                                <option value="PROD_APP1">PROD_APP1 (Denim Jacket)</option>
                                <option value="PROD_APP2">PROD_APP2 (Running Shoes)</option>
                                <option value="PROD_APP3">PROD_APP3 (T-Shirt Pack)</option>
                                <option value="PROD_HOME1">PROD_HOME1 (Mug Set)</option>
                                <option value="PROD_HOME2">PROD_HOME2 (Memory Foam Pillow)</option>
                                <option value="PROD_HOME3">PROD_HOME3 (Desk Lamp)</option>
                                <option value="PROD_OUT1">PROD_OUT1 (Camping Tent)</option>
                                <option value="PROD_OUT2">PROD_OUT2 (Hiking Backpack)</option>
                                <option value="PROD_TOOL1">PROD_TOOL1 (Power Drill)</option>
                                <option value="PROD_TOOL2">PROD_TOOL2 (Screwdriver Set)</option>
                            </optgroup>
                            <optgroup label="Non-Returnable / Restricted" style={{ color: '#aaa' }}>
                                <option value="PROD_HYG1">PROD_HYG1 (Skincare Serum - Hygiene)</option>
                                <option value="PROD_HYG2">PROD_HYG2 (Toothbrush Heads - Hygiene)</option>
                                <option value="PROD_HYG3">PROD_HYG3 (Perfume Set - Hygiene)</option>
                                <option value="PROD_CLR1">PROD_CLR1 (Gift Card - Final Sale)</option>
                                <option value="PROD_CLR2">PROD_CLR2 (Clearance Coat - Final Sale)</option>
                            </optgroup>
                        </select>
                    </div>

                    <div style={{ flex: '1 1 250px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Order ID: </label>
                        <input type="text" placeholder="e.g., ORD-9912" value={orderId} onChange={(e) => setOrderId(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#1a1a20', color: '#fff', border: '1px solid #333', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                </div>

                <div>
                    {!cameraActive ? (
                        <button type="button" onClick={startCamera} style={{ padding: '12px 20px', background: '#25252b', color: '#36A2EB', border: '1px solid #36A2EB', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Orbitron', letterSpacing: '1px', fontSize: '13px' }}>
                            ENABLE SECURE CAMERA
                        </button>
                    ) : (
                        <div style={{ position: 'relative', width: 'fit-content' }}>
                            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', border: '2px solid #36A2EB', display: 'block' }} />
                            <button type="button" onClick={stopCamera} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '11px' }}>
                                STOP
                            </button>
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>

                <button type="submit" disabled={loading || !cameraActive} style={{ padding: '14px', background: loading || !cameraActive ? '#222' : '#1b4322', color: loading || !cameraActive ? '#555' : '#4CAF50', border: `1px solid ${loading || !cameraActive ? '#333' : '#2d6a38'}`, borderRadius: '4px', cursor: loading || !cameraActive ? 'not-allowed' : 'pointer', maxWidth: '250px', fontWeight: 'bold', fontFamily: 'Orbitron', letterSpacing: '1px', fontSize: '14px' }}>
                    {loading ? "ANALYZING MATRIX..." : "CAPTURE & TRIAGE"}
                </button>
            </form>
        </div>
    );
}