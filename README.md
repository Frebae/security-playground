# Shinobi Friends Book

Een vriendenboekje in Naruto stijl, gebouwd als **security playground**: een kleine webapplicatie om veilig webontwikkelen mee te oefenen. Gebruikers maken een account, vullen hun eigen "shinobi-pagina" in en kunnen de pagina's van andere gebruikers bekijken.

---

## Functies

- Account aanmaken en inloggen met e-mail en wachtwoord
- Eigen vriendenboekpagina invullen en opslaan (dorp, clan, rang, chakra, jutsu, enz.)
- Lijst van alle gebruikers bekijken
- De vriendenboekpagina van andere gebruikers lezen
- Uitloggen

## Gebruikte technieken

| Onderdeel  | Techniek                                      |
|------------|-----------------------------------------------|
| Backend    | Node.js met Express                           |
| Database   | PostgreSQL (via `pg`)                         |
| Sessies    | `express-session`                             |
| Beveiliging| `bcrypt` (wachtwoorden), `express-rate-limit` |
| Frontend   | HTML, CSS en vanilla JavaScript               |

---

## Projectstructuur

```
├── server.js            # Express-server met alle routes
└── public/              # Statische bestanden voor de browser
    ├── index.html       # Inlogpagina (bereikbaar via /)
    ├── register.html    # Account aanmaken
    ├── home.html        # Startpagina met gebruikerslijst
    ├── profile.html     # Eigen vriendenboekpagina invullen
    ├── user.html        # Pagina van een andere gebruiker bekijken
    ├── style.css        # Alle opmaak
    └── images/
        ├── logo.png     # Logo in de badge
        └── gate.png     # Achtergrondafbeelding
```

---

## Installatie

### 1. Vereisten

- [Node.js](https://nodejs.org/) (versie 18 of hoger)
- Een PostgreSQL-database

### 2. Packages installeren

```bash
npm install express express-session express-rate-limit bcrypt pg
```

### 3. Database aanmaken

Maak een database `security_playground` aan en voer deze SQL uit:

```sql
CREATE TABLE users (
    id        SERIAL PRIMARY KEY,
    username  TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL,
    village   TEXT,
    clan      TEXT,
    rank      TEXT,
    chakra    TEXT,
    jutsu     TEXT,
    food      TEXT,
    dream     TEXT,
    trait     TEXT,
    weakness  TEXT,
    team      TEXT,
    message   TEXT
);
```

> `UNIQUE` op `email` is nodig: de server gebruikt die foutmelding om te laten zien dat een e-mailadres al bestaat.

### 4. Verbinding instellen

Pas in `server.js` de databasegegevens aan naar je eigen omgeving:

```js
const pool = new Pool({
    host: "192.168.56.101", port: 5432,
    user: "playground_user", password: "test123",
    database: "security_playground"
});
```

### 5. Starten

```bash
node server.js
```

Open daarna [http://localhost:3000](http://localhost:3000) in je browser.

---

## API-routes

| Methode | Route            | Inloggen nodig | Wat het doet                                   |
|---------|------------------|----------------|------------------------------------------------|
| POST    | `/register`      | Nee            | Maakt een nieuw account aan                    |
| POST    | `/login`         | Nee            | Logt in (max. 5 pogingen per minuut)           |
| GET     | `/logout`        | Nee            | Beëindigt de sessie                            |
| GET     | `/api/users`     | Ja             | Lijst van alle gebruikers (id en naam)         |
| GET     | `/api/users/:id` | Ja             | Vriendenboekpagina van één gebruiker           |
| GET     | `/api/profile`   | Ja             | Je eigen gegevens, inclusief e-mail            |
| POST    | `/profile`       | Ja             | Slaat je eigen vriendenboekpagina op           |

---

## Beveiliging

Wat er al in zit:

- **Wachtwoorden gehasht** met bcrypt, nooit als platte tekst opgeslagen
- **Geparametriseerde queries** (`$1`, `$2`, …) tegen SQL-injectie
- **Rate limiting** op het inloggen tegen brute-force-aanvallen
- **Eén foutmelding** bij verkeerde e-mail én verkeerd wachtwoord, zodat niet te achterhalen is welke e-mailadressen bestaan
- **`textContent` in plaats van `innerHTML`** voor gebruikersinvoer, tegen XSS
- **Sessiecontrole** op alle routes met persoonlijke gegevens
- E-mailadressen van andere gebruikers worden niet meegestuurd

## Verbeterpunten

Dingen die nog op de lijst staan om te oefenen:

- [ ] Databasewachtwoord en sessie-secret naar een `.env`-bestand verplaatsen
- [ ] Sessie vernieuwen na inloggen (`req.session.regenerate`) tegen session fixation
- [ ] Cookie-instellingen aanscherpen (`httpOnly`, `sameSite`, `secure`)
- [ ] CSRF-bescherming toevoegen aan de formulieren
- [ ] Invoer ook op de server controleren (lengte, verplichte velden, wachtwoordsterkte)
- [ ] Oogje bij het wachtwoordveld bedienbaar maken met het toetsenbord
