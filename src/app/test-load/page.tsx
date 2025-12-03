import { client } from "@/lib/garth";
import { cookies } from "next/headers";

// Page de test pour charger des tokens existants
export default async function TestLoadPage() {
  // Si tu as des tokens sauvegardés en Python, charge-les ici
  // Exemple : client.load("C:\\Users\\paule\\.garth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Instructions pour éviter le rate limit</h1>

        <div className="space-y-4 text-sm">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4">
            <h2 className="font-semibold mb-2">❌ HTTP 429 - Rate Limited</h2>
            <p>Cloudflare te bloque temporairement car tu as fait trop de tentatives.</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
            <h2 className="font-semibold mb-2">✅ Solution 1 : Attendre</h2>
            <p>Attends 15-30 minutes avant de réessayer de te connecter.</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
            <h2 className="font-semibold mb-2">✅ Solution 2 : Utiliser la bibliothèque Python</h2>
            <p className="mb-2">Si tu as Python, installe la bibliothèque officielle :</p>
            <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
pip install garth
            </pre>

            <p className="mt-2 mb-2">Puis connecte-toi une fois en Python :</p>
            <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
{`import garth
garth.login("ton-email@example.com", "ton-mot-de-passe")
garth.save("~/.garth")  # Sauvegarde les tokens`}
            </pre>

            <p className="mt-2">Les tokens seront sauvegardés et tu pourras les réutiliser !</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-4">
            <h2 className="font-semibold mb-2">✅ Solution 3 : Changer d IP</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Désactive/réactive ton WiFi</li>
              <li>Utilise un VPN</li>
              <li>Utilise ton téléphone en partage de connexion</li>
            </ul>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-4">
            <h2 className="font-semibold mb-2">ℹ️ Pourquoi ce problème ?</h2>
            <p>
              Garmin utilise Cloudflare pour se protéger des bots. Les multiples tentatives
              de connexion rapprochées pendant le développement ont déclenché la protection
              anti-bot. C'est normal en phase de test !
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <a
            href="/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-center transition-colors"
          >
            Retourner au login (attendre 15-30 min)
          </a>
        </div>
      </div>
    </div>
  );
}
