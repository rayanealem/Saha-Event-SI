'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function fetchVenues(params?: {
  wilaya?: string
  minCapacity?: number
  maxPrice?: number
}) {
  const supabase = (await createClient()) as any
  let query = supabase.from('venues').select('*, venue_photos(url)').eq('status', 'PUBLISHED')

  if (params?.wilaya) {
    query = query.eq('wilaya', params.wilaya)
  }
  if (params?.minCapacity) {
    query = query.gte('capacity_max', params.minCapacity)
  }
  if (params?.maxPrice) {
    query = query.lte('price_per_day', params.maxPrice)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching venues:', error)
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function getVenueById(id: string) {
  const supabase = (await createClient()) as any
  const { data, error } = await supabase
    .from('venues')
    .select('*, venue_photos(*), profiles(full_name)')
    .eq('id', id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function createVenue(formData: FormData) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Parse amenities
  let amenities: string[] = []
  try {
    amenities = JSON.parse(formData.get('amenities') as string || '[]')
  } catch { amenities = [] }

  const venueData: Record<string, any> = {
    owner_id: user.id,
    name: formData.get('name') as string,
    wilaya: formData.get('wilaya') as string,
    address: formData.get('address') as string,
    description: formData.get('description') as string,
    capacity_max: parseInt(formData.get('capacity_max') as string) || 100,
    price_per_day: parseInt(formData.get('price_per_day') as string) || 100000,
    deposit_percentage: parseInt(formData.get('deposit_percentage') as string) || 25,
    options: amenities,
    status: 'PENDING_APPROVAL',
  }

  // Optional fields
  const areaStr = formData.get('area_m2') as string
  if (areaStr) venueData.area_m2 = parseInt(areaStr)
  const ccpName = formData.get('ccp_name') as string
  if (ccpName) venueData.ccp_name = ccpName
  const ccpNumber = formData.get('ccp_number') as string
  if (ccpNumber) venueData.ccp_number = ccpNumber
  const ccpKey = formData.get('ccp_key') as string
  if (ccpKey) venueData.ccp_key = ccpKey

  const { data, error } = await supabase.from('venues').insert(venueData).select().single()
  
  if (error) {
    return { error: error.message }
  }

  // Upload venue photos (1-5 images)
  const photoFiles = formData.getAll('venue_photos') as File[]
  for (let i = 0; i < photoFiles.length; i++) {
    const photo = photoFiles[i]
    if (!photo || photo.size === 0) continue
    if (photo.size > 5 * 1024 * 1024) continue // skip files > 5MB

    const photoExt = photo.name.split('.').pop()
    const photoName = `venue-${data.id}-${i}-${Date.now()}.${photoExt}`
    const photoPath = `venues/${data.id}/${photoName}`

    const { error: photoUploadError } = await supabase.storage
      .from('public_images')
      .upload(photoPath, photo)

    if (!photoUploadError) {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public_images')
        .getPublicUrl(photoPath)

      if (urlData?.publicUrl) {
        await supabase.from('venue_photos').insert({
          venue_id: data.id,
          url: urlData.publicUrl,
          display_order: i,
        })
      }
    }
  }

  // Upload venue document if provided
  const docFile = formData.get('venue_document') as File
  if (docFile && docFile.size > 0) {
    const fileExt = docFile.name.split('.').pop()
    const fileName = `venue-doc-${data.id}-${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('kyc_documents')
      .upload(filePath, docFile)

    if (!uploadError) {
      // Insert document record linked to venue
      await supabase.from('venue_documents').insert({
        owner_id: user.id,
        venue_id: data.id,
        doc_type: 'REGISTRE',
        url: filePath,
        status: 'PENDING',
      })
    }
  }

  // Notify admins about the new venue submission
  try {
    const adminSupabase = createAdminClient()
    const { data: admins } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
    
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'new_document',
          `Nouvelle salle "${venueData.name}" soumise pour vérification par un propriétaire.`,
          data.id
        )
      }
    }
  } catch (err) {
    console.error('Failed to notify admins (possibly missing SUPABASE_SERVICE_ROLE_KEY):', err)
  }

  revalidatePath('/espace-proprietaire')
  revalidatePath('/parcourir')
  revalidatePath('/admin')
  return { data }
}

export async function getReviewsForVenue(venueId: string) {
  const supabase = (await createClient()) as any
  
  // @ts-ignore - Supabase types can be tricky with inner joins on related tables not explicitly defined in the query
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reservations!inner(venue_id, profiles(full_name))')
    .eq('reservations.venue_id', venueId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return { data: [], error: error.message }
  }
  
  return { data: data || [], error: null }
}
