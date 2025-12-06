'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  UserCog,
  Shield,
  User,
  Clock,
  Mail
} from 'lucide-react';
import { approveUser, revokeUser, updateUserRole } from '@/actions/users';
import type { UserWithMetadata } from '@/actions/users';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UsersManagementProps {
  users: UserWithMetadata[];
}

export function UsersManagement({ users: initialUsers }: UsersManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setLoadingUserId(userId);
    try {
      const result = await approveUser(userId);
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, status: 'approved' as const } : u
        ));
        toast.success('Utilisateur approuvé');
      } else {
        toast.error(result.error || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    setLoadingUserId(userId);
    try {
      const result = await revokeUser(userId);
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, status: 'pending' as const } : u
        ));
        toast.success('Accès révoqué');
      } else {
        toast.error(result.error || 'Erreur lors de la révocation');
      }
    } catch (error) {
      toast.error('Erreur lors de la révocation');
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'athlete' | 'coach' | 'admin') => {
    setLoadingUserId(userId);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setUsers(users.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        ));
        toast.success('Rôle modifié');
      } else {
        toast.error(result.error || 'Erreur lors de la modification du rôle');
      }
    } catch (error) {
      toast.error('Erreur lors de la modification du rôle');
    } finally {
      setLoadingUserId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'coach':
        return <UserCog className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'coach':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Trier : pending en premier, puis par date de création
  const sortedUsers = [...users].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {sortedUsers.map((user) => (
        <Card key={user.id} className="p-3 sm:p-4 md:p-6">
          <div className="space-y-3">
            {/* Avatar et nom/email */}
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback>
                  {user.firstName?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate mb-1">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </p>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            {/* Badges : Rôle + Statut */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1 text-xs">
                {getRoleIcon(user.role)}
                <span className="capitalize">{user.role}</span>
              </Badge>

              {user.status === 'pending' ? (
                <Badge variant="outline" className="gap-1 text-xs text-orange-600 border-orange-600">
                  <Clock className="h-3 w-3" />
                  En attente
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-600">
                  <Check className="h-3 w-3" />
                  Approuvé
                </Badge>
              )}
            </div>

            {/* Actions : Sélecteur de rôle + Bouton */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {/* Sélecteur de rôle - pleine largeur sur mobile */}
              {user.role !== 'admin' && (
                <Select
                  value={user.role}
                  onValueChange={(value: 'athlete' | 'coach') => handleRoleChange(user.id, value)}
                  disabled={loadingUserId === user.id}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="athlete">Athlète</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Bouton d'approbation/révocation - pleine largeur sur mobile */}
              {user.status === 'pending' ? (
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => handleApprove(user.id)}
                  disabled={loadingUserId === user.id}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
              ) : user.role !== 'admin' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => handleRevoke(user.id)}
                  disabled={loadingUserId === user.id}
                >
                  <X className="h-4 w-4 mr-2" />
                  Révoquer
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ))}

      {sortedUsers.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Aucun utilisateur trouvé</p>
        </Card>
      )}
    </div>
  );
}
