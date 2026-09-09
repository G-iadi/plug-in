# Design Document: Portfolio Online — Home Page

## Overview

Portfolio online per un graphic designer. La prima pagina (Home) è intenzionalmente semivuota, con un solo elemento visivo di grande impatto: un fiore complesso (passiflora) generato proceduralmente via codice. Il design privilegia il respiro, la tipografia e l’asimmetria compositiva.

## Goals

- Creare un’identità visiva moderna e riconoscibile.
- Mantenere la Home minimale, aggiungendo elementi progressivamente in futuro.
- Esplorare effetti grafici digitali (blur, pixel, dither) su un elemento organico.
- Costruire una base tecnica solida e facilmente estendibile.

## Non-Goals (per questa fase)

- Pagine interne (Work, Info, Contact) — saranno link placeholder.
- Caroselli, gallerie, o molteplici elementi interattivi.
- Animazioni complesse oltre alla sbocciata iniziale.
- Ottimizzazione per vecchi browser.

## Target

Clienti e collaboratori del settore grafico/design. Il sito deve comunicare cura del dettaglio e sensibilità estetica.

## Constraints

- Non si usano framework JS pesanti (React, Vue, etc.).
- Il fiore deve essere generato proceduralmente, non un’immagine o SVG statico.
- I font scelti devono essere caricati in modo performante (system fonts come fallback).

## Architecture

La pagina è un singolo file `index.html` con CSS inline o in un file separato `style.css`, e JavaScript in `main.js`. Nessun build step iniziale — si lavora con HTML/CSS/JS vanilla per massima semplicità e controllo.

Struttura dei file prevista:

```
/Users/giadadigiorgio/Desktop/plug-in/
├── index.html
├── style.css
├── main.js
└── docs/superpowers/specs/
    └── 2026-09-09-portfolio-home-design.md
```

## Components

### 1. Canvas Flower (`<canvas>`)

- Posizionato con `position: fixed` o `absolute`, copre l’intera viewport.
- Generato proceduralmente via JavaScript (Canvas 2D API).
- Elementi del fiore:
  - **Centro:** disco con gradiente radiale.
  - **Corona:** filamenti lunghi e pochi, disegnati con curve quadratiche. Angoli e lunghezze leggermente randomizzati per naturalità.
  - **Petali:** 5-10 forme organiche attorno al centro, curve di Bézier.
- **Effetti:**
  - **Blur:** applicato selettivamente sui filamenti di sfondo (via manipolazione pixel o CSS `filter`).
  - **Pixelato:** canvas renderizzato a risoluzione ridotta (`400x400`) e scalato via CSS (`width: 100%; height: 100%`) per effetto pixel art naturale.
  - **Dither:** algoritmo di dithering applicato pixel-per-pixel dopo il disegno del fiore. Pattern noise casuale che confronta il colore con una soglia.
- **Animazione:** sbocciata progressiva al caricamento. I filamenti e i petali si "disegnano" lentamente in 2-3 secondi, simulando una timelapse. Dopo la sbocciata, il fiore rimane statico.
- **Colori:** gamma viola-magenta con highlight chiari (da affinare in fase successiva).
- **Posizione:** centro del fiore spostato a circa `65%` dall’alto e `60%` dalla sinistra (asimmetria).

### 2. Header / Testo

- **Nome / Brand:** in alto al centro.
  - Font: `Elza Trial` (o equivalente display sans-serif bold). Fallback: system-ui sans-serif.
  - Dimensione: `clamp(2.5rem, 5vw, 4.5rem)`.
  - Peso: 700/800.
  - Trasformazione: `uppercase`.
  - Letter-spacing: `0.05em - 0.1em`.
  - Colore: `#f0f0f5`.
  - Padding-top: `8vh`.
- **Tagline:** subito sotto il nome.
  - Font: `Archivo` (o equivalente geometric sans-serif). Fallback: system-ui sans-serif.
  - Dimensione: `clamp(0.9rem, 1.5vw, 1.2rem)`.
  - Peso: 400.
  - Colore: `rgba(240, 240, 245, 0.5)`.
  - Contenuto: breve, 2-3 parole (placeholder per ora).
- **Menu:** in alto a destra.
  - Voci: Work, Info, Contact (link placeholder, `href="#"` o `href="/work"` etc. a seconda della struttura futura).
  - Font: `Archivo`, uppercase.
  - Dimensione: `0.75rem - 0.9rem`.
  - Peso: 500.
  - Letter-spacing: `0.15em`.
  - Colore: `#f0f0f5`.
  - Hover: cambio opacità o sottolineatura (da definire con la palette finale).

### 3. Sfondo

- Colore solido: `#0a0a0f` (nero-blu profondissimo).
- Nessun pattern, nessuna texture — solo il canvas del fiore sopra.

## Data Flow

Al caricamento della pagina:

1. Il browser carica HTML, CSS e JS.
2. Il CSS applica lo stile e posiziona il canvas dietro al testo (`z-index: -1` o `position: fixed`).
3. Lo script JS inizializza il canvas, calcola le dimensioni della viewport, e inizia a disegnare il fiore.
4. L’animazione di sbocciata parte immediatamente: ogni filamento/petalo si disegna con un progresso da 0 a 1 in 2-3 secondi.
5. Al termine dell’animazione, si applica l’effetto dither pixel-per-pixel.
6. Il canvas rimane statico; il testo è leggibile sopra.

## Error Handling

- Se il canvas non è supportato (browser molto vecchi), la pagina mostra solo il testo su sfondo scuro.
- Se i font non caricano, i fallback system-ui mantengono la leggibilità.
- Se JavaScript è disabilitato, la pagina mostra il testo senza il fiore (graceful degradation).

## Testing

- Testare il resize del browser: il fiore si ridisegna proporzionalmente.
- Testare su mobile: il fiore scala e si sposta in basso, il testo rimane in alto.
- Testare performance: l’animazione di sbocciata non deve bloccare il thread principale (usare `requestAnimationFrame`).
- Verificare contrasto testo/sfondo: il nome deve essere sempre leggibile sopra il fiore, anche se il fiore è parzialmente sotto il testo.

## Open Questions / Future Work

- Definire la tagline esatta.
- Affinare la palette colori del fiore (toni viola/magenta esatti).
- Definire il comportamento hover del menu.
- Aggiungere transizioni tra pagine quando verranno create le sezioni interne.
- Esplorare se aggiungere un secondo elemento visivo in futuro (es. un altro fiore, o una forma astratta) e come bilanciarlo con il primo.

## References

- Effetto dither: technique classica del computer graphics, applicabile via Canvas `ImageData`.
- Passiflora: fiore con struttura geometrica ma organica, ideale per generazione matematica.
- Font Archivo: https://fonts.google.com/specimen/Archivo
- Font Elza Trial: disponibile su font distribuzioni trial (verificare licenza prima del deploy).
