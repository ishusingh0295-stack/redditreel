'use server'

import { prisma, signIn } from "@/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

/* ── Validation helpers ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE  = /^[a-zA-Z0-9 _\-\.]{2,32}$/;

function validateRegistration(email: string, password: string, name: string) {
  if (!name?.trim())     return 'Display name is required.';
  if (!NAME_RE.test(name.trim()))
    return 'Name must be 2–32 characters (letters, numbers, spaces, _ - . only).';

  if (!email?.trim())    return 'Email address is required.';
  if (!EMAIL_RE.test(email.trim()))
    return 'Please enter a valid email address.';

  if (!password)         return 'Password is required.';
  if (password.length < 8)
    return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password))
    return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password))
    return 'Password must contain at least one number.';

  return null; // valid
}

export async function registerAction(formData: FormData) {
  const email    = (formData.get('email')    as string)?.trim().toLowerCase();
  const password =  formData.get('password') as string;
  const name     = (formData.get('name')     as string)?.trim();

  // 1 — Format validation
  const validationError = validateRegistration(email, password, name);
  if (validationError) return { error: validationError };

  try {
    // 2 — Duplicate email check
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) return { error: 'An account with this email already exists.' };

    // 3 — Duplicate name check (case-insensitive)
    const byName = await prisma.user.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (byName) return { error: 'This display name is already taken.' };

    // 4 — First user becomes ADMIN
    const count = await prisma.user.count();
    const role  = count === 0 ? 'ADMIN' : 'USER';

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, name, password: hashedPassword, role },
    });

    return { success: true };
  } catch {
    return { error: 'Failed to register account. Please try again.' };
  }
}

export async function loginAction(formData: FormData) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') return { error: 'Invalid email or password.' };
      return { error: 'Something went wrong. Please try again.' };
    }
    throw error; // Expected for Next.js NEXT_REDIRECT to work
  }
}
