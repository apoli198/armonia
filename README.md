# Color Harmony · Armocromia

PWA per la selezione di outfit basata sulla teoria del colore e l'armocromia.

## Deploy su Netlify (5 minuti)

### 1. Carica su GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/color-harmony.git
git push -u origin main
```

### 2. Collega a Netlify
1. Vai su [netlify.com](https://netlify.com) → **Sign up** (gratis)
2. **Add new site → Import an existing project**
3. Scegli **GitHub** → seleziona il repo `color-harmony`
4. Le impostazioni sono già corrette (legge `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Clicca **Deploy site**

Dopo ~1 minuto hai un URL tipo `https://color-harmony-abc123.netlify.app`

### 3. Installa su iPhone
1. Apri l'URL in **Safari** su iPhone
2. Tocca il tasto **Condividi** (quadrato con freccia ↑)
3. Scorri e tocca **"Aggiungi a schermata Home"**
4. Conferma → appare l'icona come un'app

L'app funziona **offline** dopo il primo caricamento. I dati sono salvati localmente.

## Sviluppo locale
```bash
npm install
npm run dev
```
