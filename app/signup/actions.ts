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
    return { error: error.message }
  }

  // Try to sign in the user immediately since we might have auto-confirmed them via trigger
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (!signInError) {
    let redirectUrl = '/parcourir'
    if (role === 'OWNER') redirectUrl = '/espace-proprietaire'
    else if (role === 'ADMIN') redirectUrl = '/admin'
    else redirectUrl = '/espace-client'

    revalidatePath('/', 'layout')
    redirect(redirectUrl)
  }

  // Fallback if sign in failed (e.g. if email confirmation is actually required and trigger didn't work)
  return {
    success: true,
    message: 'Compte créé avec succès ! Si vous n\'êtes pas redirigé, veuillez vérifier votre email ou essayer de vous connecter.'
  }
}
