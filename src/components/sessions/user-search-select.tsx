'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApprovedUsers } from '@/actions/users';
import type { UserWithMetadata } from '@/actions/users';

interface UserSearchSelectProps {
  onSelectUser: (email: string, userName: string) => void;
  selectedEmail?: string;
}

export function UserSearchSelect({ onSelectUser, selectedEmail }: UserSearchSelectProps) {
  const [users, setUsers] = useState<UserWithMetadata[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger les utilisateurs approuvés
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getApprovedUsers();
      if (result.success && result.users) {
        setUsers(result.users);
        setFilteredUsers(result.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleSelectUser = (user: UserWithMetadata) => {
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    onSelectUser(user.email, userName);
    setSearchQuery('');
    setIsOpen(false);
  };

  const getSelectedUserName = () => {
    const user = users.find((u) => u.email === selectedEmail);
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    }
    return '';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="user-search">Destinataire</Label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="user-search"
            type="text"
            placeholder={selectedEmail ? getSelectedUserName() : "Rechercher un utilisateur..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-9"
            disabled={loading}
          />
        </div>

        {/* Dropdown des résultats */}
        {isOpen && !loading && (
          <>
            {/* Overlay pour fermer le dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            <div className="absolute z-20 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Aucun utilisateur trouvé
                </div>
              ) : (
                <div className="py-1">
                  {filteredUsers.map((user) => {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    const displayName = fullName || user.email;
                    const isSelected = user.email === selectedEmail;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className={cn(
                          "w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-3",
                          isSelected && "bg-accent"
                        )}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={displayName}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {displayName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Afficher l'utilisateur sélectionné */}
      {selectedEmail && !isOpen && (
        <div className="mt-2 p-3 bg-muted/50 rounded-md flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {users.find((u) => u.email === selectedEmail)?.imageUrl ? (
              <img
                src={users.find((u) => u.email === selectedEmail)?.imageUrl}
                alt={getSelectedUserName()}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{getSelectedUserName()}</div>
            <div className="text-xs text-muted-foreground truncate">{selectedEmail}</div>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-xs text-muted-foreground">Chargement des utilisateurs...</p>
      )}
    </div>
  );
}
