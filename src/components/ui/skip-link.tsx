/**
 * Skip Link - Lien pour sauter directement au contenu principal
 *
 * Ce composant est essentiel pour l'accessibilité au clavier et les lecteurs d'écran.
 * Il permet aux utilisateurs de sauter la navigation et d'aller directement au contenu.
 *
 * WCAG 2.4.1 (Niveau A) - Bypass Blocks
 */

'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  /** ID de l'élément cible (default: "main-content") */
  targetId?: string;
  /** Texte du lien (default: "Aller au contenu principal") */
  label?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

export function SkipLink({
  targetId = 'main-content',
  label = 'Aller au contenu principal',
  className
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Caché par défaut
        'sr-only',
        // Visible au focus
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-50',
        'focus:px-4 focus:py-2',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus:font-medium',
        'transition-all',
        className
      )}
    >
      {label}
    </a>
  );
}

/**
 * Composant SkipLinks - Multiple liens de navigation rapide
 *
 * Usage:
 * ```tsx
 * <SkipLinks
 *   links={[
 *     { id: 'main-content', label: 'Aller au contenu principal' },
 *     { id: 'navigation', label: 'Aller à la navigation' },
 *     { id: 'footer', label: 'Aller au pied de page' }
 *   ]}
 * />
 * ```
 */
export function SkipLinks({
  links
}: {
  links: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="sr-only focus-within:not-sr-only">
      {links.map((link) => (
        <SkipLink
          key={link.id}
          targetId={link.id}
          label={link.label}
        />
      ))}
    </div>
  );
}
