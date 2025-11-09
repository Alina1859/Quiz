import { useEffect, useState } from 'react'
export interface DeviceType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  useEffect(() => {
    const getDeviceType = (): DeviceType => {
      if (typeof window === 'undefined') {
        return {
          isMobile: false,
          isTablet: false,
          isDesktop: true,
        }
      }

      const width = window.innerWidth

      return {
        isMobile: width < 600,
        isTablet: width >= 600 && width < 1200,
        isDesktop: width >= 1200,
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeviceType(getDeviceType())

    const handleResize = () => {
      setDeviceType(getDeviceType())
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return deviceType
}
