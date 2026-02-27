import React, { useState, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import './CustomCursor.css';

const CustomCursor = () => {
    const [isHovering, setIsHovering] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Spring 物理回彈阻尼設定 (大幅提升跟手感與反應速度)
    const springConfig = { damping: 20, stiffness: 400, mass: 0.1 };
    const cursorX = useSpring(0, springConfig);
    const cursorY = useSpring(0, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
            // 更新阻尼鼠標位置，減去一半的寬度 (14px) 以置中 28x28px 的肉球
            cursorX.set(e.clientX - 14);
            cursorY.set(e.clientY - 14);
        };

        const handleMouseOver = (e) => {
            // 偵測是否 hover 到可點擊元素或自訂互動卡片
            if (
                e.target.tagName.toLowerCase() === 'button' ||
                e.target.tagName.toLowerCase() === 'a' ||
                e.target.closest('button') ||
                e.target.closest('a') ||
                e.target.closest('.expandable-card-small') ||
                e.target.closest('.close-btn') ||
                e.target.classList.contains('clickable')
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        // 隱藏原生游標
        document.body.style.cursor = 'none';

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            document.body.style.cursor = 'auto'; // 清理副作用
        };
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className="cursor-wrapper"
            style={{
                x: cursorX,
                y: cursorY,
            }}
        >
            <div className={`cursor-paw ${isHovering ? 'hover' : ''}`}>
                {/* 可愛圓潤版肉球 SVG */}
                <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="9.5" r="2.5" />
                    <circle cx="12" cy="7" r="2.5" />
                    <circle cx="17" cy="9.5" r="2.5" />
                    <path d="M18.72 14.86c-.5-.95-1.52-1.63-2.61-1.74-1.28-.13-2.52.47-3.41 1.25-.19.16-.48.16-.67 0-.88-.78-2.13-1.38-3.41-1.25-1.09.11-2.11.79-2.61 1.74-.61 1.15-.4 2.68.49 3.65C7.45 19.56 8.94 20 10.5 20h3c1.56 0 3.05-.44 4.01-1.49.89-.97 1.1-2.5.49-3.65z" />
                </svg>
            </div>
        </motion.div>
    );
};

export default CustomCursor;
