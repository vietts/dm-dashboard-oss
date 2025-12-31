'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'

interface ImageLightboxProps {
  src: string | null
  alt: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageLightbox({ src, alt, open, onOpenChange }: ImageLightboxProps) {
  if (!src) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/90 border-none">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={800}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ClickableImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

export function ClickableImage({ src, alt, className = '', width = 200, height = 200 }: ClickableImageProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={() => setOpen(true)}
      />
      <ImageLightbox src={src} alt={alt} open={open} onOpenChange={setOpen} />
    </>
  )
}
