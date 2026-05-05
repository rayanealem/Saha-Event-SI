'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
  return { success: true }
}

// Type-to-label mapping for notification titles
const NOTIFICATION_TITLES: Record<string, string> = {
  booking_request: 'Nouvelle réservation',
  booking_confirmed: 'Réservation confirmée',
  booking_refused: 'Réservation refusée',
  account_approved: 'Compte approuvé',
  account_refused: 'Compte refusé',
  new_document: 'Nouveau document',
  BOOKING_CONFIRMED: 'Réservation confirmée',
  BOOKING_CANCELLED: 'Réservation annulée',
  NEW_BOOKING: 'Nouvelle réservation',
  RECEIPT_UPLOADED: 'Reçu soumis',
}

// Internal function to create a notification
export async function createNotification(
  userId: string, 
  type: string, 
  message: string, 
  relatedId?: string
) {
  const supabase = (await createClient()) as any
  
  const title = NOTIFICATION_TITLES[type] || 'Notification'

  const { error } = await supabase
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
}
