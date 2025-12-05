'use server';

import { Resend } from 'resend';
import { getSessionPdfBuffer } from './training-sessions';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendSessionEmailInput {
  sessionId: string;
  sessionName: string;
  toEmail: string;
  fromEmail?: string;
}

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

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: input.fromEmail || process.env.EMAIL_FROM || 'contact@paul-etienne.fr',
      to: input.toEmail,
      subject: `Programme VMA - ${input.sessionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Votre Programme d'Entraînement VMA</h2>
          <p>Bonjour,</p>
          <p>Voici votre programme d'entraînement VMA : <strong>${input.sessionName}</strong></p>
          <p>Le programme détaillé est disponible en pièce jointe au format PDF.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Ce programme a été généré avec Running Data by Coach Javier 🏃‍♂️💨
          </p>
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
 */
export async function sendPdfEmail(
  pdfBuffer: Buffer,
  fileName: string,
  toEmail: string,
  subject?: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'contact@paul-etienne.fr',
      to: toEmail,
      subject: subject || `Programme VMA - ${fileName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Votre Programme d'Entraînement VMA</h2>
          <p>Bonjour,</p>
          <p>Voici votre programme d'entraînement VMA.</p>
          <p>Le programme détaillé est disponible en pièce jointe au format PDF.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Ce programme a été généré avec Running Data by Coach Javier 🏃‍♂️💨
          </p>
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
