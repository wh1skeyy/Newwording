import { useEffect, useState } from 'react'

export interface ToastItem {
  id: string
  message: string
  type?: 'success' | 'error' | 'info'
}

let toastListeners: ((toasts: ToastItem[]) => void)[] = []
let toastList: ToastItem[] = []

export function showToast(message: string, type: ToastItem['type'] = 'info') {
  const id = Math.random().toString(36).slice(2)
  toastList = [...toastList, { id, message, type }]
  toastListeners.forEach(l => l(toastList))
  setTimeout(() => {
    toastList = toastList.filter(t => t.id !== id)
    toastListeners.forEach(l => l(toastList))
  }, 3000)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts)
    }
  }, [])

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-slide-in-right"
          style={{
            background: '#272a2c',
            border: '1px solid #464554',
            borderRadius: 8,
            padding: '12px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.05em',
            color: toast.type === 'error' ? '#ffb4ab' : toast.type === 'success' ? '#4edea3' : '#e0e3e5',
            maxWidth: 320,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
