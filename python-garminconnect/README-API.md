# 🚀 Garmin Connect REST API pour Next.js

## 🎯 Problème résolu

Ce repo Python est une **bibliothèque cliente**, pas un serveur REST. J'ai créé un **serveur Flask** qui expose les données Garmin via des endpoints REST que tu peux appeler depuis ton frontend Next.js.

## 📁 Fichiers créés

1. **`api_server.py`** - Serveur Flask avec 12+ endpoints REST
2. **`requirements-api.txt`** - Dépendances Python
3. **`nextjs-example.md`** - Exemples d'utilisation avec Next.js
4. **`start-api.bat`** - Script de démarrage rapide (Windows)

## 🚀 Démarrage rapide

### 1. Installer et démarrer le serveur Python

**Option A : Script automatique (Windows)**
```bash
start-api.bat
```

**Option B : Manuel**
```bash
# Activer l'environnement virtuel
.venv\Scripts\activate

# Installer les dépendances
pip install -r requirements-api.txt

# Démarrer le serveur
python api_server.py
```

Le serveur démarre sur `http://localhost:5000`

### 2. Authentification (première fois)

Deux options :

**Option A : Via l'endpoint `/api/login`** (depuis Next.js)
```typescript
const response = await fetch('http://localhost:5000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'ton-email@garmin.com',
    password: 'ton-password'
  })
});
```

**Option B : Script Python** (recommandé pour la première fois)
```bash
python example.py
# Entre tes identifiants Garmin
# Les tokens seront sauvegardés dans ~/.garminconnect
```

### 3. Utiliser depuis Next.js

```typescript
// Exemple simple
async function fetchStats() {
  const res = await fetch('http://localhost:5000/api/stats/today');
  const data = await res.json();
  console.log(data);
  // { date: "2024-12-03", steps: 5432, calories: 1234, ... }
}
```

## 📡 Endpoints disponibles

| Endpoint | Description | Exemple de réponse |
|----------|-------------|-------------------|
| `GET /api/health` | Health check | `{"status": "ok"}` |
| `POST /api/login` | Login | `{"success": true}` |
| `GET /api/user` | Info utilisateur | `{"fullName": "John Doe"}` |
| `GET /api/stats/today` | Stats du jour | `{"steps": 5432, "calories": 1234}` |
| `GET /api/stats/date/2024-12-01` | Stats d'une date | `{"steps": 10000, ...}` |
| `GET /api/heartrate/today` | Fréquence cardiaque | `{"restingHeartRate": 65}` |
| `GET /api/activities?limit=10` | Activités récentes | `{"activities": [...]}` |
| `GET /api/hydration/today` | Hydratation | `{"valueInML": 2000}` |
| `GET /api/sleep/today` | Sommeil | `{"sleepData": {...}}` |
| `GET /api/stress/today` | Stress | `{"stressData": {...}}` |
| `GET /api/body-composition` | Composition corporelle | `{...}` |

## 💻 Exemples Next.js

Voir le fichier **`nextjs-example.md`** pour :
- ✅ Composants React avec hooks
- ✅ App Router (Next.js 13+)
- ✅ Server Components
- ✅ Composant de login
- ✅ Dashboard complet

## 🔑 Comment ça marche ?

```
Next.js Frontend  →  Flask API  →  Garmin Connect
(port 3000)         (port 5000)     (API officielle)
```

1. **Next.js** fait un fetch vers `http://localhost:5000/api/stats/today`
2. **Flask** utilise la bibliothèque `garminconnect` Python
3. La bibliothèque appelle l'**API Garmin** officielle
4. Les données reviennent en JSON à Next.js

## 📝 Exemple complet Next.js

```typescript
// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/stats/today')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Mes Stats Garmin</h1>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Pas</p>
          <p className="text-3xl font-bold">{stats.steps}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Calories</p>
          <p className="text-3xl font-bold">{stats.calories}</p>
        </div>
      </div>
    </div>
  );
}
```

## 🔒 Sécurité

⚠️ **Important pour la production** :
- Ajouter une authentification (JWT, API keys)
- Utiliser HTTPS
- Rate limiting
- Variables d'environnement pour les secrets
- Ne jamais exposer les credentials Garmin au frontend

## 🐛 Troubleshooting

**Le serveur ne démarre pas ?**
```bash
pip install flask flask-cors garminconnect
python api_server.py
```

**Erreur 401 (Unauthorized) ?**
```bash
# Crée les tokens d'authentification
python example.py
```

**CORS errors ?**
- Le serveur Flask a déjà CORS activé
- Vérifie que le serveur est bien sur port 5000

**Les données ne s'affichent pas ?**
1. Vérifie que le serveur Python tourne : `http://localhost:5000/api/health`
2. Regarde les logs dans le terminal Python
3. Vérifie la console du navigateur pour les erreurs

## 🎯 Prochaines étapes

1. **Teste le serveur** : Lance `python api_server.py`
2. **Teste les endpoints** : Ouvre `http://localhost:5000/api/health`
3. **Authentifie-toi** : Lance `python example.py` ou POST vers `/api/login`
4. **Intègre dans Next.js** : Utilise les exemples du fichier `nextjs-example.md`

## 💡 Tips

- Les tokens Garmin durent **1 an**, tu n'auras pas à te reconnecter souvent
- Tu peux appeler autant d'endpoints que tu veux en parallèle
- Tous les endpoints retournent du JSON
- Les réponses incluent toujours les données brutes (`raw`) pour plus de flexibilité

Bon dev ! 🚀
