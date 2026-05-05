'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData, redirectTo?: string) {
  const supabase = (await createClient()) as any

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Translate common Supabase errors to French
    const msg = error.message?.toLowerCase() || ''
    if (msg.includes('invalid login credentials')) {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    if (msg.includes('email not confirmed')) {
      return { error: 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.' }
    }
    if (msg.includes('too many requests')) {
      return { error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' }
    }
    return { error: error.message }
  }

  // If a specific redirect was requested (e.g., from reservation flow), use it
  if (redirectTo) {
    revalidatePath('/', 'layout')
    redirect(redirectTo)
  }

  // Fetch user role for proper redirect
  const { data: { user } } = await supabase.auth.getUser()
  let redirectUrl = '/parcourir'
  
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'OWNER') redirectUrl = '/espace-proprietaire'
    else if (profile?.role === 'ADMIN') redirectUrl = '/admin'
    else redirectUrl = '/espace-client'
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}
