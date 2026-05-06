'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function uploadCCPReceipt(reservationId: string, formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Type de fichier non autorisé. Veuillez soumettre un PDF, JPEG ou PNG.' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Le fichier ne doit pas dépasser 5 Mo.' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${reservationId}-${Date.now()}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('ccp_receipts')
    .upload(filePath, file)

  if (uploadError) return { error: uploadError.message }

  const { error: updateError } = await supabase
    .from('reservations')
    .update({ ccp_receipt_url: filePath })
    .eq('id', reservationId)

  if (updateError) return { error: updateError.message }

  // Notify venue owner about the receipt upload
  const { data: reservation } = await supabase
    .from('reservations')
    .select('venue_id, start_date, venues(name, owner_id)')
    .eq('id', reservationId)
    .single()

  if (reservation) {
    const res = reservation as any
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const clientName = (clientProfile as any)?.full_name || 'Un client'
    const venueName = res.venues?.name || 'la salle'

    if (res.venues?.owner_id) {
      await createNotification(
        res.venues.owner_id,
        'new_document',
        `${clientName} a soumis son reçu CCP pour "${venueName}". Veuillez vérifier le paiement.`,
        reservationId
      )
    }
  }

  revalidatePath('/espace-client')
  revalidatePath('/espace-proprietaire')
  return { success: true }
}

export async function uploadKYCDocument(docType: string, formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${docType}-${Date.now()}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('kyc_documents')
    .upload(filePath, file)

  if (uploadError) return { error: uploadError.message }

  const { error: insertError } = await supabase
    .from('venue_documents')
    .insert({
      owner_id: user.id,
      doc_type: docType as any,
      url: filePath,
      status: 'PENDING'
    })

  if (insertError) return { error: insertError.message }

  // Update profile status
  await supabase.from('profiles').update({ kyc_status: 'PENDING' }).eq('id', user.id)

  // Notify admins about the new KYC document
  try {
    const adminSupabase = createAdminClient()
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const ownerName = (ownerProfile as any)?.full_name || 'Un propriétaire'

    const { data: admins } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')

    if (admins && admins.length > 0) {
      for (const admin of admins as any[]) {
        await createNotification(
          admin.id,
          'new_document',
          `${ownerName} a soumis un document KYC (${docType}). Vérification requise.`
        )
      }
    }
  } catch (err) {
    console.error('Failed to notify admins about KYC upload:', err)
  }

  revalidatePath('/verification')
  revalidatePath('/admin')
  return { success: true }
}

export async function getSignedReceiptUrl(filePath: string) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Unauthorized' }

  const { data, error } = await supabase.storage
    .from('ccp_receipts')
    .createSignedUrl(filePath, 300) // 5 minute expiry

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl, error: null }
}

export async function getOwnerDocuments() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('venue_documents')
    .select('*, venues(name)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: data || [], error: null }
}

export async function getSignedKYCUrl(filePath: string) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Unauthorized' }

  const { data, error } = await supabase.storage
    .from('kyc_documents')
    .createSignedUrl(filePath, 300) // 5 minute expiry

  if (error) return { url: null, error: error.message }
  return { url: data.signedUrl, error: null }
}
