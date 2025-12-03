import { redirect } from "next/navigation";
import {
  getGarminAuth,
  getBasicProfile,
  getRecentActivities,
  getDailySteps,
  getDailyStress,
} from "@/actions/garmin";
import Link from "next/link";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const auth = await getGarminAuth();

  if (!auth.isAuthenticated) {
    redirect("/login");
  }

  const [profileResult, activitiesResult, stepsResult, stressResult] =
    await Promise.all([
      getBasicProfile(),
      getRecentActivities(10),
      getDailySteps(new Date(), 7),
      getDailyStress(new Date(), 7),
    ]);

  const profile = profileResult.success ? profileResult.data : null;
  const activities = activitiesResult.success ? activitiesResult.data : [];
  const steps = stepsResult.success ? stepsResult.data : [];
  const stress = stressResult.success ? stressResult.data : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Dashboard Garmin
              </h1>
              {profile && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Bonjour, {profile.display_name || profile.user_name}
                </p>
              )}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Profil Card */}
          {profile && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                Profil
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Nom:</span> {profile.full_name}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Localisation:</span>{" "}
                  {profile.location || "Non renseigné"}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Activité principale:</span>{" "}
                  {profile.primary_activity || "Non renseigné"}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Niveau:</span>{" "}
                  {profile.user_level}
                </p>
              </div>
            </div>
          )}

          {/* Stats Pas */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
              Pas (7 derniers jours)
            </h2>
            {steps.length > 0 ? (
              <div className="space-y-3">
                {steps.slice(-3).map((day: any) => (
                  <div key={day.calendar_date} className="text-sm">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>
                        {new Date(day.calendar_date).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="font-medium">
                        {day.total_steps?.toLocaleString() || "0"} pas
                      </span>
                    </div>
                    {day.total_distance && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-500">
                        {(day.total_distance / 1000).toFixed(2)} km
                      </div>
                    )}
                  </div>
                ))}
                <Link
                  href="/stats/steps"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Voir tout →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Aucune donnée disponible
              </p>
            )}
          </div>

          {/* Stats Stress */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
              Stress (7 derniers jours)
            </h2>
            {stress.length > 0 ? (
              <div className="space-y-3">
                {stress.slice(-3).map((day: any) => (
                  <div key={day.calendar_date} className="text-sm">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>
                        {new Date(day.calendar_date).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="font-medium">
                        Niveau {day.overall_stress_level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Aucune donnée disponible
              </p>
            )}
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Activités récentes
            </h2>
          </div>

          {activities.length > 0 ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {activities.map((activity: any) => (
                <Link
                  key={activity.activity_id}
                  href={`/activity/${activity.activity_id}`}
                  className="block px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                        {activity.activity_name}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {activity.activity_type?.type_key || "Activity"} •{" "}
                        {new Date(activity.start_time_local).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {activity.distance && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Distance:
                        </span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                          {(activity.distance / 1000).toFixed(2)} km
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Durée:
                      </span>
                      <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                        {Math.floor(activity.duration / 60)}min
                      </span>
                    </div>

                    {activity.average_hr && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          FC moy:
                        </span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                          {activity.average_hr} bpm
                        </span>
                      </div>
                    )}

                    {activity.calories && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Calories:
                        </span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-zinc-50">
                          {activity.calories} kcal
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-500">
              Aucune activité récente
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
