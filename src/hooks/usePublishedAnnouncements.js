import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export function usePublishedAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAnnouncements = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAnnouncements([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, image_url, image_aspect_ratio, action_label, action_url, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Unable to load published announcements:', error)
      setAnnouncements([])
    } else {
      setAnnouncements(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  return { announcements, loading, retry: loadAnnouncements }
}
