// Get the finished PDF to a parent or teacher — on every platform the app runs on, offline.
//   Android/iOS app (Capacitor): save to the app's cache, then the native share sheet
//                                (Gmail, Messenger, Drive, Files, Print…)
//   Browser: Web Share with a file where supported (most Android Chrome), else a normal download
import { Capacitor } from '@capacitor/core'

export type Delivery = 'shared' | 'downloaded' | 'cancelled'

const toB64 = (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s) }

export async function deliverPdf(bytes: Uint8Array, filename: string, title: string): Promise<Delivery> {
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')])
    const { uri } = await Filesystem.writeFile({ path: filename, data: toB64(bytes), directory: Directory.Cache, recursive: true })
    try {
      await Share.share({ title, text: title, files: [uri], dialogTitle: 'Ibahagi ang Assessment Report' })
      return 'shared'
    } catch (e) {
      // the user closed the share sheet — not an error
      if (/cancel/i.test(String((e as Error)?.message ?? e))) return 'cancelled'
      throw e
    }
  }

  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const file = new File([blob], filename, { type: 'application/pdf' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled'
      // fall through to a download if sharing isn't allowed here
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
  return 'downloaded'
}
