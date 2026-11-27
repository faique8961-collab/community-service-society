
import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

function mapActivity(row) {
  const images = [
    row.cover_image_url,
    ...(Array.isArray(row.gallery_urls) ? row.gallery_urls : []),
  ].filter(Boolean)

  return {
    id: row.slug,
    databaseId: row.id,
    title: row.title,
    date: row.date_label || row.event_date || '',
    location: row.location || '',
    summary: row.summary || '',
    description: row.description || row.summary || '',
    images: [...new Set(images)],
    coverImageAspectRatio: row.cover_image_aspect_ratio || '4:3',
    imageSettings: row.gallery_image_settings && typeof row.gallery_image_settings === 'object' ? row.gallery_image_settings : {},
  }
}

export function usePublishedEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadEvents = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setEvents([])
      setError('The website database is not configured. Please check the Supabase environment settings.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data, error: queryError } = await supabase
      .from('events')
      .select('id, title, slug, summary, description, date_label, event_date, location, cover_image_url, cover_image_aspect_ratio, gallery_urls, gallery_image_settings')
      .eq('status', 'published')
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (queryError) {
      setEvents([])
      setError('We could not load the activities right now. Please try again.')
      console.error('Unable to load published activities:', queryError)
    } else {
      setEvents((data || []).map(mapActivity))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return { events, loading, error, retry: loadEvents }
}
