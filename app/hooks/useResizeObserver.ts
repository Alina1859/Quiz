'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type ResizeObserverBox =
  | 'border-box'
  | 'content-box'
  | 'device-pixel-content-box'

interface Size {
  width: number
  height: number
}

interface Options {
  box?: ResizeObserverBox
  onResize?: (size: Size, entry: ResizeObserverEntry) => void
}

const defaultSize: Size = { width: 0, height: 0 }

export default function useResizeObserver<T extends HTMLElement>({
  box,
  onResize,
}: Options = {}) {
  const [node, setNode] = useState<T | null>(null)
  const [size, setSize] = useState<Size>(defaultSize)

  const ref = useCallback((nextNode: T | null) => {
    setNode(nextNode)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return
    }

    if (!node) {
      return
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== node) {
          continue
        }

        const { width, height } = entry.contentRect

        setSize((prev) => {
          if (prev.width === width && prev.height === height) {
            return prev
          }

          return { width, height }
        })

        if (onResize) {
          onResize({ width, height }, entry)
        }
      }
    })

    observer.observe(node, box ? { box } : undefined)

    return () => {
      observer.disconnect()
    }
  }, [box, node, onResize])

  return useMemo(
    () => ({
      ref,
      width: size.width,
      height: size.height,
    }),
    [ref, size.height, size.width],
  )
}

