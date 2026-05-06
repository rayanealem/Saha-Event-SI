'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
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

  // Map APPROVED to VERIFIED for the kyc_status enum
  const dbStatus = status === 'APPROVED' ? 'VERIFIED' : 'REJECTED'
  const updatePayload: any = { kyc_status: dbStatus }
  if (reason && status === 'REJECTED') {
    updatePayload.kyc_rejection_reason = reason
  }

  try {
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profileId)

    if (error) return { error: error.message }
  } catch (err: any) {
    return { error: err.message || 'Failed to initialize admin client' }
  }

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

export async function updateVenueStatus(venueId: string, status: 'PUBLISHED' | 'REJECTED', reason?: string) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((adminProfile as any)?.role !== 'ADMIN') return { error: 'Forbidden' }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('venues')
    .update({ status })
    .eq('id', venueId)

  if (error) return { error: error.message }

  // Get the venue to notify its owner (use admin client to bypass RLS)
  const { data: venue } = await adminSupabase
    .from('venues')
    .select('name, owner_id')
    .eq('id', venueId)
    .single()

  if (venue) {
    if (status === 'PUBLISHED') {
      await createNotification(
        (venue as any).owner_id,
        'account_approved',
        `Votre salle "${(venue as any).name}" a été approuvée et est maintenant visible sur la plateforme.`,
        venueId
      )
    } else if (status === 'REJECTED') {
      await createNotification(
        (venue as any).owner_id,
        'account_refused',
        `Votre salle "${(venue as any).name}" a été rejetée. ${reason ? `Motif: ${reason}` : ''}`,
        venueId
      )
    }
  }

  // Also update venue documents status
  if (status === 'PUBLISHED') {
    await adminSupabase
      .from('venue_documents')
      .update({ status: 'APPROVED' })
      .eq('venue_id', venueId)
  } else if (status === 'REJECTED') {
    await adminSupabase
      .from('venue_documents')
      .update({ status: 'REJECTED', note: reason || null })
      .eq('venue_id', venueId)
  }

  revalidatePath('/admin')
  revalidatePath('/espace-proprietaire')
  revalidatePath('/parcourir')
  revalidatePath(`/salle/${venueId}`)
  return { success: true }
}

export async function getVenueDocuments(venueId: string) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Unauthorized' }

  // Check if admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'ADMIN') return { data: [], error: 'Forbidden' }

  const { data, error } = await supabase
    .from('venue_documents')
    .select('id, doc_type, url, status, created_at')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false })

  return { data: data || [], error: error?.message }
}

export async function getSignedDocumentUrl(filePath: string, bucket: string = 'kyc_documents') {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Unauthorized' }

  // Verify the caller is an admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'ADMIN') return { url: null, error: 'Forbidden' }

  // Admin RLS policy allows reading all files in kyc_documents/ccp_receipts
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 300) // 5 minute expiry

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl, error: null }
}
