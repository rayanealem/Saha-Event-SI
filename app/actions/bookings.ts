'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function createBooking(data: {
  venue_id: string
  start_date: string
  end_date: string
  total_price: number
  deposit_amount: number
  client_message?: string
}) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check availability
  const supabaseAny = supabase as any;
  const { data: existingBookings, error: fetchError } = await supabaseAny
    .from('reservations')
    .select('id')
    .eq('venue_id', data.venue_id)
    .in('status', ['CONFIRMED', 'PENDING', 'BLOCKED'])
    .lte('start_date', data.end_date)
    .gte('end_date', data.start_date)

  if (fetchError) return { error: fetchError.message }
  if (existingBookings && existingBookings.length > 0) {
    return { error: 'These dates are no longer available.' }
  }

  // Generate Reference Code
  const refCode = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const payload: any = {
    ...data,
    client_id: user.id,
    reference_code: refCode,
    status: 'PENDING',
  };

  const { data: reservation, error } = await supabaseAny
    .from('reservations')
    .insert(payload)
    .select('id, reference_code, status')
    .single()

  if (error) return { error: error.message }

  // Send notification to venue owner
  const { data: venue } = await supabase
    .from('venues')
    .select('owner_id, name')
    .eq('id', data.venue_id)
    .single()

  if (venue) {
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const clientName = (clientProfile as any)?.full_name || 'Un client'
    const formattedDate = new Date(data.start_date + 'T00:00:00').toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    await createNotification(
      (venue as any).owner_id,
      'booking_request',
      `${clientName} a réservé "${(venue as any).name}" pour le ${formattedDate}. Montant: ${data.total_price.toLocaleString('fr-DZ')} DA.`,
      reservation.id
    )

    // Also notify all admins about new platform bookings
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'ADMIN')
    
    if (admins && admins.length > 0) {
      for (const admin of admins as any[]) {
        await createNotification(
          admin.id,
          'booking_request',
          `Nouvelle commande : ${clientName} → "${(venue as any).name}" le ${formattedDate}. Montant: ${data.total_price.toLocaleString('fr-DZ')} DA.`,
          reservation.id
        )
      }
    }
  }

  revalidatePath('/espace-client')
  revalidatePath('/espace-proprietaire')
  revalidatePath('/admin')
  return { data: reservation }
}

export async function updateBookingStatus(id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RECEIPT_INVALID', reason?: string) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const updatePayload: any = { status }
  if (reason) {
    updatePayload.refusal_reason = reason
  }

  const supabaseAny = supabase as any;
  const { error } = await supabaseAny
    .from('reservations')
    .update(updatePayload)
    .eq('id', id)

  if (error) return { error: error.message }

  // Get reservation details for notification
  const { data: reservation } = await supabase
    .from('reservations')
    .select('client_id, venue_id, start_date, venues(name)')
    .eq('id', id)
    .single()

  if (reservation) {
    const res = reservation as any
    const venueName = res.venues?.name || 'la salle'
    const formattedDate = new Date(res.start_date + 'T00:00:00').toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    if (status === 'CONFIRMED') {
      await createNotification(
        res.client_id,
        'booking_confirmed',
        `Votre réservation pour "${venueName}" le ${formattedDate} a été confirmée !`,
        id
      )
    } else if (status === 'CANCELLED') {
      await createNotification(
        res.client_id,
        'booking_refused',
        `Votre réservation pour "${venueName}" le ${formattedDate} a été refusée. ${reason ? `Motif: ${reason}` : ''}`,
        id
      )
    } else if (status === 'RECEIPT_INVALID') {
      await createNotification(
        res.client_id,
        'booking_refused',
        `Le reçu CCP pour "${venueName}" le ${formattedDate} a été jugé invalide. Veuillez soumettre un nouveau reçu.`,
        id
      )
    }
  }

  revalidatePath('/espace-proprietaire')
  revalidatePath('/espace-client')
  return { success: true }
}

export async function getClientBookings() {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const supabaseAny = supabase as any;
  const { data, error } = await supabaseAny
    .from('reservations')
    .select('id, reference_code, start_date, end_date, total_price, deposit_amount, status, created_at, venues(name, wilaya)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error: error?.message }
}

export async function getOwnerBookings() {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data: venuesData } = await supabase.from('venues').select('id').eq('owner_id', user.id)
  const venues = venuesData as any;
  const venueIds = venues?.map((v: any) => v.id) || []

  if (venueIds.length === 0) return { data: [], error: null }

  const supabaseAny = supabase as any;
  const { data, error } = await supabaseAny
    .from('reservations')
    .select('id, reference_code, venue_id, start_date, end_date, total_price, deposit_amount, status, created_at, ccp_receipt_url, client_message, refusal_reason, profiles:client_id(full_name, phone), venues:venue_id(name)')
    .in('venue_id', venueIds)
    .order('created_at', { ascending: false })

  // Flatten the joined data for easier consumption
  const normalized = (data || []).map((r: any) => ({
    ...r,
    client_name: r.profiles?.full_name || 'Client',
    client_phone: r.profiles?.phone || '',
    venue_name: r.venues?.name || 'Salle',
    date: r.start_date,
    total: r.total_price || 0,
  }));

  return { data: normalized, error: error?.message }
}

export async function toggleBlockedDate(venue_id: string, date: string) {
  const supabase = (await createClient()) as any
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAny = supabase as any;
  const { data: existing } = await supabaseAny
    .from('reservations')
    .select('id')
    .eq('venue_id', venue_id)
    .eq('start_date', date)
    .eq('end_date', date)
    .eq('status', 'BLOCKED')
    .single()

  if (existing) {
    const { error } = await supabaseAny.from('reservations').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    
    revalidatePath('/espace-proprietaire')
    revalidatePath(`/salle/${venue_id}`)
    return { success: true, action: 'unblocked' }
  } else {
    const payload = {
      venue_id,
      client_id: user.id,
      start_date: date,
      end_date: date,
      status: 'BLOCKED',
      total_price: 0,
      deposit_amount: 0,
      reference_code: `BLK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }
    const { error } = await supabaseAny.from('reservations').insert(payload)
    if (error) return { error: error.message }
    
    revalidatePath('/espace-proprietaire')
    revalidatePath(`/salle/${venue_id}`)
    return { success: true, action: 'blocked' }
  }
}
