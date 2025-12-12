'use client';

import { useState, useCallback } from 'react';
import { Download, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSessionPdfUrl } from '@/actions/training-sessions';
import { sendSessionEmail } from '@/actions/email';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

interface SessionActionsProps {
  sessionId: string;
  sessionName: string;
  sessionDate?: Date;
  variant?: 'default' | 'compact';
  className?: string;
}

export function SessionActions({
  sessionId,
  sessionName,
  sessionDate,
  variant = 'default',
  className = '',
}: SessionActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useUser();

  const handleDownloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      const result = await getSessionPdfUrl(sessionId);
      if (result.success && result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `${sessionName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Téléchargement démarré');
      } else {
        toast.error('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  }, [sessionId, sessionName]);

  const handleSendEmail = useCallback(async () => {
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    const userName = user?.firstName || user?.lastName || 'Athlète';

    if (!userEmail) {
      toast.error('Email non disponible');
      return;
    }

    setSending(true);
    try {
      const result = await sendSessionEmail({
        sessionId,
        sessionName,
        toEmail: userEmail,
        userName,
        sessionDate,
      });

      if (result.success) {
        toast.success(`Email envoyé à ${userEmail}`);
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  }, [sessionId, sessionName, sessionDate, user]);

  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={downloading || sending}
          className="flex-1 h-9"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">PDF</span>
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendEmail}
          disabled={sending || downloading}
          className="flex-1 h-9"
        >
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Email</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <Button
        variant="default"
        onClick={handleDownloadPdf}
        disabled={downloading || sending}
        className="w-full"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Télécharger PDF
      </Button>
      <Button
        variant="outline"
        onClick={handleSendEmail}
        disabled={sending || downloading}
        className="w-full"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Mail className="h-4 w-4 mr-2" />
        )}
        Recevoir par email
      </Button>
    </div>
  );
}
