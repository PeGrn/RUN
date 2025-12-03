import { redirect } from "next/navigation";
import { getGarminAuth, getFullActivity, downloadActivityGPX } from "@/actions/garmin";
import Link from "next/link";
import { ActivityMap } from "./activity-map";
import { ActivityCharts } from "./activity-charts";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getGarminAuth();

  if (!auth.isAuthenticated) {
    redirect("/login");
  }

  const { id } = await params;
  const activityId = parseInt(id);

  const [result, gpxResult] = await Promise.all([
    getFullActivity(activityId),
    downloadActivityGPX(activityId),
  ]);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Activité introuvable
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activity = result.data;
  const summary = activity.summary_dto || {};
  const metadata = activity.metadata_dto || {};

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}min ${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}min ${secs.toString().padStart(2, "0")}`;
  };

  const formatPace = (speedMs: number) => {
    if (!speedMs) return "N/A";
    const paceSecPerKm = 1000 / speedMs;
    const minutes = Math.floor(paceSecPerKm / 60);
    const seconds = Math.floor(paceSecPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  };

  const fahrenheitToCelsius = (fahrenheit: number) => {
    return Math.round((fahrenheit - 32) * 5 / 9);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-2 inline-block"
          >
            ← Retour au dashboard
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {activity.activity_name || "Activité sans nom"}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {activity.activity_type_dto?.type_key || "Activity"} •{" "}
            {summary.start_time_local ? new Date(summary.start_time_local).toLocaleString("fr-FR", {
              dateStyle: "full",
              timeStyle: "short",
            }) : "Date inconnue"}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summary.distance && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Distance
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {(summary.distance / 1000).toFixed(2)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">km</div>
            </div>
          )}

          {summary.duration && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Durée
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatDuration(summary.duration)}
              </div>
            </div>
          )}

          {summary.average_speed && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Allure moyenne
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPace(summary.average_speed)}
              </div>
            </div>
          )}

          {summary.average_hr && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                FC moyenne
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {summary.average_hr}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                bpm {summary.max_hr && `(max: ${summary.max_hr})`}
              </div>
            </div>
          )}

          {summary.calories && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Calories
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {summary.calories}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                kcal
              </div>
            </div>
          )}

          {summary.elevation_gain && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Dénivelé+
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {Math.round(summary.elevation_gain)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">m</div>
            </div>
          )}

          {summary.average_run_cadence && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Cadence moyenne
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {Math.round(summary.average_run_cadence)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                spm
              </div>
            </div>
          )}

          {summary.training_effect && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Training Effect
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {summary.training_effect.toFixed(1)}
              </div>
            </div>
          )}

          {summary.max_speed && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Vitesse max
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {(summary.max_speed * 3.6).toFixed(1)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                km/h
              </div>
            </div>
          )}

          {summary.elevation_loss && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Dénivelé-
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {Math.round(summary.elevation_loss)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">m</div>
            </div>
          )}

          {summary.steps && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Pas
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {summary.steps.toLocaleString('fr-FR')}
              </div>
            </div>
          )}

          {summary.stride_length && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Longueur de foulée
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {Math.round(summary.stride_length)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">cm</div>
            </div>
          )}

          {(summary.max_elevation || summary.min_elevation) && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                Altitude
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {summary.max_elevation ? Math.round(summary.max_elevation) : 'N/A'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {summary.min_elevation && `min: ${Math.round(summary.min_elevation)}m`}
              </div>
            </div>
          )}
        </div>

        {/* Carte du parcours */}
        {gpxResult.success && gpxResult.data && (
          <div className="mb-8">
            <ActivityMap gpxData={gpxResult.data} />
          </div>
        )}

        {/* Graphiques d'analyse */}
        {activity.laps && activity.laps.length > 0 && (
          <div className="mb-8">
            <ActivityCharts laps={activity.laps} activityName={activity.activity_name} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Laps */}
          {activity.laps && activity.laps.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Tours ({activity.laps.length})
                </h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {activity.laps.map((lap: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-zinc-200 dark:border-zinc-700 rounded p-3"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                        Tour {lap.lap_index + 1}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-zinc-600 dark:text-zinc-400">
                          Distance: {(lap.distance / 1000).toFixed(2)} km
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400">
                          Durée: {formatDuration(lap.duration)}
                        </div>
                        {lap.average_speed && (
                          <div className="text-zinc-600 dark:text-zinc-400">
                            Allure: {formatPace(lap.average_speed)}
                          </div>
                        )}
                        {lap.average_hr && (
                          <div className="text-zinc-600 dark:text-zinc-400">
                            FC: {lap.average_hr} bpm
                          </div>
                        )}
                        {lap.average_run_cadence && (
                          <div className="text-zinc-600 dark:text-zinc-400">
                            Cadence: {Math.round(lap.average_run_cadence)} spm
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Splits */}
          {activity.splits && activity.splits.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Splits km par km ({activity.splits.length})
                </h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {activity.splits.map((split: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        Km {idx + 1}
                      </span>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-x-4">
                        <span>{formatDuration(split.duration)}</span>
                        {split.average_speed && (
                          <span>{formatPace(split.average_speed)}</span>
                        )}
                        {split.average_hr && (
                          <span>{split.average_hr} bpm</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Météo */}
        {activity.weather && (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow mt-6 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Conditions météo
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Température:
                </span>
                <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {fahrenheitToCelsius(activity.weather.temp)}°C
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Ressenti:
                </span>
                <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {fahrenheitToCelsius(activity.weather.apparent_temp)}°C
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Humidité:
                </span>
                <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {activity.weather.relative_humidity}%
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Vent:</span>
                <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {activity.weather.wind_speed} km/h {activity.weather.wind_direction_compass_point}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
