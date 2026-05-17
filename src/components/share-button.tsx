"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Share2, MessageCircle, Mail, Copy } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"

interface ShareButtonProps {
  title: string
  text: string
}

const RADIUS = 62
const SIZE = 36

const platforms = [
  {
    name: "WhatsApp",
    icon: MessageCircle,
    color: "#25D366",
    action: (content: string) => {
      window.open(`https://wa.me/?text=${encodeURIComponent(content)}`, "_blank", "noopener")
    },
  },
  {
    name: "Twitter",
    color: "#000",
    action: (content: string) => {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`, "_blank", "noopener")
    },
    svg: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    color: "#1877F2",
    action: (content: string) => {
      window.open(`https://www.facebook.com/sharer.php?quote=${encodeURIComponent(content)}&u=${encodeURIComponent("https://melopoeisis.app")}`, "_blank", "noopener")
    },
    svg: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Email",
    icon: Mail,
    color: "#EA4335",
    action: (content: string, title: string) => {
      window.location.href = `mailto:?subject=${encodeURIComponent(title || "Poema")}&body=${encodeURIComponent(content)}`
    },
  },
  {
    name: "Copiar",
    icon: Copy,
    color: "#6B7280",
    action: async (content: string) => {
      try {
        await navigator.clipboard.writeText(content)
      } catch {
        // fallback
      }
    },
  },
]

export function ShareButton({ title, text }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isOpen])

  const content = title ? `${title}\n\n${text}` : text

  const handleAction = useCallback(
    (i: number) => {
      const p = platforms[i]
      setIsOpen(false)
      if (p.name === "Email") {
        ;(p.action as (content: string, title: string) => void)(content, title)
      } else {
        ;(p.action as (content: string) => void)(content)
      }
    },
    [content, title],
  )

  const total = platforms.length

  return (
    <div ref={wrapperRef} className="share-btn-wrapper">
      <motion.button
        className="share-btn-trigger"
        onClick={() => setIsOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
      >
        <Share2 size={16} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="circle-bg"
            className="share-circle-bg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen &&
          platforms.map((p, i) => {
            const angle = (i / total) * Math.PI * 2 - Math.PI / 2
            const x = Math.cos(angle) * RADIUS
            const y = Math.sin(angle) * RADIUS

            return (
              <motion.button
                key={p.name}
                className="share-item"
                style={{ backgroundColor: p.color, width: SIZE, height: SIZE }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, x, y, rotate: 360 }}
                exit={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.45,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                onClick={() => handleAction(i)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {p.icon ? (
                  <p.icon size={14} color="white" />
                ) : (
                  p.svg
                )}
              </motion.button>
            )
          })}
      </AnimatePresence>
    </div>
  )
}
