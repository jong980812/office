# Walk-in Homepage — notes for Claude Code

A walk-in homepage: a lobby (plain HTML) with a door that opens into a 3D office (three.js) where
each object opens a section. Static files only, no build step, deployed on GitHub Pages.

## Run and check

- Serve the folder with any static server (`python3 -m http.server 8765`) and open
  `http://127.0.0.1:8765`. Modules won't load from `file://`.
- `?hour=22` previews night, `?hour=13` day. `#office` skips the lobby; `#<section-id>` opens a panel.
- After a visual change, look at it: lobby and office, day and night, wide and phone width.

## Where things live

- `index.html` — lobby markup and one `<template id="tpl-<section-id>">` per panel. All site text is here.
- `js/config.js` — `HOTSPOTS` (section id, label, 3D anchor for the marker, camera target / direction /
  size when focused), room size, overview camera, visitor counter. Start here to add or move a section.
- `js/room.js` — builds the room and every object; each hotspot object is a group passed to `register()`.
- `js/textures.js` — text that lives on 3D objects (whiteboard, award frames, book spines, calendar,
  door sign) is drawn on canvases here, not loaded from images.
- `js/scene.js` — renderer, lights, `LIGHTING` per time of day, pointer interaction, camera fit.
- `js/clock.js` — time zone (`Asia/Seoul`) and the day/night switch; the place label is in `index.html`.
- `css/office.css` — colours are variables at the top; the night theme overrides them in one block.

## Adapting it for someone else

Personal content to replace: every panel template and the lobby in `index.html`, the `<title>` and
meta description, canvas text in `js/textures.js`, award list and book labels in `js/room.js`,
`assets/` (photo, thumbnails, teaser video and its poster) and `VISITOR_COUNTER`
in `js/config.js`, the time zone in `js/clock.js`, and the links in the top bar.

## Conventions

- Keep it dependency-free and build-free. three.js is imported only in `js/three.js`.
- When an object moves or is resized in `room.js`, update its `anchor` / `target` / `size` in `config.js`.
- The site must stay readable without WebGL and usable on a phone.
