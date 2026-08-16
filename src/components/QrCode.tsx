import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: '#0c1e4d', light: '#ffffff' } }).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!dataUrl) {
    return <div className="bg-slate-100 animate-pulse rounded-lg" style={{ width: size, height: size }} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="Código QR del permiso" width={size} height={size} className="rounded-lg border border-slate-200" />
}
