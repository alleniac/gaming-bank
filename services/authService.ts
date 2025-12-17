import { createHmac, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { ensureDatabase } from '../lib/bootstrap'
import { ensureAuthSecret, getPasscodeHash, savePasscodeHash } from './settingsService'

const SESSION_COOKIE = 'gb_session'
const SESSION_MAX_AGE_DAYS = 180

type SessionPayload = {
  issuedAt: number
}

function signPayload(secret: string, payload: SessionPayload): string {
  const raw = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(raw).digest('hex')
  const token = Buffer.from(raw).toString('base64')
  return `${token}.${signature}`
}

function verifyToken(secret: string, token: string | undefined): boolean {
  if (!token) return false
  const [payloadB64, signature] = token.split('.')
  if (!payloadB64 || !signature) return false
  const raw = Buffer.from(payloadB64, 'base64').toString()
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  if (expected !== signature) return false
  try {
    JSON.parse(raw) as SessionPayload
    return true
  } catch {
    return false
  }
}

export async function setInitialPasscode(passcode: string) {
  ensureDatabase()
  const hash = await bcrypt.hash(passcode, 10)
  savePasscodeHash(hash)
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  ensureDatabase()
  const existing = getPasscodeHash()
  if (!existing) return false
  return bcrypt.compare(passcode, existing)
}

export async function changePasscode(oldPasscode: string, newPasscode: string) {
  ensureDatabase()
  const ok = await verifyPasscode(oldPasscode)
  if (!ok) {
    throw new Error('Invalid current passcode')
  }
  const hash = await bcrypt.hash(newPasscode, 10)
  savePasscodeHash(hash)
}

export async function login(passcode: string): Promise<{ firstLogin: boolean }> {
  ensureDatabase()
  const existing = getPasscodeHash()
  const firstLogin = !existing
  if (existing) {
    const ok = await bcrypt.compare(passcode, existing)
    if (!ok) {
      throw new Error('Invalid passcode')
    }
  } else {
    const hash = await bcrypt.hash(passcode, 10)
    savePasscodeHash(hash)
  }
  const secret = ensureAuthSecret()
  const payload: SessionPayload = { issuedAt: Date.now() }
  const token = signPayload(secret, payload)
  const jar = await cookies()
  const maxAgeSeconds = SESSION_MAX_AGE_DAYS * 24 * 60 * 60
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: maxAgeSeconds,
    path: '/'
  })
  return { firstLogin }
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  const secret = ensureAuthSecret()
  return verifyToken(secret, token)
}
