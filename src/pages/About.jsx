import React from 'react';
import './About.css';

const About = () => {
    return (
        <main className="about-page">
            <section className="about-hero">
                <div className="text-container">
                    <h1 className="headline-pro">關於 Polar</h1>
                    <p className="subhead-pro">出於愛，所以我們追求極致。</p>
                </div>
            </section>

            <section className="about-story">
                <div className="story-content">
                    <h2 className="headline-regular" style={{ marginBottom: '24px' }}>一段始於挑嘴的旅程</h2>
                    <p className="description-pro" style={{ textAlign: 'left', maxWidth: '800px' }}>
                        2021年，創辦人的黃金獵犬 Polar 開始出現嚴重的腸胃敏感與挑食問題。在嘗試了市面上超過 50 種頂級飼料後，我們發現，真正的問題在於「高度加工」與「不透明的肉源」。
                    </p>
                    <p className="description-pro" style={{ textAlign: 'left', maxWidth: '800px' }}>
                        於是，我們集結了獸醫、動物營養學家以及生鮮食材供應商，決定從零開始，打造一款我們自己敢天天餵食的終極主食。這就是 Polar 的誕生。
                    </p>
                </div>
            </section>

            <section className="about-values">
                <div className="values-grid">
                    <div className="value-item">
                        <span className="value-icon">🌿</span>
                        <h3>與自然同行</h3>
                        <p>我們採用 100% 永續農場來源的放牧肉品，拒絕工廠化密集養殖，把尊重生命的理念落實於生產線。</p>
                    </div>
                    <div className="value-item">
                        <span className="value-icon">🔍</span>
                        <h3>極限透明</h3>
                        <p>我們相信透明是最好的防護。從農場到碗裡，所有成分履歷我們毫無保留地對消費者公開。</p>
                    </div>
                    <div className="value-item">
                        <span className="value-icon">🔬</span>
                        <h3>科研實證</h3>
                        <p>拒絕沒有科學根據的玄學偏方。每一份配方皆經過嚴謹的雙盲測試與長期血液學追蹤，確認真正對寵物有益。</p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default About;
