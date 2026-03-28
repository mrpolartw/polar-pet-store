import React, { createContext, useCallback, useContext, useState } from 'react'
import ToastContainer from '../components/common/Toast/Toast'

const ToastContext = createContext(null)

const MAX_TOASTS = 3
const DEFAULT_DURATION = 3000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((type, message, duration = DEFAULT_DURATION) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => {
      const next = [...prev, { id, type, message }]
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }, [remove])

  const toast = {
    success: (msg, duration) => add('success', msg, duration),
    error:   (msg, duration) => add('error',   msg, duration),
    warning: (msg, duration) => add('warning', msg, duration),
    info:    (msg, duration) => add('info',    msg, duration),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
