'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadCCPReceipt(reservationId: string, formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${reservationId}-${Math.random()}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('ccp_receipts')
    .upload(filePath, file)

  if (uploadError) return { error: uploadError.message }

  // Get public URL or internal path
  const { data: { publicUrl } } = supabase.storage.from('ccp_receipts').getPublicUrl(filePath)
  // Since ccp_receipts is private, publicUrl won't work perfectly if accessed without auth, 
  // but we can store the filePath and generate signed URLs when reading, or just use filePath.
  // For simplicity here, we'll store the raw path and use createSignedUrl when fetching.

  const { error: updateError } = await supabase
    .from('reservations')
    .update({ ccp_receipt_url: filePath })
    .eq('id', reservationId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/espace-client')
  return { success: true }
}

export async function uploadKYCDocument(docType: string, formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${docType}-${Math.random()}.${fileExt}`
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

  revalidatePath('/verification')
  return { success: true }
}
