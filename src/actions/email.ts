'use server';

import { Resend } from 'resend';
import { getSessionPdfBuffer } from './training-sessions';

const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration de l'expéditeur avec nom d'affichage
// Format: "Nom Affiché <email@domaine.com>"
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM || 'contact@paul-etienne.fr';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'ESL Team';
const EMAIL_FROM = `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`;

export interface SendSessionEmailInput {
  sessionId: string;
  sessionName: string;
  toEmail: string;
  fromEmail?: string;
  // Nouveaux champs pour la personnalisation
  userName?: string;
  sessionDate?: string | Date;
}

// Petite fonction utilitaire pour formater la date en français si nécessaire
const formatDate = (date: string | Date | undefined) => {
  if (!date) return "Date non spécifiée";
  if (typeof date === 'string') return date;
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Envoie une séance d'entraînement par email
 */
export async function sendSessionEmail(input: SendSessionEmailInput) {
  try {
    // Récupérer le PDF depuis Minio
    const pdfBuffer = await getSessionPdfBuffer(input.sessionId);

    if (!pdfBuffer) {
      return {
        success: false,
        error: 'PDF not found',
      };
    }

    const formattedDate = formatDate(input.sessionDate);
    const userNameDisplay = input.userName ? input.userName : "";

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: input.fromEmail || EMAIL_FROM,
      to: input.toEmail,
      subject: `Votre séance : ${input.sessionName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #000; font-size: 24px; font-weight: bold; margin: 0;">ESL Team</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 32px; border-radius: 12px; border: 1px solid #e5e7eb;">
            
            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 24px;">
              Bonjour ${userNameDisplay},
            </h2>

            <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
              Voici votre prochaine séance d'entraînement disponible en pièce jointe (PDF).
            </p>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;">
                <strong>Séance :</strong> ${input.sessionName}
              </p>
              <p style="margin: 0; color: #374151; font-size: 15px;">
                <strong>Planifiée pour le :</strong> ${formattedDate}
              </p>
            </div>

            <p style="color: #374151; font-size: 16px; margin: 0;">
              Bon entraînement !
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Ceci est un mail envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>

        </div>
      `,
      attachments: [
        {
          filename: `${input.sessionName.replace(/[^a-z0-9]/gi, '-')}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
}

/**
 * Envoie un PDF directement par email (sans passer par la base de données)
 * Note: J'ai harmonisé le style ici aussi pour la cohérence, 
 * mais simplifié car on a moins d'infos (pas de date/nom user par défaut)
 */
export async function sendPdfEmail(
  pdfBuffer: Buffer,
  fileName: string,
  toEmail: string,
  subject?: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
      subject: subject || `Programme - ${fileName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
           <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #000; font-size: 24px; font-weight: bold; margin: 0;">ESL Team</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 32px; border-radius: 12px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
              Bonjour,
            </h2>
            <p style="color: #374151; font-size: 16px; line-height: 24px;">
              Programme d'entraînement disponible en pièce jointe.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Ceci est un mail envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${fileName}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: 'Failed to send email',
    };
  }
}