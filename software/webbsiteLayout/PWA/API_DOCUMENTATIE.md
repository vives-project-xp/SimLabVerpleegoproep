# API Documentatie

## Endpoints

| Methode | Endpoint | Doel |
| --- | --- | --- |
| `POST` | `/api/login` | Inloggen |
| `POST` | `/api/logout` | Uitloggen |
| `GET` | `/api/me` | Huidige gebruiker ophalen |
| `GET` | `/api/state` | Dashboardstatus ophalen |
| `POST` | `/api/call` | Bedstatus aanpassen |
| `GET` | `/api/push/public-key` | VAPID public key ophalen |
| `POST` | `/api/push/subscribe` | Push subscription opslaan |
| `POST` | `/api/push/unsubscribe` | Push subscription verwijderen |
| `POST` | `/api/change-password` | Leerkrachtwachtwoord wijzigen |
| `POST` | `/api/change-student-password` | Leerlingwachtwoord wijzigen |

## Statusupdate

```bash
curl -X POST http://localhost:3000/api/call ^
  -H "Content-Type: application/json" ^
  -d "{\"room\":\"C302\",\"bed\":\"1\",\"status\":\"call\"}"
```

Ondersteunde statussen:

```text
idle
call
present
extra
```
