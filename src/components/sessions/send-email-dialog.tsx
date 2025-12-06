'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { sendSessionEmail } from '@/actions/email';
import { toast } from 'sonner';
import { UserSearchSelect } from './user-search-select';

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    name: string;
  };
}

export function SendEmailDialog({ open, onOpenChange, session }: SendEmailDialogProps) {
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectUser = (email: string, userName: string) => {
    setSelectedEmail(email);
    setSelectedUserName(userName);
  };

  const handleSend = async () => {
    if (!selectedEmail || !selectedEmail.includes('@')) {
      toast.error('Veuillez sélectionner un destinataire');
      return;
    }

    setLoading(true);

    try {
      const result = await sendSessionEmail({
        sessionId: session.id,
        sessionName: session.name,
        toEmail: selectedEmail,
      });

      if (result.success) {
        toast.success(`Email envoyé à ${selectedUserName || selectedEmail}`);
        setSelectedEmail('');
        setSelectedUserName('');
        onOpenChange(false);
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer par email
          </DialogTitle>
          <DialogDescription>
            Envoyez le programme "{session.name}" par email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <UserSearchSelect
            onSelectUser={handleSelectUser}
            selectedEmail={selectedEmail}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={loading || !selectedEmail}>
            {loading ? 'Envoi en cours...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
