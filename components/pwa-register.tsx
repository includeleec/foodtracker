'use client'

import { useEffect } from 'react'

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.protocol === 'https:'
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })

          console.log('PWA: Service Worker registered successfully:', registration)

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  console.log('PWA: New content available, please refresh.')
                  
                  // You could show a notification here
                  if (window.confirm('发现新版本，是否立即更新？')) {
                    window.location.reload()
                  }
                }
              })
            }
          })

          // Handle service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('PWA: Message from service worker:', event.data)
          })

        } catch (error) {
          console.error('PWA: Service Worker registration failed:', error)
        }
      }

      // Register service worker
      registerSW()

      // Handle app install prompt
      let deferredPrompt: any
      
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: Install prompt triggered')
        e.preventDefault()
        deferredPrompt = e
        
        // You could show a custom install button here
        showInstallPrompt(deferredPrompt)
      })

      window.addEventListener('appinstalled', () => {
        console.log('PWA: App was installed')
        deferredPrompt = null
      })

      // Handle online/offline status
      const handleOnline = () => {
        console.log('PWA: Back online')
        // You could show a notification or sync data here
      }

      const handleOffline = () => {
        console.log('PWA: Gone offline')
        // You could show an offline indicator here
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return null
}

function showInstallPrompt(deferredPrompt: any) {
  // Create a simple install prompt
  const installContainer = document.createElement('div')
  installContainer.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    ">
      <span>📱 安装应用到主屏幕</span>
      <button id="install-btn" style="
        background: white;
        color: #2563eb;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      ">安装</button>
      <button id="dismiss-btn" style="
        background: transparent;
        color: white;
        border: none;
        padding: 6px;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    </div>
  `

  document.body.appendChild(installContainer)

  const installBtn = installContainer.querySelector('#install-btn')
  const dismissBtn = installContainer.querySelector('#dismiss-btn')

  installBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('PWA: Install prompt outcome:', outcome)
      deferredPrompt = null
    }
    document.body.removeChild(installContainer)
  })

  dismissBtn?.addEventListener('click', () => {
    document.body.removeChild(installContainer)
  })

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.body.contains(installContainer)) {
      document.body.removeChild(installContainer)
    }
  }, 10000)
}