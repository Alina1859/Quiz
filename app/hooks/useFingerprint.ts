import { useState, useEffect } from 'react'

interface FingerprintData {
  visitorId: string
  components: any
  userAgent: string
  language: string
  platform: string
  hardwareConcurrency: number
  screen: string
  timezone: string
  gpuVendor: string | null
  gpuRenderer: string | null
  timestamp: string
}

export function useFingerprint(enabled: boolean = true) {
  const [fingerprintData, setFingerprintData] = useState<FingerprintData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    setIsLoading(true)
    setError(null)

    async function getDeviceInfoFullyHashed() {
      try {
        const loadFingerprint = () => {
          if ((window as any).__fingerprintjsLoaded) {
            return (window as any).__fingerprintjsLoaded
          }

          const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.type = 'module'
            script.textContent = `
              import FingerprintJS from 'https://openfpcdn.io/fingerprintjs/v5';
              window.__fingerprintjsModule = FingerprintJS;
              window.__fingerprintjsReady = true;
            `
            script.onerror = () => {
              reject(new Error('Failed to load FingerprintJS'))
            }

            const checkReady = () => {
              if ((window as any).__fingerprintjsReady && (window as any).__fingerprintjsModule) {
                resolve((window as any).__fingerprintjsModule)
              } else {
                setTimeout(checkReady, 50)
              }
            }

            document.head.appendChild(script)
            checkReady()
          })

          ;(window as any).__fingerprintjsLoaded = promise
          return promise
        }

        const FingerprintJS = await loadFingerprint()
        const fp = await (FingerprintJS as any).load()
        const result = await fp.get()
        console.log(result)

        const canvas = document.createElement('canvas')
        const gl =
          (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
          (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

        const rawData: FingerprintData = {
          visitorId: result.visitorId,
          components: result.components,
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency,
          screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          gpuVendor: gl
            ? gl.getExtension('WEBGL_debug_renderer_info')
              ? gl.getParameter(
                  gl.getExtension('WEBGL_debug_renderer_info')!.UNMASKED_VENDOR_WEBGL
                )
              : gl.getParameter(gl.VENDOR)
            : null,
          gpuRenderer: gl
            ? gl.getExtension('WEBGL_debug_renderer_info')
              ? gl.getParameter(
                  gl.getExtension('WEBGL_debug_renderer_info')!.UNMASKED_RENDERER_WEBGL
                )
              : gl.getParameter(gl.RENDERER)
            : null,
          timestamp: new Date().toISOString(),
        }

        return rawData
      } catch (error: any) {
        throw new Error(`Ошибка: ${error.message}`)
      }
    }

    getDeviceInfoFullyHashed()
      .then((data) => {
        console.log('Данные устройства:', data)
        setFingerprintData(data)
        setIsLoading(false)
      })
      .catch((error: any) => {
        console.error('Error getting fingerprint:', error)
        setError(error)
        setIsLoading(false)
      })
  }, [enabled])

  return { fingerprintData, isLoading, error }
}

