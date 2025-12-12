'use client';

import { useEffect, useState } from 'react';
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
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est un athlète approuvé
    const isApprovedAthlete =
      userRole === 'athlete' &&
      userStatus === 'approved';

    if (!isApprovedAthlete) {
      return;
    }

    // Vérifier si l'onboarding a déjà été vu
    const hasSeenOnboarding = localStorage.getItem('athlete-onboarding-seen');

    if (!hasSeenOnboarding) {
      setShouldShowOnboarding(true);
    }
  }, [userRole, userStatus]);

  const startOnboarding = () => {
    const steps: DriveStep[] = [
      {
        element: '[data-onboarding="vma-button"]',
        popover: {
          title: '🎯 Configurez votre VMA',
          description: hasVma
            ? 'Votre VMA est déjà configurée ! Vous pouvez la modifier à tout moment en cliquant ici.'
            : 'Pour profiter pleinement de la plateforme, commencez par configurer votre VMA (Vitesse Maximale Aérobie). Elle permet de calculer vos allures personnalisées pour chaque séance.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-onboarding="week-navigation"]',
        popover: {
          title: '📅 Navigation entre les semaines',
          description: 'Utilisez ces boutons pour basculer entre la semaine actuelle et la semaine prochaine. Vous pouvez ainsi anticiper vos prochaines séances.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-onboarding="sessions-section"]',
        popover: {
          title: '🏃 Vos séances d\'entraînement',
          description: 'Retrouvez ici toutes vos séances planifiées pour la semaine. Cliquez sur une séance pour voir les détails, le graphique de vitesse (sur PC) et télécharger le PDF.',
          side: 'top',
          align: 'start',
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
      onPopoverRender: (popover, { config, state }) => {
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
