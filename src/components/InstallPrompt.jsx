import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt({ manualTrigger = false, onClose = null }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(manualTrigger)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (manualTrigger && deferredPrompt) {
      setShowPrompt(true)
    }
  }, [manualTrigger, deferredPrompt])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setShowPrompt(false)
    onClose?.()
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    onClose?.()
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full bg-white rounded-t-2xl p-4 space-y-3 animate-in slide-in-from-bottom">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">Instalar Nuestro Hogar</h3>
              <p className="text-sm text-gray-600">Accede rápidamente desde tu dispositivo</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Ahora no
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
