interface FingerprintData {
  [key: string]: any
  components?: {
    [key: string]: {
      value?: any
    }
  }
  timestamp?: string
}

export function getFingerprintFieldValue(
  fingerprint: FingerprintData,
  fieldName: string
): any {
  if (fingerprint[fieldName] !== undefined) {
    return fingerprint[fieldName]
  }

  const components = fingerprint.components || {}

  switch (fieldName) {
    case 'gpuRenderer':
      return (
        components.gpu?.value?.renderer ||
        components.gpuRenderer?.value ||
        null
      )
    case 'gpuVendor':
      return (
        components.gpu?.value?.vendor ||
        components.gpuVendor?.value ||
        null
      )
    case 'hardwareConcurrency':
      return components.hardwareConcurrency?.value || null
    case 'language':
      const langs = components.languages?.value
      return Array.isArray(langs)
        ? langs.join(', ')
        : langs || components.language?.value || null
    case 'platform':
      return components.platform?.value || null
    case 'screen':
      const screenRes = components.screenResolution?.value
      if (
        screenRes &&
        typeof screenRes === 'object' &&
        'width' in screenRes &&
        'height' in screenRes
      ) {
        return `${screenRes.width}x${screenRes.height}`
      }
      return screenRes || components.screen?.value || null
    case 'timezone':
      return components.timezone?.value || null
    case 'timestamp':
      return fingerprint.timestamp || null
    case 'userAgent':
      return components.userAgent?.value || null
    default:
      return components[fieldName]?.value || null
  }
}

export function formatFingerprintTimestamp(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return String(timestamp)
  }
}

