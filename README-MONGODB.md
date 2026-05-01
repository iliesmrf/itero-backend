# MongoDB Setup pour Itero

## Démarrage rapide

### 1. Lancer MongoDB avec Docker

```bash
cd /Users/ilies/Work/itero/backend
docker-compose up -d
```

Cela démarre :
- **MongoDB** sur `localhost:27017`
- **Mongo Express** (interface web) sur `http://localhost:8081`

### 2. Accéder à Mongo Express

Ouvrez votre navigateur sur `http://localhost:8081`

- **Username**: `admin`
- **Password**: `admin123`

Vous pouvez explorer les collections, voir les documents, et gérer la base de données.

### 3. Configuration

Les credentials MongoDB sont dans `.env` :

```env
MONGODB_URI=mongodb://itero:itero_password_2024@localhost:27017/itero?authSource=admin
```

### 4. Démarrer le backend

```bash
npm run start:dev
```

Le backend se connectera automatiquement à MongoDB.

### 5. Schéma de données

#### Collection: `rooms`

```javascript
{
  code: "AB12",                    // Code unique de la room (4 caractères)
  step: 0,                         // Étape actuelle (0-6)
  format: "start-stop-continue",   // Format de rétro
  participants: {                  // Map des participants
    "John": {
      id: "uuid",
      name: "John",
      color: "#a78bfa",
      textColor: "#1e1240",
      avatar: "https://...",
      joinedAt: 1234567890
    }
  },
  notes: {                        // Map des notes
    "note-uuid": {
      id: "uuid",
      text: "Améliorer les tests",
      col: "start",
      author: "John",
      authorColor: "#a78bfa",
      createdAt: 1234567890,
      clusterId: "cluster-uuid"   // Optionnel
    }
  },
  clusters: {                     // Map des clusters (groupes de notes)
    "cluster-uuid": {
      id: "uuid",
      label: "Tests · Qualité",
      noteIds: ["note-uuid-1", "note-uuid-2"],
      col: "start",
      createdAt: 1234567890
    }
  },
  votes: {                        // Map des votes par utilisateur
    "John": {
      "note-uuid": 2,             // 2 votes sur cette note
      "note-uuid-2": 1
    }
  },
  actions: {                      // Map des actions
    "action-uuid": {
      id: "uuid",
      text: "Mettre en place CI/CD",
      owner: "John",
      date: "2024-06-15",
      priority: "high",           // high | medium | low
      addedBy: "John",
      createdAt: 1234567890
    }
  },
  summary: {                      // Résumé IA généré
    generatedAt: 1234567890,
    text: "## Synthèse...",       // Markdown
    topVotedNotes: [...],
    actionCount: 5
  },
  history: [                      // Historique des sessions
    {
      id: "uuid",
      createdAt: 1234567890,
      format: "start-stop-continue",
      participantNames: ["John", "Jane"],
      noteCount: 15,
      actionCount: 5,
      summary: {...},
      actions: [...]
    }
  ],
  createdAt: 1234567890,
  expiresAt: Date                 // TTL - suppression automatique après 24h
}
```

### 6. Index TTL (Time To Live)

Les rooms sont **automatiquement supprimées après 24 heures** grâce à l'index TTL sur `expiresAt`.

### 7. Commandes utiles

#### Voir les rooms actives
```bash
docker exec -it itero-mongodb mongosh -u itero -p itero_password_2024 --authenticationDatabase admin itero
```

Puis dans le shell MongoDB :
```javascript
db.rooms.find().pretty()
db.rooms.countDocuments()
```

#### Supprimer toutes les rooms
```javascript
db.rooms.deleteMany({})
```

#### Voir les rooms qui expirent bientôt
```javascript
db.rooms.find({
  expiresAt: { $lt: new Date(Date.now() + 3600000) } // Dans moins d'1h
})
```

### 8. Arrêter MongoDB

```bash
docker-compose down
```

Pour supprimer aussi les données :
```bash
docker-compose down -v
```

## Migration depuis l'ancien système

L'ancien système utilisait une `Map` en mémoire. Toutes les données étaient perdues au redémarrage.

Avec MongoDB :
- ✅ **Persistence** - Les données survivent aux redémarrages
- ✅ **TTL automatique** - Nettoyage automatique après 24h
- ✅ **Scalabilité** - Peut gérer des milliers de rooms simultanées
- ✅ **Backup facile** - Les données sont dans `/data/db` du conteneur
- ✅ **Interface web** - Mongo Express pour explorer les données

## Avantages

1. **Pas de perte de données** - Les sessions persistent même si le serveur crash
2. **TTL automatique** - Les vieilles rooms sont supprimées automatiquement
3. **Performance** - Index sur le code pour des recherches ultra-rapides
4. **Scaling** - Facile à mettre en cluster si besoin
5. **Monitoring** - Interface Mongo Express pour voir les données en temps réel

## Production

Pour la production, changez :
1. Les credentials dans `.env`
2. Utilisez un service MongoDB managé (MongoDB Atlas, etc.)
3. Activez le chiffrement SSL/TLS
4. Configurez les backups automatiques

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/itero?retryWrites=true&w=majority
```
