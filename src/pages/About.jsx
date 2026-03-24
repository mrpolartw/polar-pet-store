import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
    return (
        <main className="about-page">
            <section className="about-hero">
                <div className="text-container">
                    <h1 className="headline-pro">北極先生是怎麼來的</h1>
                    <p className="subhead-pro">一包肉泥的背後，是我們對毛孩認真的態度。</p>
                </div>
            </section>

            <section className="about-story">
                <div className="story-content">
                    <h2 className="headline-regular" style={{ marginBottom: '24px' }}>為什麼是北極熊？</h2>
                    <p className="description-pro" style={{ textAlign: 'left', maxWidth: '800px' }}>
                        北極熊是地球上最大的陸地食肉動物。但牠吃的每一口，都是自己獵來的。天然、直接、沒有多餘的。我們想做的食物，就是這樣。
                    </p>
                    <p className="description-pro" style={{ textAlign: 'left', maxWidth: '800px' }}>
                        選擇北極，是因為那是地球上最需要被守護的地方。乾淨、純粹、不被打擾。我們希望毛孩吃進去的每一樣東西，也是這樣。
                    </p>
                </div>
            </section>

            <section className="about-story" style={{ backgroundColor: 'var(--color-bg-white)' }}>
                <div className="story-content">
                    <h2 className="headline-regular" style={{ marginBottom: '24px' }}>我們在做的事</h2>
                    <p className="description-pro" style={{ textAlign: 'left', maxWidth: '800px' }}>
                        不是只賣食物。是陪著每一個毛孩家庭，找到最適合牠的那一樣東西。
                    </p>
                </div>
            </section>

            <section className="about-values">
                <div style={{ maxWidth: '1024px', width: '100%' }}>
                    <div className="story-content" style={{ margin: '0 auto 48px', textAlign: 'center' }}>
                        <h2 className="headline-regular" style={{ marginBottom: '20px' }}>背後的人</h2>
                        <p className="description-pro" style={{ maxWidth: '720px', margin: '0 auto', color: 'var(--color-gray-dark)' }}>
                            我們不是站得很遠的品牌。是你養毛孩這條路上，願意一直陪你一起想的人。
                        </p>
                    </div>
                    <div className="values-grid">
                        <div className="value-item">
                            <span className="value-icon">🌿</span>
                            <h3>成分看得懂</h3>
                            <p>每一樣食材，你在廚房裡就認得出來。沒有複雜的化學名稱，只有真正的食物。</p>
                        </div>
                        <div className="value-item">
                            <span className="value-icon">💚</span>
                            <h3>吃得剛好</h3>
                            <p>低熱量、低鈉。不是為了噱頭，是因為這樣對毛孩的身體才是真的好。</p>
                        </div>
                        <div className="value-item">
                            <span className="value-icon">🐾</span>
                            <h3>我們自己也會用</h3>
                            <p>每一款產品，我們都用自己對毛孩的標準去做。不確定的，我們不放。</p>
                        </div>
                        <div className="value-item">
                            <span className="value-icon">🤍</span>
                            <h3>不只是賣東西</h3>
                            <p>我們想成為你養毛孩這條路上，一直都在的那個存在。</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-story" style={{ backgroundColor: 'var(--color-bg-white)' }}>
                <div className="story-content" style={{ textAlign: 'center' }}>
                    <h2 className="headline-regular" style={{ marginBottom: '20px' }}>準備好了嗎？</h2>
                    <p className="description-pro" style={{ maxWidth: '720px', margin: '0 auto' }}>
                        從第一款開始，找到毛孩最喜歡的那個。
                    </p>
                    <div className="btns-wrapper" style={{ justifyContent: 'center', marginTop: '32px' }}>
                        <Link to="/products">
                            <button className="btn-blue">幫毛孩找一款</button>
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default About;
