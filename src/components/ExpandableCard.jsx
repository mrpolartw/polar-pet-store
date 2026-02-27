import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ExpandableCard.css';

const ExpandableCard = ({ id, title, subtitle, content, image }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* 縮小狀態的卡片 (按鈕) */}
            <motion.div
                layoutId={`card-container-${id}`}
                className="expandable-card-small"
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <motion.div layoutId={`card-image-container-${id}`} className="card-image-wrapper">
                    <motion.img layoutId={`card-image-${id}`} src={image} alt={title} />
                </motion.div>
                <motion.div layoutId={`card-content-${id}`} className="card-content">
                    <motion.h3 layoutId={`card-title-${id}`}>{title}</motion.h3>
                    <motion.p layoutId={`card-subtitle-${id}`}>{subtitle}</motion.p>
                </motion.div>
            </motion.div>

            {/* 展開狀態的全螢幕遮罩層 */}
            <AnimatePresence>
                {isOpen && (
                    <div className="expandable-overlay-wrapper">
                        {/* 深色模糊背景 */}
                        <motion.div
                            className="expandable-overlay-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* 展開的大卡片 */}
                        <motion.div
                            layoutId={`card-container-${id}`}
                            className="expandable-card-large glass-panel"
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        >
                            <div className="card-large-inner">
                                <motion.div layoutId={`card-image-container-${id}`} className="card-image-large-wrapper">
                                    <motion.img layoutId={`card-image-${id}`} src={image} alt={title} />
                                </motion.div>

                                <motion.div layoutId={`card-content-${id}`} className="card-content-large">
                                    <motion.h3 layoutId={`card-title-${id}`}>{title}</motion.h3>
                                    <motion.p layoutId={`card-subtitle-${id}`}>{subtitle}</motion.p>

                                    {/* 展開後才出現的詳細內文 */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ delay: 0.1 }}
                                        className="card-details"
                                    >
                                        <p>{content}</p>
                                        <div className="btns-wrapper">
                                            <button className="btn-blue" onClick={() => setIsOpen(false)}>加入購物車</button>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* 關閉按鈕 */}
                                <motion.button
                                    className="close-btn"
                                    onClick={() => setIsOpen(false)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    ✕
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ExpandableCard;
