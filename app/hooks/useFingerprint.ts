import { useState, useEffect } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

interface FingerprintData {
  visitorId: string
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
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        console.log(result)

        const canvas = document.createElement('canvas')
        const gl =
          (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
          (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

        const rawData: FingerprintData = {
          visitorId: result.visitorId,
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency,
          screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          gpuVendor: gl
            ? gl.getExtension('WEBGL_debug_renderer_info')
              ? gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')!.UNMASKED_VENDOR_WEBGL)
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
