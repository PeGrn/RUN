'use client';

import { useState, useMemo } from 'react';
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
  Mail,
  ArrowUpDown
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UsersManagementProps {
  users: UserWithMetadata[];
}

type SortField = 'name' | 'email' | 'createdAt' | 'role';
type SortOrder = 'asc' | 'desc';

export function UsersManagement({ users: initialUsers }: UsersManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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

  // Séparer les utilisateurs par statut
  const pendingUsers = useMemo(() =>
    users.filter(u => u.status === 'pending'),
    [users]
  );

  const approvedUsers = useMemo(() =>
    users.filter(u => u.status === 'approved'),
    [users]
  );

  // Fonction de tri
  const sortUsers = (usersList: UserWithMetadata[]) => {
    return [...usersList].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email;
          const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email;
          compareValue = nameA.localeCompare(nameB);
          break;
        case 'email':
          compareValue = a.email.localeCompare(b.email);
          break;
        case 'role':
          compareValue = a.role.localeCompare(b.role);
          break;
        case 'createdAt':
          compareValue = a.createdAt - b.createdAt;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedPendingUsers = useMemo(() => sortUsers(pendingUsers), [pendingUsers, sortField, sortOrder]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedApprovedUsers = useMemo(() => sortUsers(approvedUsers), [approvedUsers, sortField, sortOrder]);

  // Composant de bouton de tri
  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant={sortField === field ? 'default' : 'outline'}
      size="sm"
      onClick={() => toggleSort(field)}
      className="gap-2"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  // Composant UserCard réutilisable
  const UserCard = ({ user }: { user: UserWithMetadata }) => (
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

        {/* Badges : Rôle */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1 text-xs">
            {getRoleIcon(user.role)}
            <span className="capitalize">{user.role}</span>
          </Badge>
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
  );

  return (
    <div className="space-y-4">
      {/* Boutons de tri */}
      <div className="flex flex-wrap gap-2">
        <SortButton field="name" label="Nom" />
        <SortButton field="email" label="Email" />
        <SortButton field="role" label="Rôle" />
        <SortButton field="createdAt" label="Date" />
      </div>

      {/* Tabs pour séparer pending et approved */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {pendingUsers.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <Check className="h-4 w-4" />
            Approuvés
            {approvedUsers.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {approvedUsers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {sortedPendingUsers.length > 0 ? (
            sortedPendingUsers.map(user => <UserCard key={user.id} user={user} />)
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                Aucun utilisateur en attente
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {sortedApprovedUsers.length > 0 ? (
            sortedApprovedUsers.map(user => <UserCard key={user.id} user={user} />)
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                Aucun utilisateur approuvé
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
