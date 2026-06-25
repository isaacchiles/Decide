/**
 * resend.ts — Resend client singleton (server-side only).
 *
 * Used for firing events that trigger automations:
 *   - user.signed_up  → Sequence A (welcome + activation)
 *   - decision.completed → Sequence B (follow-up + re-engagement)
 *
 * Never import this in client components — RESEND_API_KEY is server-only.
 */

import { Resend } from 'resend';

const key = process.env.RESEND_API_KEY ?? '';
export const resendClient = key ? new Resend(key) : null;
