import React, { useState, useEffect } from 'react'
import { motion, useSpring } from 'framer-motion'
import './CustomCursor.css'

const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false)

  // ✅ 移除未使用的 position state
  const springConfig = { damping: 20, stiffness: 400, mass: 0.1 }
  const cursorX = useSpring(0, springConfig)
  const cursorY = useSpring(0, springConfig)

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 14) // 14 = 28px 圖示的一半，置中對齊
      cursorY.set(e.clientY - 14)
    }

    const handleMouseOver = (e) => {
      const isInteractive =
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.closest('button') ||
        e.target.closest('a') ||
        e.target.closest('.expandable-card-small') ||
        e.target.closest('.close-btn') ||
        e.target.classList.contains('clickable')
      setIsHovering(!!isInteractive)
    }

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseover', handleMouseOver)
    document.body.style.cursor = 'none'

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', handleMouseOver)
      document.body.style.cursor = 'auto'
    }
  }, [cursorX, cursorY])

  return (
    <motion.div className="cursor-wrapper" style={{ x: cursorX, y: cursorY }}>
      <div className={`cursor-paw${isHovering ? ' hover' : ''}`}>
        <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="9.5" r="2.5"/>
          <circle cx="12" cy="7" r="2.5"/>
          <circle cx="17" cy="9.5" r="2.5"/>
          <path d="M18.72 14.86c-.5-.95-1.52-1.63-2.61-1.74-1.28-.13-2.52.47-3.41 1.25-.19.16-.48.16-.67 0-.88-.78-2.13-1.38-3.41-1.25-1.09.11-2.11.79-2.61 1.74-.61 1.15-.4 2.68.49 3.65C7.45 19.56 8.94 20 10.5 20h3c1.56 0 3.05-.44 4.01-1.49.89-.97 1.1-2.5.49-3.65z"/>
        </svg>
      </div>
    </motion.div>
  )
}

export default CustomCursor
