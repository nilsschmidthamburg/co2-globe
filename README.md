# CO₂ Globe 🌍

Interaktive 3D-Visualisierung globaler CO₂-Emissionen von 1970 bis 2024.

## Features

- **3D-Globus** mit echten CO₂-Emissionsdaten
- **Zeitreise** durch 54 Jahre Klimageschichte (1970-2024)
- **Zwei Ansichtsmodi**: Nach Ländern oder Regionen
- **Zwei Datenansichten**: Absolute Emissionen (oder Pro-Kopf-Emissionen)
- **Interaktive Steuerung**: Tastatur-Shortcuts und Animation
- **Responsive Tooltips** mit detaillierten Länderdaten

## Screenshot

![CO₂ Globe](./public/images/co2-globe.iml.jpg)

## Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build
```

Die Anwendung läuft auf `http://localhost:3000`.

## Steuerung

- **Leertaste**: Play/Pause Animation
- **Pfeiltasten ↑↓**: Jahr vor/zurück
- **Pfeiltasten ←→**: Globus drehen
- **Maus**: Hover für Länder-Details

## Technologie-Stack

- **React 18** + TypeScript
- **Vite** - Build Tool
- **react-globe.gl** - 3D Globus-Visualisierung
- **Three.js** - 3D Rendering
- **D3.js** - Farbskalen und Datenverarbeitung
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible UI Components

## Datenquelle

Die CO₂-Emissionsdaten stammen von:

**[EDGAR - Emissions Database for Global Atmospheric Research](https://edgar.jrc.ec.europa.eu/)**
© European Commission, Joint Research Centre (JRC)
Lizenz: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Weitere Details zur Datennutzung finden Sie in [ATTRIBUTION.md](./ATTRIBUTION.md).

## Projektstruktur

```
co2-globe/
├── src/
│   ├── components/     # React-Komponenten
│   ├── lib/           # Daten und Utilities
│   └── App.tsx        # Haupt-App
├── public/            # Statische Assets
├── co2.csv           # Rohdaten (EDGAR)
└── ATTRIBUTION.md    # Detaillierte Quellenangaben
```

## Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](./LICENSE) veröffentlicht.

Die verwendeten CO₂-Daten unterliegen der CC BY 4.0 Lizenz (siehe [ATTRIBUTION.md](./ATTRIBUTION.md)).

---

**Hinweis**: Diese Anwendung läuft vollständig im Browser und sammelt keine persönlichen Daten.