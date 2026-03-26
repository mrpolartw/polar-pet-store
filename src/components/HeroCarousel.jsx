import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import banner1 from '../png/banner 1.png';
import banner2 from '../png/banner 2.png';
import banner3 from '../png/banner 3.png';
import banner4 from '../png/banner 4.png';
import './HeroCarousel.css';

const motion = Motion;

const slides = [
    {
        id: 1,
        image: banner1,
        title: '為毛孩，只放真正需要的。',
        subtitle: '天然食材。清楚成分。吃得放心。',
        desc: '',
    },
    {
        id: 2,
        image: banner2,
        title: '從一款肉泥開始。',
        subtitle: '保健不複雜——選對的，就夠了。',
        desc: '',
    },
    {
        id: 3,
        image: banner3,
        title: '你在乎牠吃什麼，我們也是。',
        subtitle: '每一樣食材，都有我們說得清楚的理由。',
        desc: '',
    },
    {
        id: 4,
        image: banner4,
        title: '加入北極先生。',
        subtitle: '成為會員，和毛孩一起開始。',
        desc: '',
    },
];

const HeroCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let timer;
        if (!isPaused) {
            timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % slides.length);
            }, 5000); // 5 秒輪播一次
        }
        return () => clearInterval(timer);
    }, [isPaused]);

    // 切換方向狀態，用於控制動畫進場退場方向
    const [direction, setDirection] = useState(0);

    // Touch / Swipe 支援
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const deltaX = touchStartX.current - e.changedTouches[0].clientX;
        const deltaY = touchStartY.current - e.changedTouches[0].clientY;

        // 只有橫向滑動幅度 > 縱向時才觸發換頁（避免干擾垂直捲動）
        if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

        if (deltaX > 0) {
            nextSlide();
        } else {
            prevSlide();
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const goToSlide = (idx) => {
        setDirection(idx > currentIndex ? 1 : -1);
        setCurrentIndex(idx);
    };

    // Framer Motion 動畫設置 (輕量平滑滑動)
    const slideVariants = {
        enter: (dir) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (dir) => ({
            zIndex: 0,
            x: dir < 0 ? '100%' : '-100%',
            opacity: 0,
        })
    };

    return (
        <section
            className="hero-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="carousel-inner" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'tween', ease: 'easeOut', duration: 0.6 },
                            opacity: { duration: 0.4 }
                        }}
                        className="carousel-item"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    >
                        <div className="carousel-bg" style={{ backgroundImage: `url(${slides[currentIndex].image})` }} />
                    </motion.div>
                </AnimatePresence>
            </div>

            <button className="carousel-btn prev" onClick={prevSlide} aria-label="上一張">
                <ChevronLeft size={28} />
            </button>
            <button className="carousel-btn next" onClick={nextSlide} aria-label="下一張">
                <ChevronRight size={28} />
            </button>

            <div className="carousel-indicators">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={`indicator-dot ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(idx)}
                        aria-label={`跳至第 ${idx + 1} 張`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroCarousel;
