import React, { useState } from 'react';

const FALLBACK_IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
        '<rect width="1200" height="800" fill="#f3efe6"/>' +
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8a7e71" font-family="Arial" font-size="48">Image unavailable</text>' +
        '</svg>'
    );

const ImageWithFallback = ({ src, alt, className }) => {
    const [loadedSrc, setLoadedSrc] = useState('');

    const handleError = (event) => {
        if (event.currentTarget.src !== FALLBACK_IMAGE) {
            event.currentTarget.src = FALLBACK_IMAGE;
        }
        setLoadedSrc(src);
    };

    const handleLoad = () => {
        setLoadedSrc(src);
    };

    const isLoading = loadedSrc !== src;

    return (
        <div className={`img-wrapper ${isLoading ? 'loading' : 'loaded'} ${className}`}>
            <img
                key={src}
                src={src}
                alt={alt}
                onError={handleError}
                onLoad={handleLoad}
                style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}
            />
            {isLoading && <div className="skeleton-loader"></div>}
        </div>
    );
};

export default ImageWithFallback;
