'use client';

import { useMemo } from 'react';
import { driver, type DriveStep, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

interface UseAthleteOnboardingOptions {
  userRole?: string;
  userStatus?: string;
  hasVma: boolean;
}

export function useAthleteOnboarding({
  userRole,
  userStatus,
  hasVma,
}: UseAthleteOnboardingOptions) {
  // Calculer shouldShowOnboarding de manière dérivée avec useMemo
  const shouldShowOnboarding = useMemo(() => {
    // Vérifier si l'utilisateur est un athlète approuvé
    const isApprovedAthlete = userRole === 'athlete' && userStatus === 'approved';
    if (!isApprovedAthlete) return false;

    // Vérifier si on est côté client
    if (typeof window === 'undefined') return false;

    // Vérifier si l'onboarding a déjà été vu
    const hasSeenOnboarding = localStorage.getItem('athlete-onboarding-seen');
    return !hasSeenOnboarding;
  }, [userRole, userStatus]);

  const startOnboarding = () => {
    const steps: DriveStep[] = [
      {
        element: '[data-onboarding="sessions-section"]',
        popover: {
          title: '🏃 Vos séances d\'entraînement',
          description: 'Retrouvez ici vos séances d\'entraînement. Cliquez sur une séance pour voir les détails, le graphique de vitesse (sur PC) et télécharger le PDF.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-onboarding="week-navigation"]',
        popover: {
          title: '📅 Navigation entre les semaines',
          description: 'Naviguez entre les semaines pour consulter vos séances. Idéal le dimanche pour voir les séances planifiées la semaine prochaine.😏',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-onboarding="vma-button"]',
        popover: {
          title: '⚙️ Configuration de la VMA',
          description: hasVma
            ? 'Votre VMA est déjà configurée ! Vous pouvez la modifier à tout moment en cliquant ici.'
            : 'Configurez votre VMA (Vitesse Maximale Aérobie) pour calculer vos allures personnalisées pour chaque séance.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        popover: {
          title: '✅ C\'est parti !',
          description: 'Vous êtes prêt à utiliser la plateforme. Bon entraînement ! 💪',
        },
      },
    ];

    const driverConfig: Config = {
      showProgress: true,
      steps,
      nextBtnText: 'Suivant',
      prevBtnText: 'Précédent',
      doneBtnText: 'Terminé',
      // Permettre les clics sur les éléments mis en avant
      allowClose: true,
      // Fermer l'onboarding si l'utilisateur clique sur un élément interactif
      onPopoverRender: (popover, { state }) => {
        const highlightedElement = state.activeElement;
        if (highlightedElement) {
          // Détecter les clics sur l'élément mis en avant
          const clickHandler = () => {
            // Marquer comme vu et fermer
            localStorage.setItem('athlete-onboarding-seen', 'true');
            driverObj.destroy();
          };
          highlightedElement.addEventListener('click', clickHandler, { once: true });
        }
      },
      onDestroyStarted: () => {
        // Marquer l'onboarding comme vu
        localStorage.setItem('athlete-onboarding-seen', 'true');
        driverObj.destroy();
      },
    };

    const driverObj = driver(driverConfig);
    driverObj.drive();
  };

  return {
    shouldShowOnboarding,
    startOnboarding,
  };
}
