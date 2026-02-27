import React from 'react';
import './About.css'; // 復用通用內頁佈局樣式

const Category = ({ title, subtitle }) => {
    return (
        <main className="about-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
            <div className="text-container" style={{ padding: '0 20px' }}>
                <h1 className="headline-pro">{title}</h1>
                <p className="subhead-pro" style={{ marginTop: '24px' }}>{subtitle}</p>
                <p className="description-pro" style={{ marginTop: '32px' }}>全新產品線即將推出，敬請期待。</p>
                <div className="btns-wrapper" style={{ marginTop: '40px' }}>
                    <button className="btn-blue">返回首頁</button>
                </div>
            </div>
        </main>
    );
};

export default Category;
