# 🗺️ Klasyfikacja Dziwek — Mapa Interaktywna

Satyryczna cyfrowa mapa myśli. Projekt humorystyczny.

## 🌐 Live

👉 **https://wrobelkamil.github.io/mapadziwek/**

## 📁 Struktura

```
mapadziwek/
├── index.html      ← szkielet HTML
├── data.json       ← dane węzłów
├── css/style.css   ← stylowanie
└── js/
    ├── data.js     ← dane + localStorage
    ├── map.js      ← SVG rendering, pan/zoom
    ├── ui.js       ← panele, modal, search
    └── app.js      ← entry point
```

## ➕ Jak dodać nowe dziwki

1. Kliknij **"+ Dodaj dziwkę"** w aplikacji
2. Wypełnij formularz i kliknij Zapisz
3. Kliknij **"💾 Eksportuj JSON"** — pobierze nowy `data.json`
4. Wgraj `data.json` do repo (zastąp stary plik)
5. Strona aktualizuje się automatycznie w ~30s

## ⌨️ Skróty

| Klawisz | Akcja |
|---------|-------|
| `N` | Dodaj dziwkę |
| `F` | Szukaj |
| `ESC` | Zamknij panel |
| Scroll | Zoom |
| Drag | Przesuwanie |

*projekt satyryczny • nie traktuj poważnie*
