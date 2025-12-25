'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { connectUserGarmin, disconnectUserGarmin } from '@/actions/garmin';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ProfilePageClientProps {
  garminStatus: {
    success: boolean;
    connected: boolean;
    displayName?: string;
    connectedAt?: Date;
    lastSyncedAt?: Date;
  };
}

export function ProfilePageClient({ garminStatus }: ProfilePageClientProps) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showMfaInput, setShowMfaInput] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsConnecting(true);

    try {
      const result = await connectUserGarmin(email, password, showMfaInput ? mfaCode : undefined);

      if (result.mfaRequired && !showMfaInput) {
        setShowMfaInput(true);
        toast.info('Code MFA requis', {
          description: 'Veuillez entrer votre code d\'authentification à deux facteurs',
        });
        setIsConnecting(false);
        return;
      }

      if (result.success) {
        toast.success('Connecté à Garmin Connect !', {
          description: `Bienvenue ${result.displayName || 'utilisateur'}`,
        });

        // Reset form
        setEmail('');
        setPassword('');
        setMfaCode('');
        setShowMfaInput(false);

        // Refresh page to show new status
        router.refresh();
      } else {
        toast.error('Échec de la connexion', {
          description: result.error,
        });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la connexion', {
        description: error.message,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);

    try {
      const result = await disconnectUserGarmin();

      if (result.success) {
        toast.success('Déconnecté de Garmin Connect');
        router.refresh();
      } else {
        toast.error('Échec de la déconnexion', {
          description: result.error,
        });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la déconnexion', {
        description: error.message,
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>

      {/* Garmin Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Connexion Garmin Connect</CardTitle>
          <CardDescription>
            Connectez votre compte Garmin pour exporter automatiquement vos séances d&apos;entraînement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {garminStatus.connected ? (
            <div className="space-y-4">
              {/* Connected Status */}
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Connecté à Garmin Connect
                  </p>
                  {garminStatus.displayName && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Compte : {garminStatus.displayName}
                    </p>
                  )}
                  {garminStatus.connectedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Connecté le {new Date(garminStatus.connectedAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Disconnect Button */}
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="w-full"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Déconnexion en cours...
                  </>
                ) : (
                  'Déconnecter mon compte Garmin'
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                Vous pouvez maintenant exporter vos séances directement vers Garmin Connect depuis la page d&apos;entraînement.
              </p>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              {/* Not Connected Status */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg mb-4">
                <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Non connecté à Garmin Connect
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Connectez-vous pour exporter automatiquement vos séances
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Garmin Connect</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* MFA Code (shown only if required) */}
              {showMfaInput && (
                <div className="space-y-2">
                  <Label htmlFor="mfaCode">Code MFA</Label>
                  <Input
                    id="mfaCode"
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entrez le code d&apos;authentification à deux facteurs de votre application
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Connecter mon compte Garmin'
                )}
              </Button>

              {/* Security Notice */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p className="font-medium">🔒 Sécurité :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Vos identifiants sont chiffrés avec AES-256-GCM</li>
                  <li>Aucun accès externe possible</li>
                  <li>Vous pouvez vous déconnecter à tout moment</li>
                </ul>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
