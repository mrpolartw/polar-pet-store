import React from 'react';
import HeroCarousel from '../components/HeroCarousel';
import ExpandableCard from '../components/ExpandableCard';

// 引入剛寫好的檔案
import ImageWithFallback from '../components/common/ImageWithFallback';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Counter from '../components/common/Counter';

const Home = () => {
    // 使用方式
    const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.2 });

    return (
        <main>
            <HeroCarousel />

            {/* 第 2 區塊：更新內容與數字動畫 */}
            <section className={`section-stats ${statsVisible ? 'reveal' : ''}`} ref={statsRef}>
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={95} shouldStart={statsVisible} />%
                        </span>
                        <span className="stat-desc">超高適口性回饋，滿足挑食的味蕾</span>
                    </div>
                    
                    <div className="stat-item divider"></div>
                    
                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={0} shouldStart={statsVisible} />
                        </span>
                        <span className="stat-desc">人工色素與防腐劑零添加</span>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={10} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">10+ 臨床執業獸醫師探討</span>
                    </div>

                    <div className="stat-item divider"></div>

                    <div className="stat-item">
                        <span className="stat-number">
                            <Counter end={50} shouldStart={statsVisible} />+
                        </span>
                        <span className="stat-desc">多位飼主合作產品開發落實生活</span>
                    </div>
                </div>
            </section>

            {/* 以下區塊保持原樣，文字已是最新 */}
            {/* ... */}
        </main>
    );
};

export default Home;