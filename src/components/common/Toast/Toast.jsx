import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import './Toast.css'

const ICONS = {
  success: <CheckCircle2 size={18} className="toast__icon" />,
  error:   <XCircle     size={18} className="toast__icon" />,
  warning: <AlertTriangle size={18} className="toast__icon" />,
  info:    <Info        size={18} className="toast__icon" />,
}

function ToastItem({ id, type = 'info', message, onClose }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -8,  scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`toast toast--${type}`}
      role="alert"
      aria-live="polite"
    >
      {ICONS[type]}
      <div className="toast__body">
        <p className="toast__message">{message}</p>
      </div>
      <button
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="關閉通知"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export default function ToastContainer({ toasts, onClose }) {
  return (
    <div className="toast-container" aria-label="通知區域">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}
