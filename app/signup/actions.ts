'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = (await createClient()) as any

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const role = formData.get('role') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs obligatoires.' }
  }

  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
        role: role,
      }
    }
  })

  if (error) {
    const msg = error.message?.toLowerCase() || ''
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return { error: 'Cet email est déjà utilisé. Essayez de vous connecter.' }
    }
    if (msg.includes('password')) {
      return { error: 'Le mot de passe doit contenir au moins 6 caractères.' }
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return { error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' }
    }
    if (msg.includes('database error') || msg.includes('schema')) {
      return { error: 'Erreur temporaire du serveur. Veuillez réessayer.' }
    }
    return { error: error.message }
  }

  // Try to sign in the user immediately since we auto-confirm via trigger
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (!signInError && signInData?.user) {
    // Use the role from form data directly (most reliable source at signup time)
    let redirectUrl = '/espace-client'
    if (role === 'OWNER') redirectUrl = '/espace-proprietaire'
    else if (role === 'ADMIN') redirectUrl = '/admin'

    revalidatePath('/', 'layout')
    redirect(redirectUrl)
  }

  // Fallback if sign in failed
  return {
    success: true,
    message: 'Compte créé avec succès ! Si vous n\'êtes pas redirigé, veuillez essayer de vous connecter.'
  }
}
