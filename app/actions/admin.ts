'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function getPendingKYCProfiles() {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Unauthorized' }

  // Check if admin
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = data as any
  if (profile?.role !== 'ADMIN') return { data: [], error: 'Forbidden' }

  const { data: profilesData, error } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, role, kyc_status, created_at')
    .eq('kyc_status', 'PENDING')
    .order('created_at', { ascending: true })

  return { data: profilesData || [], error: error?.message }
}

export async function updateKYCStatus(profileId: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = data as any
  if (profile?.role !== 'ADMIN') return { error: 'Forbidden' }

  const updatePayload: any = { kyc_status: status }
  if (reason && status === 'REJECTED') {
    updatePayload.kyc_rejection_reason = reason
  }

  const { error } = await (supabase as any)
    .from('profiles')
    .update(updatePayload)
    .eq('id', profileId)

  if (error) return { error: error.message }

  // Notify the user
  if (status === 'APPROVED') {
    await createNotification(
      profileId,
      'account_approved',
      'Félicitations, votre compte propriétaire a été approuvé ! Vous pouvez maintenant publier vos salles.'
    )
  } else if (status === 'REJECTED') {
    await createNotification(
      profileId,
      'account_refused',
      `Votre demande de vérification a été refusée. ${reason ? `Motif: ${reason}` : ''}`
    )
  }

  revalidatePath('/admin')
  return { success: true }
}
