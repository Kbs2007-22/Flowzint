import React, { useState } from 'react';
import axios from 'axios';

export default function DeliveryVerification() {
    const [deliveryId, setDeliveryId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!deliveryId) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await axios.get(`/api/delivery/verify_ndr?delivery_id=${deliveryId}`);
            setResult(res.data);
        } catch (err) {
            console.error(err);
            setError("Delivery record not found or server error.");
        } finally {
            setLoading(false);
        }
    };

    const getDecisionTheme = (decision) => {
        if (decision.includes('Approve')) return { bg: '#1b4322', border: '#2d6a38', title: '#4CAF50' };
        if (decision.includes('Reject')) return { bg: '#4a1515', border: '#ff4444', title: '#ff6b6b' };
        return { bg: '#4c3e15', border: '#856a1b', title: '#ffc107' };
    };

    return (
        <div style={{ padding: '25px', background: '#121216', border: '1px solid #25252b', borderRadius: '8px', color: '#fff' }}>
            <h3 style={{ fontFamily: 'Rajdhani', margin: '0 0 5px 0', fontSize: '20px', color: '#ccc' }}>Logistics & NDR Spatial Verification</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>Cross-references Haversine GPS variance with Courier Trust Indices.</p>

            <form onSubmit={handleVerify} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Delivery ID (Mock Scenario):</label>
                    <select value={deliveryId} onChange={(e) => setDeliveryId(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#1a1a20', color: '#fff', border: '1px solid #333', borderRadius: '4px', outline: 'none' }}>
                        <option value="">Select an NDR Claim</option>
                        <option value="DEL_1001">DEL_1001 (Valid Dropoff + High Trust Courier)</option>
                        <option value="DEL_1002">DEL_1002 (Wrong House - High GPS Variance)</option>
                        <option value="DEL_1003">DEL_1003 (Valid Dropoff + Low Trust Courier)</option>
                    </select>
                </div>
                <button type="submit" disabled={loading || !deliveryId} style={{ padding: '10px 20px', background: loading || !deliveryId ? '#222' : '#25252b', color: loading || !deliveryId ? '#555' : '#36A2EB', border: `1px solid ${loading || !deliveryId ? '#333' : '#36A2EB'}`, borderRadius: '4px', cursor: loading || !deliveryId ? 'not-allowed' : 'pointer', marginTop: '22px', fontFamily: 'Orbitron', letterSpacing: '1px', fontSize: '13px', fontWeight: 'bold' }}>
                    {loading ? "CALCULATING..." : "RUN AI VERIFICATION"}
                </button>
            </form>

            {error && <p style={{ color: '#ff4444', marginTop: '15px', fontSize: '14px' }}>{error}</p>}

            {result && (
                <div style={{ marginTop: '20px', padding: '20px', background: getDecisionTheme(result.decision).bg, border: `1px solid ${getDecisionTheme(result.decision).border}`, borderRadius: '6px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontFamily: 'Orbitron', color: getDecisionTheme(result.decision).title, fontSize: '16px' }}>RESULT: {result.decision.toUpperCase()}</h4>
                    <p style={{ margin: '0 0 15px 0', color: '#ddd', fontSize: '14px' }}><strong>Reasoning:</strong> {result.reason}</p>
                    <ul style={{ margin: '0', paddingLeft: '20px', color: '#aaa', fontSize: '13px', lineHeight: '1.8' }}>
                        <li>Spatial Variance (Haversine): <span style={{ color: '#fff', fontFamily: 'JetBrains Mono' }}>{result.variance_meters} meters</span></li>
                        <li>Courier Trust Score: <span style={{ color: '#fff', fontFamily: 'JetBrains Mono' }}>{result.courier_trust}/100</span></li>
                    </ul>
                </div>
            )}
        </div>
    );
}