import { useEffect, useRef, useState } from 'react';

export const useScrollReveal = ({
    threshold = 0.15,
    root = null,
    rootMargin = '0px',
} = {}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (ref.current) observer.unobserve(ref.current);
            }
        }, {
            root,
            rootMargin,
            threshold,
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
    }, [root, rootMargin, threshold]);

    return [ref, isVisible];
};
