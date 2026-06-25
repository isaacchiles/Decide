/**
 * resend.ts — Resend client singleton (server-side only).
 *
 * Used for:
 *   - Adding/updating contacts in the Resend audience (welcome sequence)
 *   - Firing custom events to trigger automations (decision.completed)
 *
 * Never import this in client components — RESEND_API_KEY is server-only.
 */

import { Resend } from 'resend';

const key       = process.env.RESEND_API_KEY       ?? '';
export const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? '';

export const resendClient = key ? new Resend(key) : null;
