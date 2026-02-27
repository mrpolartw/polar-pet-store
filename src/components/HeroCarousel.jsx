import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './HeroCarousel.css';

const slides = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=2400',
        title: 'Polar Pro',
        subtitle: '重新定義，頂級寵物營養學。',
        desc: '以航太級凍乾鎖鮮技術，封存來自純淨海域與農場的最原始精華。'
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2400',
        title: '溫暖陪伴每一天',
        subtitle: '為牠們量身打造的日常餐點。',
        desc: '每一口都充滿了愛與關懷，讓您的愛犬天天活力充沛。'
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&q=80&w=2400',
        title: '原肉手工零食',
        subtitle: '週末的幸福獎勵，純粹無添加。',
        desc: '從源頭把關的安心肉源，無化學香料滿足球小怪物的味蕾。'
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

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    const goToSlide = (idx) => setCurrentIndex(idx);

    return (
        <section
            className="hero-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div
                className="carousel-inner"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div key={slide.id} className="carousel-item">
                        <div className="carousel-bg" style={{ backgroundImage: `url(${slide.image})` }}></div>
                        <div className="carousel-content">
                            <h1 className="headline-pro">{slide.title}</h1>
                            <p className="subhead-pro">{slide.subtitle}</p>
                            <p className="description-pro">{slide.desc}</p>
                            <div className="btns-wrapper">
                                <button className="btn-blue">進一步了解</button>
                                <button className="btn-link">購買</button>
                            </div>
                        </div>
                    </div>
                ))}
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
