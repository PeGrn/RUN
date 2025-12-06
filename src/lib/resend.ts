import { Resend } from 'resend';

// Créer l'instance Resend avec la clé API
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email par défaut pour l'envoi (depuis votre domaine custom)
export const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
