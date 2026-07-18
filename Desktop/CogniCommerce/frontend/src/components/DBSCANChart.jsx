import React, { useMemo } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const getColor = (clusterId) => {
    if (clusterId === -1) return '#555555';
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return colors[clusterId % colors.length];
};

export default function DBSCANChart({ plotData }) {
    const chartData = useMemo(() => {
        if (!plotData || plotData.length === 0) return { datasets: [] };
        const clusters = {};

        plotData.forEach((point) => {
            const { cluster, x, y, name, batch_id } = point;
            if (!clusters[cluster]) {
                clusters[cluster] = {
                    label: cluster === -1 ? 'Noise (Isolated)' : `Cluster ${cluster}`,
                    data: [],
                    backgroundColor: getColor(cluster),
                    pointRadius: 6,
                    pointHoverRadius: 8,
                };
            }
            clusters[cluster].data.push({ x, y, image: name, batch: batch_id });
        });

        return { datasets: Object.values(clusters) };
    }, [plotData]);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#ccc', font: { family: 'Inter', size: 12 } }
            },
            tooltip: {
                backgroundColor: '#1a1a20',
                titleColor: '#fff',
                bodyColor: '#ccc',
                borderColor: '#333',
                borderWidth: 1,
                callbacks: {
                    label: (context) => {
                        const raw = context.raw;
                        return `Batch: ${raw.batch} | File: ${raw.image}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'PCA Dimension 1', color: '#888', font: { family: 'Orbitron' } },
                ticks: { color: '#666' },
                grid: { color: '#222' }
            },
            y: {
                title: { display: true, text: 'PCA Dimension 2', color: '#888', font: { family: 'Orbitron' } },
                ticks: { color: '#666' },
                grid: { color: '#222' }
            }
        }
    };

    return (
        <div style={{ height: '400px', width: '100%', maxWidth: '800px' }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
}