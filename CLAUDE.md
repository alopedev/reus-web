# Web de horarios Barcelona ↔ Reus (nombre pendiente)

Web de una sola pantalla con los próximos trenes regionales directos entre Barcelona-Sants y Reus.
El hero es el interior de un vagón pintado en acuarela con el paisaje en movimiento en la ventanilla.
Es sobre todo una pieza de portfolio de Àlex (qué sabe hacer dirigiendo a Claude) y además una herramienta real.

- Producto y alcance: `docs/PRD.md`
- Decisiones y registro estético: `docs/plan.md`
- Estado y siguiente paso: @docs/handoff.md

## Comandos

- `npm install` la primera vez; `npm run dev` abre la web en local con recarga al guardar
- `npm run build`: comprueba tipos (TypeScript estricto) y genera `dist/` con Vite (`src/index.html` + `src/main.ts` + `data/trains.json`); `npm run typecheck` solo comprueba tipos
- `python3 scripts/check.py`: comprueba reglas de diseño en escritorio y móvil y guarda capturas en `screenshots/`. Ejecútalo después de cada cambio visual y revisa las capturas antes de dar nada por terminado
- `python3 scripts/extract_trains.py`: descarga el GTFS abierto de Renfe y regenera `data/trains.json` (14 días desde hoy)
- `check.py` sirve `dist/` y `dist-paridad/` por HTTP: ejecuta siempre `npm run check` (compila ambos y comprueba). `python3 scripts/check.py paridad` solo compara con los fotogramas de referencia de `scripts/baseline/<sistema>/` (un minuto; macOS y Linux tienen los suyos); borra uno para renovarlo cuando un cambio visible esté aprobado. La paridad usa un horario congelado (`scripts/baseline/trains.json`, compilado con `npm run build:paridad` vía la variable `TRAINS` de `vite.config.js`) para que la actualización diaria de horarios no mueva sus referencias
- `check.py` necesita Playwright + Chromium (`pip install playwright && playwright install chromium`); usa WebGL por software y espera 9 s por viewport
- No hay tests unitarios ni linter; las verificaciones son los tipos (`tsc`) y `check.py`

## Cómo trabajamos

- Àlex aporta el criterio estético y decide; Claude propone y construye
- Antes de cambiar algo visible: propuestas (wireframes o capturas, normalmente 3 opciones) y esperar su elección
- Anota cada decisión estética aprobada en la tabla de `docs/plan.md` (decisión, descartado, por qué)
- Explica en castellano claro; señala riesgos y cuestiona sin dar la razón por inercia

## Reglas de diseño (aprobadas; no cambiarlas sin preguntar)

- Máximo dos fuentes: Young Serif (nombre, horas, trayectos) y Karla 500/700 (resto). Todas las horas en Young Serif
- Sin bloques de color blanco ni cajas que tapen la pintura; la legibilidad sale del contraste con la pared
- El nombre de la web nunca pisa la ventanilla (lo verifica `check.py`)
- Texto grande en formato cartel: color papel `#F1EADC` con sombra desplazada `#2D241C`
- Subrayado punteado = «esto se puede pulsar». Úsalo igual en todos los textos interactivos
- Sentido del viaje: dos billetes de tren recortados en papel; el activo muestra el viaje, el otro se levanta para invitar a pulsar
- Sin controles de pausa ni «volver a pintar» para el público. Atajos solo para grabar: R repinta, P pausa (el espacio queda para hacer scroll)
- La luz del paisaje y del vagón sigue la hora elegida (amanecer, día, atardecer, noche)
- La estética manda sobre la rapidez, pero la animación no puede ir a tirones
- Respeta `prefers-reduced-motion` (fotograma fijo)

## Técnica

- Migración a Vite + TypeScript en curso (`docs/migracion.md`). Three.js 0.128 y GSAP 3.15 (núcleo + ScrollTrigger) como dependencias npm con versión fija; fuentes desde Google Fonts. Nada más externo
- Paisaje: escena 3D → render target → shader de acuarela (Kuwahara + modelo de pigmento). El vagón se pinta en el mismo shader fuera de la ventanilla (`sdRR` con el rectángulo de `#win`)
- Horarios en minutos desde medianoche; claves `r` (Sants→Reus), `b` (Reus→Sants), `a` (AVE, sin uso aún)
- IDs de parada GTFS: Barcelona-Sants 71801, Reus 71400
- Días sin dato usan el último día conocido del mismo tipo y la web avisa de «horario aproximado»
- Los horarios se regeneran solos cada día (`.github/workflows/horarios.yml`, 04:00 UTC): si cambian y pasan todas las pruebas, un commit a `main` los publica; si algo falla, no se publica nada y GitHub avisa por email. Se puede lanzar a mano desde la pestaña Actions
- Escala de cartel: el `font-size` de `html` sigue a la pantalla (`min(1.111vw, 1.778vh)`, mínimo 14 px; en vertical, el ancho) y todos los tamaños del hero y la mesa van en `rem`. No uses px ni `clamp(…vw…)` sueltos: rompen la proporción. La geometría en JS (mesa, objetos) se mide en `rem` leyendo el tamaño de la raíz
- La maquetación de la mesa decide por el espacio real (container queries sobre `.escena`), no por el tamaño de pantalla. La mesa fija (sticky) exige pantalla apaisada de ≥ 1000 × 780: misma media query en CSS y en `PINNED` del script
- `check.py` recorre 11 tamaños de pantalla (360 a 2560 px); si cambias tamaños, revisa también esas capturas
- Módulos TypeScript en `src/`: `main.ts` (arranque, en este orden: mundo, mesa, paisaje, horarios, transición), `state.ts` (`state`, `reduce`), `time.ts` (hora de Madrid y horarios, tipos `Train`/`DayTimetable`), `light.ts` (`daylight`), `world.ts` (escena 3D + acuarela, interfaz `World`), `table.ts` (mesa pintada y capas vivas), `scenery.ts` (bucle del paisaje, atajos R/P), `timetable.ts` (hora grande, billetes, regla), `shelf.ts` (transición: `pose` —ángulos/bisagra/escala de pared y mesa, compartida con `letters.ts`—, `pitch`, caída de papeles, tapa; llama a `letters.measure`/`letters.render` desde su propio listener de scroll/resize), `letters.ts` (fase 3: viaje de letras `h1.brand` → `h2#qe` como recortes de papel; `pair`/`state` puros, `measure`/`render`/`reset` con medidas cacheadas), `dom.ts` (`byId`/`find` para elementos que siempre existen en `index.html`). Shaders en `src/shaders/*.frag` (importados con `?raw`); estilos en `src/styles/` (incluye `letters.css`, capa `#letras`)
- Edita `src/`; `dist/` se regenera. Los horarios se importan de `data/trains.json`. `check.py` lee el estado de la página por `window.reus` (`hingeAt`, `dropped`, `ScrollTrigger`, `letras.pair`/`letras.state`): si renombras algo, actualízalo ahí
- `check.py` depende de los selectores `.brand`, `#win`, `#info`, `.soon` y `#dep`: si los renombras, actualiza el script
- Flujo en runtime: `build3D()` devuelve `world` (`setTime`, `frame(dx, time, reveal)`) o `null` sin WebGL (la página debe seguir funcionando). `loop()` limita el render a 30 fps y para el `requestAnimationFrame` en pausa o con la pestaña oculta
- `daylight(min)` es la única fuente de luz: define a la vez el cielo del paisaje y los colores de pared, madera y asientos del vagón
- La hora «actual» siempre es la de Europe/Madrid (`madridNow()`), no la del navegador
- Estado de la UI en `state` {dir, useNow, minute}; `render()` lo recalcula todo. Si hoy no quedan trenes, muestra los primeros de mañana
- `extract_trains.py` conserva la clave `a` del fichero anterior y no escribe nada si el feed no devuelve trenes

## Publicación

- Web: https://reus-web.vercel.app (Vercel, proyecto `reus-web` del equipo `alexs-projects-856da12a`). Cada push a `main` la publica; cada rama o PR tiene su URL de prueba (protegida con la sesión de Vercel)
- GitHub Actions (`.github/workflows/check.yml`) pasa tipos, compilación y `check.py` en cada push y PR. Si falta un fotograma de referencia de Linux, el run lo escribe y falla: descárgalo del artifact `capturas` (`gh run download`) y súbelo a `scripts/baseline/linux/`
- Repo: `alopedev/reus-web` (privado). Haz push solo cuando Àlex lo pida: `gh auth switch --user alopedev`, luego `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin main` (el llavero de macOS guarda las credenciales de la otra cuenta) y vuelve con `gh auth switch --user alex-olive_raona`
- El artifact de claude.ai (https://claude.ai/artifact/WPG4PK7RoqLePQYZetQRY4) quedó en la versión 15 y ya no se actualiza
