import { useEffect, useRef } from 'react'

// A living "circuit board" backdrop: nodes (pads) drift slowly and connect to
// their nearest neighbours with right-angle traces. A soft light follows the
// cursor and brightens nearby nodes/traces. Monochrome + low opacity so it
// stays in the SpaceX-minimal register instead of turning into neon noise.
//
// Cheap by design: ~1 node per 22k px², capped DPR, single rAF loop, and it
// goes fully static when the user prefers reduced motion or the tab is hidden.
export default function CircuitBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let nodes = []
    const pointer = { x: -9999, y: -9999, active: false }
    const LINK_DIST = 150 // px: connect nodes closer than this
    const GLOW = 200 // px: cursor influence radius

    function build() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.min(110, Math.max(28, Math.round((width * height) / 22000)))
      nodes = new Array(target).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        pulse: Math.random() * Math.PI * 2,
      }))
    }

    // Right-angle "trace" between two points (horizontal then vertical),
    // so links read like circuit routing rather than a spider web.
    function trace(a, b, alpha) {
      const midX = b.x
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(midX, a.y)
      ctx.lineTo(midX, b.y)
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`
      ctx.stroke()
    }

    function frame() {
      ctx.clearRect(0, 0, width, height)
      ctx.lineWidth = 1

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (!reduce) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0 || n.x > width) n.vx *= -1
          if (n.y < 0 || n.y > height) n.vy *= -1
          n.pulse += 0.02
        }

        // distance to pointer -> proximity 0..1
        const pdx = n.x - pointer.x
        const pdy = n.y - pointer.y
        const pd = Math.hypot(pdx, pdy)
        const near = pointer.active ? Math.max(0, 1 - pd / GLOW) : 0

        // links to a few nearest neighbours
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j]
          const d = Math.hypot(n.x - m.x, n.y - m.y)
          if (d < LINK_DIST) {
            const base = (1 - d / LINK_DIST) * 0.06
            const boost = near * 0.16
            trace(n, m, Math.min(0.28, base + boost))
          }
        }

        // trace from cursor to nearby nodes
        if (near > 0.02) {
          trace({ x: pointer.x, y: pointer.y }, n, near * 0.22)
        }

        // the node pad
        const breathe = reduce ? 0 : Math.sin(n.pulse) * 0.15
        const a = Math.min(0.9, 0.14 + near * 0.7 + breathe)
        const s = 1.4 + near * 2.2
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.fillRect(n.x - s / 2, n.y - s / 2, s, s)
      }

      // soft cursor light
      if (pointer.active) {
        const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, GLOW)
        g.addColorStop(0, 'rgba(255,255,255,0.05)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(pointer.x - GLOW, pointer.y - GLOW, GLOW * 2, GLOW * 2)
      }

      raf = requestAnimationFrame(frame)
    }

    function onMove(e) {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }
    function onLeave() {
      pointer.active = false
      pointer.x = -9999
      pointer.y = -9999
    }
    function onResize() {
      build()
    }
    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf)
      else raf = requestAnimationFrame(frame)
    }

    let raf
    build()
    raf = requestAnimationFrame(frame)
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseout', onLeave, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onLeave)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  )
}
