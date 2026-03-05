import React, { useState } from 'react';

const ImageWithFallback = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);

    // 當圖片路徑失效時，自動替換為一張高品質的備用圖
    const handleError = () => {
        setImgSrc('https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1200');
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className={`img-wrapper ${isLoading ? 'loading' : 'loaded'} ${className}`}>
            <img
                src={imgSrc}
                alt={alt}
                onError={handleError}
                onLoad={handleLoad}
                style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}
            />
            {/* 這裡可以搭配 CSS 製作灰色閃爍的 Loading 效果 */}
            {isLoading && <div className="skeleton-loader"></div>}
        </div>
    );
};

export default ImageWithFallback;