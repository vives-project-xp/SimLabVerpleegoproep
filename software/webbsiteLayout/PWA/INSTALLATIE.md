# Installatie Website en PWA

Deze installatie gaat alleen over de webapp.

## Backend starten

```bash
cd backend
npm install
copy ..\.env.example .env
npm start
```

Open daarna:

```text
http://localhost:3000
```

## Standaard login

Gebruik lokaal de voorbeeldgebruikers uit `server.js`:

```text
Leerkracht / Leerkracht1
Leerling / Leerling1
```

Voor productie plaats je echte gegevens in `backend/users.json`. Commit dat bestand niet.
