/**
 * Utilitaires d'accessibilité pour les lecteurs d'écran
 */

import type { TrainingElement } from './vma';
import type { TrainingSession } from '@prisma/client';
import { calculateVMAProgram, convertBuilderElementsToSteps } from './vma';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Parse une durée string (ex: "1:30") en secondes
 */
function parseDurationString(input: string): number {
  if (!input) return 0;
  if (input.includes(':')) {
    const [min, sec] = input.split(':').map(Number);
    return (min || 0) * 60 + (sec || 0);
  }
  const val = parseFloat(input);
  if (!isNaN(val)) return val * 60; // Assume minutes par défaut
  return 0;
}

/**
 * Génère une description textuelle d'une étape d'entraînement
 * Optimisée pour les lecteurs d'écran
 */
export function generateStepDescription(step: any, userVma: number | null): string {
  const intensity = step.vmaPercentage
    ? `${step.vmaPercentage} pourcent de VMA`
    : 'intensité modérée';

  if (step.type === 'time') {
    const totalSeconds = parseDurationString(step.duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let timeStr = '';
    if (minutes > 0) {
      timeStr += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (seconds > 0) {
      if (minutes > 0) timeStr += ' et ';
      timeStr += `${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }

    return `${step.name || 'Étape'}: ${timeStr} à ${intensity}`;
  } else {
    const distanceKm = step.distance / 1000;
    const distanceText = distanceKm >= 1
      ? `${distanceKm.toFixed(1)} kilomètres`
      : `${step.distance} mètres`;
    return `${step.name || 'Étape'}: ${distanceText} à ${intensity}`;
  }
}

/**
 * Génère un résumé complet et accessible d'une séance
 * Inclut tous les détails nécessaires pour un utilisateur aveugle
 */
export function generateSessionAccessibleSummary(
  session: TrainingSession,
  steps: TrainingElement[],
  userVma: number | null
): string {
  const sessionDate = session.sessionDate ? new Date(session.sessionDate) : null;
  const dateStr = sessionDate
    ? format(sessionDate, "EEEE d MMMM yyyy", { locale: fr })
    : 'date non définie';

  const convertedSteps = convertBuilderElementsToSteps(steps);
  const program = calculateVMAProgram(convertedSteps, userVma || 15);

  const blocksCount = steps.length;
  const totalSteps = steps.reduce((acc, block) => acc + block.steps.length, 0);

  let summary = `Séance ${session.name}, prévue le ${dateStr}. `;

  // Distance
  const distanceKm = program.totalDistance / 1000;
  summary += `Distance totale: ${distanceKm.toFixed(2)} kilomètres. `;

  // Durée
  const totalMinutes = Math.floor(program.totalTime / 60);
  const totalSeconds = program.totalTime % 60;
  summary += `Durée totale: ${totalMinutes} minute${totalMinutes > 1 ? 's' : ''}`;
  if (totalSeconds > 0) {
    summary += ` et ${totalSeconds} seconde${totalSeconds > 1 ? 's' : ''}`;
  }
  summary += '. ';

  // Structure
  summary += `Cette séance comprend ${blocksCount} bloc${blocksCount > 1 ? 's' : ''} d'entraînement, `;
  summary += `avec un total de ${totalSteps} étape${totalSteps > 1 ? 's' : ''}. `;

  // Description
  if (session.description) {
    summary += `Description: ${session.description}. `;
  }

  // Détail des blocs
  steps.forEach((block, blockIndex) => {
    summary += `Bloc numéro ${blockIndex + 1}: ${block.name}. `;

    if (block.repetitions > 1) {
      summary += `Ce bloc est à répéter ${block.repetitions} fois. `;
    }

    summary += `Il contient ${block.steps.length} étape${block.steps.length > 1 ? 's' : ''}: `;

    block.steps.forEach((step, stepIndex) => {
      summary += `Étape ${stepIndex + 1}, ${generateStepDescription(step, userVma)}. `;
    });
  });

  if (!userVma) {
    summary += `Remarque: Configurez votre VMA pour obtenir des allures personnalisées.`;
  }

  return summary;
}

/**
 * Génère une description accessible pour un graphique de vitesse
 */
export function generateChartAccessibleDescription(program: any): string {
  if (!program || !program.segments) {
    return 'Graphique de vitesse non disponible.';
  }

  const speeds = program.segments.map((s: any) => s.speed);
  const maxSpeed = Math.max(...speeds);
  const minSpeed = Math.min(...speeds);
  const avgSpeed = speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length;

  let description = `Graphique de vitesse de la séance. `;
  description += `Vitesse minimum: ${minSpeed.toFixed(1)} kilomètres par heure. `;
  description += `Vitesse maximum: ${maxSpeed.toFixed(1)} kilomètres par heure. `;
  description += `Vitesse moyenne: ${avgSpeed.toFixed(1)} kilomètres par heure. `;
  description += `Le graphique affiche ${program.segments.length} segment${program.segments.length > 1 ? 's' : ''}. `;

  // Décrire la tendance
  if (maxSpeed > avgSpeed * 1.3) {
    description += `La séance comporte des variations importantes de vitesse, avec des phases intenses. `;
  } else if (maxSpeed < avgSpeed * 1.1) {
    description += `La séance se déroule à une allure relativement constante. `;
  }

  return description;
}

/**
 * Génère une annonce pour le changement de semaine
 */
export function generateWeekChangeAnnouncement(
  isNextWeek: boolean,
  sessionsCount: number,
  eventsCount: number
): string {
  const weekLabel = isNextWeek ? 'Semaine prochaine' : 'Semaine actuelle';
  const sessionsText = `${sessionsCount} séance${sessionsCount > 1 ? 's' : ''} d'entraînement`;
  const eventsText = `${eventsCount} événement${eventsCount > 1 ? 's' : ''}`;

  return `${weekLabel} chargée. ${sessionsText} et ${eventsText} planifiés.`;
}

/**
 * Formate une durée en secondes en texte accessible
 */
export function formatDurationAccessible(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes === 0) {
    return `${secs} seconde${secs > 1 ? 's' : ''}`;
  }

  let result = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (secs > 0) {
    result += ` et ${secs} seconde${secs > 1 ? 's' : ''}`;
  }
  return result;
}

/**
 * Formate une distance en mètres en texte accessible
 */
export function formatDistanceAccessible(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km.toFixed(km % 1 === 0 ? 0 : 2)} kilomètre${km > 1 ? 's' : ''}`;
  }
  return `${meters} mètre${meters > 1 ? 's' : ''}`;
}
