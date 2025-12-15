import { Resend } from 'resend';

// Créer l'instance Resend avec la clé API
export const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration de l'expéditeur avec nom d'affichage
// Format: "Nom Affiché <email@domaine.com>"
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'ASUL Team';

// Email par défaut pour l'envoi (avec nom d'affichage)
export const FROM_EMAIL = `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`;
