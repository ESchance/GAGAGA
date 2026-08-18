import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// 在轨人数：用 Supabase Realtime Presence 统计当前已登录成员的在线状态。
// 未登录或 presence 不可用时返回 null（UI 隐藏该信号），不编造人数。
export function useOnlinePresence() {
  const [onlineCount, setOnlineCount] = useState(null)

  useEffect(() => {
    let mounted = true
    let channel = null

    const track = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId || !mounted) return // 仅统计已登录成员

        channel = supabase.channel('online-presence', {
          config: { presence: { key: userId } }
        })

        channel
          .on('presence', { event: 'sync' }, () => {
            if (mounted) setOnlineCount(Object.keys(channel.presenceState()).length)
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED' && mounted) {
              const n = Object.keys(channel.presenceState()).length
              setOnlineCount(n > 0 ? n : 1)
            }
          })
      } catch (error) {
        console.warn('在线状态不可用:', error)
      }
    }

    track()

    return () => {
      mounted = false
      if (channel) {
        try { channel.unsubscribe() } catch {}
        try { supabase.removeChannel(channel) } catch {}
      }
    }
  }, [])

  return onlineCount
}
