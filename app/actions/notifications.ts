'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Paginated fetch for the /notifications page ──
export async function getNotificationsPaginated(
  page: number = 1,
  limit: number = 20,
  filter: 'all' | 'unread' | 'read' = 'all'
) {
  const supabase = (await createClient()) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, total: 0, error: 'Unauthorized' }

  // Count total
  let countQuery = supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (filter === 'unread') countQuery = countQuery.eq('is_read', false)
  if (filter === 'read') countQuery = countQuery.eq('is_read', true)

  const { count } = await countQuery

  // Fetch page
  const offset = (page - 1) * limit
  let dataQuery = supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at, link')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filter === 'unread') dataQuery = dataQuery.eq('is_read', false)
  if (filter === 'read') dataQuery = dataQuery.eq('is_read', true)

  const { data, error } = await dataQuery

  return { data, total: count || 0, error: error?.message }
}

// ── Quick fetch for dropdown (limited) ──
export async function getNotifications() {
  const supabase = (await createClient()) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at, link')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return { data, error: error?.message }
}

// ── Mark single notification as read ──
export async function markAsRead(notificationId: string) {
  const supabase = (await createClient()) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ── Mark all as read ──
export async function markAllAsRead() {
  const supabase = (await createClient()) as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  revalidatePath('/notifications')
  return { success: true }
}

// Type-to-label mapping for notification titles
const NOTIFICATION_TITLES: Record<string, string> = {
  booking_request: 'Nouvelle réservation',
  booking_confirmed: 'Réservation confirmée',
  booking_refused: 'Réservation refusée',
  booking_cancelled: 'Réservation annulée',
  account_approved: 'Compte approuvé',
  account_refused: 'Compte refusé',
  new_document: 'Nouveau document',
}

// Internal function to create a notification
export async function createNotification(
  userId: string,
  type: string,
  message: string,
  relatedId?: string
) {
  try {
    const adminSupabase = createAdminClient()

    const title = NOTIFICATION_TITLES[type] || 'Notification'

    const { error } = await adminSupabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
      })

    if (error) {
      console.error('Failed to create notification:', error)
    }
  } catch (err) {
    console.error('Failed to create notification (possibly missing SUPABASE_SERVICE_ROLE_KEY):', err)
  }
}
