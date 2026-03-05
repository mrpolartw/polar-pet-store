import { useEffect, useState, useRef } from 'react';

export const useScrollReveal = (options = {}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        // 建立觀察器
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                // 一旦觸發後就停止觀察（通常 Apple 的動畫只會跑一次）
                if (ref.current) observer.unobserve(ref.current);
            }
        }, {
            root: null, // 以視窗為準
            rootMargin: '0px',
            threshold: options.threshold || 0.15, // 元素進入 15% 時觸發
            ...options
        });

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [options]);

    return [ref, isVisible];
};