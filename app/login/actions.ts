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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

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
    if (msg.includes('database error') || msg.includes('schema')) {
      return { error: 'Erreur temporaire du serveur. Veuillez réessayer.' }
    }
    return { error: error.message }
  }

  // If a specific redirect was requested (e.g., from reservation flow), use it
  if (redirectTo) {
    revalidatePath('/', 'layout')
    redirect(redirectTo)
  }

  // Use the session user data directly from signIn response to determine role
  // This avoids making a second DB query in the same serverless request
  // where the auth cookie may not yet be propagated
  let redirectUrl = '/espace-client'

  if (data?.user) {
    // First try user_metadata (faster, no DB query)
    const metaRole = data.user.user_metadata?.role
    if (metaRole === 'OWNER') {
      redirectUrl = '/espace-proprietaire'
    } else if (metaRole === 'ADMIN') {
      redirectUrl = '/admin'
    } else {
      // Fallback: try querying profiles with a fresh client
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        if (profile?.role === 'OWNER') redirectUrl = '/espace-proprietaire'
        else if (profile?.role === 'ADMIN') redirectUrl = '/admin'
      } catch {
        // Profile query failed — use default redirect
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect(redirectUrl)
}
