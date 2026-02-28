import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import banner1 from '../png/banner 1.png';
import banner2 from '../png/banner 2.png';
import banner3 from '../png/banner 3.png';
import banner4 from '../png/banner 4.png';
import banner5 from '../png/banner 5.png';
import './HeroCarousel.css';

const slides = [
    {
        id: 1,
        image: banner1,
        title: 'Polar Pro',
        subtitle: '重新定義，頂級寵物營養學。',
        desc: '以航太級凍乾鎖鮮技術，封存來自純淨海域與農場的最原始精華。'
    },
    {
        id: 2,
        image: banner2,
        title: '溫暖陪伴每一天',
        subtitle: '為牠們量身打造的日常餐點。',
        desc: '每一口都充滿了愛與關懷，讓您的愛犬天天活力充沛。'
    },
    {
        id: 3,
        image: banner3,
        title: '原肉手工零食',
        subtitle: '週末的幸福獎勵，純粹無添加。',
        desc: '從源頭把關的安心肉源，無化學香料滿足球小怪物的味蕾。'
    },
    {
        id: 4,
        image: banner4,
        title: '無憂無慮的日常跑跳',
        subtitle: '全方位的關節保養與防護。',
        desc: '科學精算的全方位營養，搭配玻尿酸與天然軟骨素，讓每一步都穩健輕盈。'
    },
    {
        id: 5,
        image: banner5,
        title: '保護牠明亮的雙眼',
        subtitle: '護眼花青素與葉黃素萃取。',
        desc: '高純度的護眼營養素，減緩晶體退化，為靈魂之窗點亮溫柔的光芒。'
    }
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
                        <div className="carousel-bg" style={{ backgroundImage: `url(${slides[currentIndex].image})` }}></div>
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
