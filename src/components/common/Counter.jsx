import React, { useState, useEffect } from 'react';

const Counter = ({ end, duration = 2000, shouldStart = false }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!shouldStart) return;

        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // 使用 easeOutQuad 讓動畫在接近結束時變慢，更優雅
            const easedProgress = 1 - (1 - progress) * (1 - progress);
            setCount(Math.floor(easedProgress * end));
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration, shouldStart]);

    return <span>{count}</span>;
};

export default Counter;
