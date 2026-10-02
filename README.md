# Jongseo Lee — Research Office

An interactive 3D version of my research homepage. You arrive in a lobby, open the door, and walk
into a small office where every object opens a section of the site.

| Lobby | Office (day) | Office (night) |
| --- | --- | --- |
| ![Lobby](docs/lobby.png) | ![Office by day](docs/office-day.png) | ![Office at night](docs/office-night.png) |

## What's inside

- **Lobby** — profile summary, a notice board with the latest news, a visitor counter and the door.
- **Office** — the camera stands inside the room, so the room fills the screen. Numbered objects
  open the sections:

  | # | Object | Section |
  | --- | --- | --- |
  | 1 | Bookshelf | About |
  | 2 | Whiteboard | Research |
  | 3 | Monitor | Publications |
  | 4 | Wall of frames | Recognition |
  | 5 | Calendar | News |
  | 6 | Robot arm | Physical AI |
  | 7 | Letter tray | Contact |

  The door on the left wall leads back to the lobby.
- **Seoul time** — the badge in the top bar shows the current time in Seoul. By day the office is
  bright; at night it switches to a dim, lamp-lit study mood (page theme included). Click the badge
  to flip between the two, or preview a time with `?hour=22`.
- **Deep links** — `#office` skips the lobby; `#publications`, `#research`, `#news`, … open a section.

## Run locally

Static files only (three.js is loaded from a CDN), so any static server works:

```
python3 -m http.server 8765
```

then open http://127.0.0.1:8765. It runs as-is on GitHub Pages.

## Project layout

```
index.html        Page shell, lobby, and the content of every panel (<template id="tpl-…">)
css/office.css    All styles; day/night colours are CSS variables at the top
js/
  main.js         Boot
  config.js       Sections, their 3D anchors and camera framing, room size, visitor counter
  ui.js           Chips, markers and the detail panel (works without WebGL)
  lobby.js        Entrance screen and the enter / exit transitions
  clock.js        Seoul clock → theme, window sky, lamps
  visitors.js     Visitor counter
  scene.js        Renderer, lights, pointer interaction, camera, frame loop
  room.js         The room and every object in it
  textures.js     Canvas-drawn textures (whiteboard, awards, calendar, …)
  util.js         Mesh and drawing helpers
  three.js        The one place that names the three.js CDN URL
assets/           Profile photo, paper thumbnails, teaser video
```

## Editing content

- **Text** of a section: edit its `<template>` in `index.html`. The lobby's "Latest news" list is
  generated from the News template, so news only needs updating in one place.
- **Add or move a section**: edit `HOTSPOTS` in `js/config.js` and build its object in `js/room.js`.
- **Visitor counter**: uses [Abacus](https://abacus.jasoncameron.dev), a free public counter API.
  Change the namespace in `js/config.js`, or set `VISITOR_COUNTER` to `null` to remove it.
  Local previews never increase the count.
