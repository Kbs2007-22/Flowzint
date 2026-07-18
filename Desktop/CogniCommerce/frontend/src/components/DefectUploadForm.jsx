import React, { useState } from 'react';
import axios from 'axios';

export default function DefectUploadForm({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !batchId) {
            alert("Please provide both a defect image and a Batch ID.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('batch_id', batchId);

        setLoading(true);
        try {
            const res = await axios.post('/api/analytics/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onUploadSuccess(res.data);
            setFile(null);
            setBatchId('');
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload defect. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '0', marginBottom: '10px' }}>
            <h4 style={{ fontFamily: 'Rajdhani', fontSize: '18px', color: '#aaa', margin: '0 0 15px 0' }}>Log Internal Return Vector</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ color: '#888', marginRight: '10px', fontSize: '14px' }}>Defect Image: </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{ color: '#ccc', fontSize: '14px' }}
                    />
                </div>
                <div>
                    <label style={{ color: '#888', marginRight: '10px', fontSize: '14px' }}>Batch ID: </label>
                    <input
                        type="text"
                        placeholder="e.g., Batch-B509"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        style={{ background: '#1a1a20', color: '#fff', border: '1px solid #333', padding: '8px 12px', borderRadius: '4px', outline: 'none' }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#36A2EB', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontFamily: 'Orbitron', letterSpacing: '1px', fontSize: '13px' }}>
                    {loading ? "EXTRACTING..." : "UPLOAD & ANALYZE"}
                </button>
            </form>
        </div>
    );
}