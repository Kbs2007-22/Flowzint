import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ClaimTriageForm from './components/ClaimTriageForm';
import DeliveryVerification from './components/DeliveryVerification';
import DefectUploadForm from './components/DefectUploadForm';
import DBSCANChart from './components/DBSCANChart';

export default function App() {
    const [triageResult, setTriageResult] = useState(null);
    const [analytics, setAnalytics] = useState({
        plot_data: [],
        summaries: {},
        system_top_offender: null
    });

    // Fetch initial spatial system payload on mount
    useEffect(() => {
        async function fetchInitialStatus() {
            try {
                const response = await axios.get('/api/analytics/status');
                setAnalytics({
                    plot_data: response.data.plot_data,
                    summaries: response.data.summaries,
                    system_top_offender: response.data.system_top_offender
                });
            } catch (error) {
                console.error("Failed to load initial analytics payload:", error);
            }
        }
        fetchInitialStatus();
    }, []);

    const handleDataUpdate = (newData) => {
        setAnalytics({
            plot_data: newData.plot_data,
            summaries: newData.summaries,
            system_top_offender: newData.system_top_offender
        });
    };

    const getClusterColor = (clusterId) => {
        if (clusterId === -1) return '#999999';
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        return colors[clusterId % colors.length];
    };

    const getDecisionColor = (decision) => {
        if (decision.includes('Approve')) return '#1b4322';
        if (decision.includes('Review')) return '#4c3e15';
        if (decision.includes('Deny')) return '#4a1515';
        return '#222227';
    };

    const getRefundBadge = (status) => {
        if (status === 'processed') return <span style={{ background: '#28a745', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>PROCESSED</span>;
        if (status === 'pending_return_scan') return <span style={{ background: '#17a2b8', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>WAITING FOR CARRIER SCAN</span>;
        if (status.includes('denied')) return <span style={{ background: '#dc3545', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>DENIED</span>;
        return <span style={{ background: '#ffc107', color: '#333', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>PENDING HUMAN REVIEW</span>;
    };

    return (
        <div style={{ backgroundColor: '#0b0b0d', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

            {/* 🟢 FIXED TOP-LEFT NAVIGATION BAR */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                background: '#0b0b0d',
                borderBottom: '1px solid #222',
                padding: '15px 30px',
                zIndex: 1000,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 style={{ fontFamily: 'Orbitron', color: '#fff', margin: 0, fontSize: '24px', letterSpacing: '2px', fontWeight: '900' }}>
                        <span style={{ color: '#36A2EB' }}>⚡</span> CogniCommerce <span style={{ color: '#888' }}>.AI</span>
                    </h1>
                    <span style={{ color: '#444', fontSize: '14px', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>// MULTI-AGENT THREAT MATRIX</span>
                </div>
            </nav>

            {/* Main Content Container - Added paddingTop to push content below the fixed navbar */}
            <div style={{ padding: '100px 30px 30px 30px', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Real-time Risk Banner */}
                {analytics.system_top_offender && (
                    <div style={{ backgroundColor: '#4a1515', border: '1px solid #ff4444', padding: '15px', borderRadius: '6px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#ff6b6b', fontFamily: 'Orbitron', fontSize: '14px' }}>⚠️ AUTOMATIC DEMOTION ALARM</span>
                        <span style={{ fontSize: '15px', color: '#e5c5c5' }}>
                            Visual defect matching rules indicate that <strong>{analytics.system_top_offender.worst_batch_id}</strong> is heavily linked to Cluster #{analytics.system_top_offender.cluster_id} ({analytics.system_top_offender.cluster_size} items matched).
                        </span>
                    </div>
                )}

                {/* Grid Layout wrapping all operational sectors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>

                    {/* Sector 1: Logistics & Delivery Shield */}
                    <section>
                        <h2 style={{ fontFamily: 'Orbitron', fontSize: '18px', color: '#888', borderBottom: '1px solid #222', paddingBottom: '8px', marginBottom: '15px' }}>[01] LOGISTICS VERIFICATION SUBSYSTEM</h2>
                        <DeliveryVerification />
                    </section>

                    {/* Sector 2: WebRTC Triage Guard */}
                    <section>
                        <h2 style={{ fontFamily: 'Orbitron', fontSize: '18px', color: '#888', borderBottom: '1px solid #222', paddingBottom: '8px', marginBottom: '15px' }}>[02] MULTIMODAL CLAIMS ARBITRATION</h2>
                        <ClaimTriageForm onTriageComplete={setTriageResult} />

                        {triageResult && (
                            <div style={{ marginTop: '20px', padding: '20px', background: getDecisionColor(triageResult.outcome.decision), border: '1px solid #444', borderRadius: '6px' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'Orbitron', fontSize: '16px' }}>ARBITRATION DECISION: {triageResult.outcome.decision}</h3>
                                <p style={{ margin: '0 0 15px 0', color: '#ddd', fontSize: '14px' }}><strong>Reasoning:</strong> {triageResult.outcome.reason}</p>
                                <div style={{ marginBottom: '15px' }}><strong>Financial Ledger Action:</strong> {getRefundBadge(triageResult.outcome.refund_status)}</div>

                                <hr style={{ border: 'none', borderTop: '1px solid #555', margin: '15px 0' }} />

                                <h4 style={{ margin: '0 0 10px 0', fontFamily: 'Rajdhani', fontSize: '16px', color: '#aaa' }}>Telemetry Matrix Metrics</h4>
                                <ul style={{ lineHeight: '1.8', fontSize: '13px', color: '#ccc', listStyleType: 'square' }}>
                                    <li>Customer Trust Score (T): <span style={{ color: '#fff', fontFamily: 'JetBrains Mono' }}>{triageResult.metrics.trust_score}/100</span></li>
                                    <li>EXIF Metadata Validated: {triageResult.metrics.visual_forensics.exif_flagged ? <span style={{ color: '#ff4444' }}>ANOMALY DETECTED (STRIPPED HEADERS)</span> : <span style={{ color: '#28a745' }}>INTEGRITY VERIFIED</span>}</li>
                                    <li>ELA Matrix Discrepancy: Max Deviation {triageResult.metrics.visual_forensics.ela_max_error} {triageResult.metrics.visual_forensics.ela_flagged ? <span style={{ color: '#ff4444' }}>(LOCALIZED COMPRESSION ASYMMETRY)</span> : <span style={{ color: '#28a745' }}>(UNIFORM COMPRESSION PASS)</span>}</li>
                                    <li>Deepfake Generative Probability: <span style={{ color: triageResult.metrics.visual_forensics.deepfake_probability > 0.5 ? '#ff4444' : '#fff' }}>{(triageResult.metrics.visual_forensics.deepfake_probability * 100).toFixed(2)}%</span></li>
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* Sector 3: Spatial Computer Vision Panel */}
                    <section>
                        <h2 style={{ fontFamily: 'Orbitron', fontSize: '18px', color: '#888', borderBottom: '1px solid #222', paddingBottom: '8px', marginBottom: '15px' }}>[03] COMPUTER VISION BATCH CLUSTERING</h2>

                        <div style={{ background: '#121216', padding: '20px', borderRadius: '8px', border: '1px solid #25252b', marginBottom: '20px' }}>
                            <DefectUploadForm onUploadSuccess={handleDataUpdate} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', alignItems: 'start' }}>
                            <div style={{ background: '#121216', padding: '20px', borderRadius: '8px', border: '1px solid #25252b' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontFamily: 'Rajdhani', fontSize: '18px', color: '#aaa' }}>CLIP Latent Space Projection</h4>
                                <DBSCANChart plotData={analytics.plot_data} />
                            </div>

                            {/* Operational Summary Panel */}
                            <div style={{ background: '#121216', padding: '20px', borderRadius: '8px', border: '1px solid #25252b', minHeight: '440px' }}>
                                <h4 style={{ margin: '0 0 15px 0', fontFamily: 'Rajdhani', fontSize: '18px', color: '#36A2EB' }}>Active Cluster Summaries</h4>
                                {Object.keys(analytics.summaries).length === 0 ? (
                                    <p style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>No active defect groups detected yet. Ingest stream pairs to isolate vector trends.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {Object.entries(analytics.summaries).map(([clusterId, summary]) => (
                                            <div key={clusterId} style={{ borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                                                <div style={{ fontWeight: 'bold', color: getClusterColor(Number(clusterId)), fontSize: '14px', marginBottom: '4px', fontFamily: 'Orbitron' }}>
                                                    Cluster #{clusterId}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#ccc' }}>
                                                    Primary Offender: <span style={{ color: '#fff', fontFamily: 'JetBrains Mono' }}>{summary.top_batch_id}</span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '2px' }}>
                                                    Batch Defect Density: {summary.defect_count} / {summary.total_cluster_size} items
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}