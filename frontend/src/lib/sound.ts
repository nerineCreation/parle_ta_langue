import { supabase } from './supabase'
import { useStore } from '../store'

let clickUrl: string | null = null

async function loadClickUrl() {
  if (!clickUrl) {
    const { data, error } = await supabase
      .storage
      .from('audios')
      .getPublicUrl('pop entier VF.wav')
    if (!error && data.publicUrl) {
      clickUrl = data.publicUrl
    }
  }
  return clickUrl
}

export async function playClickSound() {
    const { soundEnabled } = useStore.getState()
    if (!soundEnabled) return 

    const url = await loadClickUrl()
  if (url) {
    const audio = new Audio(url)
    audio.play().catch(() => {})
  }
}