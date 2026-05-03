# Troubleshooting Website en PWA

## Login werkt niet

- Controleer of de server draait.
- Controleer `backend/users.json` of de standaardlogin.
- Kijk in de browserconsole of `/api/login` een fout geeft.

## Dashboard blijft leeg

Test:

```bash
curl http://localhost:3000/api/state
```

Let op: deze route vraagt een sessie. In de browser moet je eerst ingelogd zijn.

## Push notifications werken niet

- Controleer of HTTPS actief is in productie.
- Controleer `VAPID_PUBLIC_KEY` en `VAPID_PRIVATE_KEY` in `.env`.
- Controleer of de browser notificaties toestaat.
- Controleer of `sw.js` bereikbaar is via `/sw.js`.

## Oude versie blijft zichtbaar

- Hard refresh: `Ctrl + Shift + R`.
- Verwijder de service worker via DevTools.
- Verhoog eventueel `CACHE_NAME` in `frontend/sw.js`.
