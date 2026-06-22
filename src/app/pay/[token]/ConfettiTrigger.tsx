'use client'
import { useEffect } from 'react'

export function ConfettiTrigger() {
  useEffect(() => {
    import('canvas-confetti').then(m => m.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } }))
  }, [])
  return null
}
