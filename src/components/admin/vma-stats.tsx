'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserWithVma {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  vma: number | null;
  status: string;
}

interface VmaStatsProps {
  users: UserWithVma[];
}

interface VmaRange {
  min: number;
  max: number;
  color: string;
}

const VMA_RANGES: VmaRange[] = [
  { min: 0, max: 14, color: 'bg-slate-500' },
  { min: 14, max: 16, color: 'bg-blue-500' },
  { min: 16, max: 18, color: 'bg-green-500' },
  { min: 18, max: 20, color: 'bg-orange-500' },
  { min: 20, max: 999, color: 'bg-red-500' },
];

export function VmaStats({ users }: VmaStatsProps) {
  const [selectedRangeIndex, setSelectedRangeIndex] = useState<number | null>(null);

  const stats = useMemo(() => {
    // Filtrer uniquement les utilisateurs approuvés
    const approvedUsers = users.filter(u => u.status === 'approved');

    // Filtrer ceux qui ont une VMA
    const usersWithVma = approvedUsers.filter(u => u.vma !== null && u.vma > 0);

    if (usersWithVma.length === 0) {
      return {
        total: approvedUsers.length,
        withVma: 0,
        average: 0,
        min: 0,
        max: 0,
        ranges: VMA_RANGES.map(r => ({ ...r, count: 0, percentage: 0 })),
        allAthletes: [],
      };
    }

    const vmaValues = usersWithVma.map(u => u.vma as number);
    const average = vmaValues.reduce((a, b) => a + b, 0) / vmaValues.length;
    const min = Math.min(...vmaValues);
    const max = Math.max(...vmaValues);

    // Calculer la répartition par tranche
    const ranges = VMA_RANGES.map(range => {
      const count = usersWithVma.filter(u => {
        const vma = u.vma as number;
        return vma >= range.min && vma < range.max;
      }).length;

      return {
        ...range,
        count,
        percentage: (count / usersWithVma.length) * 100,
      };
    });

    // Tous les athlètes triés par VMA décroissante
    const allAthletes = [...usersWithVma]
      .sort((a, b) => (b.vma as number) - (a.vma as number));

    return {
      total: approvedUsers.length,
      withVma: usersWithVma.length,
      average,
      min,
      max,
      ranges,
      allAthletes,
    };
  }, [users]);

  // Filtrer les athlètes selon la tranche sélectionnée
  const displayedAthletes = useMemo(() => {
    if (selectedRangeIndex === null) {
      return stats.allAthletes;
    }

    const range = VMA_RANGES[selectedRangeIndex];
    return stats.allAthletes.filter(u => {
      const vma = u.vma as number;
      return vma >= range.min && vma < range.max;
    });
  }, [stats.allAthletes, selectedRangeIndex]);

  const maxCount = Math.max(...stats.ranges.map(r => r.count), 1);

  return (
    <div className="space-y-6">
      {/* KPIs globaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Athlètes approuvés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.withVma} avec VMA configurée
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VMA moyenne</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.average > 0 ? stats.average.toFixed(1) : '-'}
              {stats.average > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">km/h</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.withVma > 0 ? `${((stats.withVma / stats.total) * 100).toFixed(0)}% de l'équipe` : 'Aucune VMA configurée'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VMA minimale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.min > 0 ? stats.min.toFixed(1) : '-'}
              {stats.min > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">km/h</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Niveau débutant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VMA maximale</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.max > 0 ? stats.max.toFixed(1) : '-'}
              {stats.max > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">km/h</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Meilleure performance</p>
          </CardContent>
        </Card>
      </div>

      {stats.withVma > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Répartition par tranches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Répartition par niveau
              </CardTitle>
              <CardDescription>
                Distribution des athlètes selon leur VMA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.ranges.map((range, index) => (
                <div
                  key={`${range.min}-${range.max}`}
                  className={`space-y-2 p-3 rounded-lg transition-all cursor-pointer ${
                    selectedRangeIndex === index
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'hover:bg-muted/50 border-2 border-transparent'
                  }`}
                  onClick={() => setSelectedRangeIndex(selectedRangeIndex === index ? null : index)}
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {range.min}-{range.max === 999 ? '+' : range.max} km/h
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">{range.count}</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {range.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className={`${range.color} h-full transition-all duration-500 rounded-full`}
                      style={{ width: `${(range.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {selectedRangeIndex !== null && (
                <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                  Cliquez à nouveau pour désélectionner
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liste des athlètes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedRangeIndex === null
                  ? 'Tous les athlètes'
                  : `Athlètes ${VMA_RANGES[selectedRangeIndex].min}-${VMA_RANGES[selectedRangeIndex].max === 999 ? '+' : VMA_RANGES[selectedRangeIndex].max} km/h`
                }
              </CardTitle>
              <CardDescription>
                {selectedRangeIndex === null
                  ? 'Affichage par VMA décroissante'
                  : `${displayedAthletes.length} athlète${displayedAthletes.length > 1 ? 's' : ''} dans cette tranche`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayedAthletes.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {displayedAthletes.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                        #{index + 1}
                      </div>
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback>
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email
                          }
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className="shrink-0"
                      >
                        {user.vma?.toFixed(1)} km/h
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun athlète dans cette tranche
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {stats.withVma === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              Aucun athlète n&apos;a encore configuré sa VMA
            </p>
            <p className="text-sm text-muted-foreground/75 text-center mt-2">
              Les statistiques apparaîtront une fois que les athlètes auront renseigné leur VMA
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
