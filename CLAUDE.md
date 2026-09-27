# Web de horarios Barcelona ↔ Reus (nombre pendiente)

Web de una sola pantalla con los próximos trenes regionales directos entre Barcelona-Sants y Reus.
El hero es el interior de un vagón pintado en acuarela con el paisaje en movimiento en la ventanilla.
Es sobre todo una pieza de portfolio de Àlex (qué sabe hacer dirigiendo a Claude) y además una herramienta real.

- Producto y alcance: `docs/PRD.md`
- Decisiones y registro estético: `docs/plan.md`
- Estado y siguiente paso: @docs/handoff.md

## Comandos

- `python3 scripts/build.py`: genera `dist/index.html` (plantilla `src/hero.html` + `data/trains.json`)
- `python3 scripts/check.py`: comprueba reglas de diseño en escritorio y móvil y guarda capturas en `screenshots/`. Ejecútalo después de cada cambio visual y revisa las capturas antes de dar nada por terminado
- `python3 scripts/extract_trains.py`: descarga el GTFS abierto de Renfe y regenera `data/trains.json` (14 días desde hoy)
- `check.py` lee `dist/index.html`: ejecuta siempre `python3 scripts/build.py && python3 scripts/check.py`
- `check.py` necesita Playwright + Chromium (`pip install playwright && playwright install chromium`); usa WebGL por software y espera 9 s por viewport
- No hay tests unitarios ni linter; `check.py` es la única verificación automática

## Cómo trabajamos

- Àlex aporta el criterio estético y decide; Claude propone y construye
- Antes de cambiar algo visible: propuestas (wireframes o capturas, normalmente 3 opciones) y esperar su elección
- Anota cada decisión estética aprobada en la tabla de `docs/plan.md` (decisión, descartado, por qué)
- Explica en castellano claro; señala riesgos y cuestiona sin dar la razón por inercia

## Reglas de diseño (aprobadas; no cambiarlas sin preguntar)

- Máximo dos fuentes: Young Serif (nombre, horas, trayectos) y Familjen Grotesk 500/700 (resto). Todas las horas en Young Serif
- Sin bloques de color blanco ni cajas que tapen la pintura; la legibilidad sale del contraste con la pared
- El nombre de la web nunca pisa la ventanilla (lo verifica `check.py`)
- Texto grande en formato cartel: color papel `#F1EADC` con sombra desplazada `#2D241C`
- Subrayado punteado = «esto se puede pulsar». Úsalo igual en todos los textos interactivos
- Sentido del viaje: dos billetes de tren recortados en papel; el activo muestra el viaje, el otro se levanta para invitar a pulsar
- Sin controles de pausa ni «volver a pintar» para el público. Atajos solo para grabar: R repinta, espacio pausa
- La luz del paisaje y del vagón sigue la hora elegida (amanecer, día, atardecer, noche)
- La estética manda sobre la rapidez, pero la animación no puede ir a tirones
- Respeta `prefers-reduced-motion` (fotograma fijo)

## Técnica

- Un único HTML autocontenido. Three.js r128 desde cdnjs; fuentes desde Google Fonts. Nada más externo
- Paisaje: escena 3D → render target → shader de acuarela (Kuwahara + modelo de pigmento). El vagón se pinta en el mismo shader fuera de la ventanilla (`sdRR` con el rectángulo de `#win`)
- Horarios en minutos desde medianoche; claves `r` (Sants→Reus), `b` (Reus→Sants), `a` (AVE, sin uso aún)
- IDs de parada GTFS: Barcelona-Sants 71801, Reus 71400
- Días sin dato usan el último día conocido del mismo tipo y la web avisa de «horario aproximado»
- Los horarios del GTFS caducan en ~2 semanas: regenera antes de publicar o de grabar
- Edita solo `src/hero.html`; `dist/` se regenera. El marcador `__DATA__` (`const DATA = __DATA__;`) debe seguir existiendo o `build.py` falla
- `check.py` depende de los selectores `.brand`, `#win`, `#info`, `.soon` y `#dep`: si los renombras, actualiza el script
- Flujo en runtime: `build3D()` devuelve `world` (`setTime`, `frame(dx, time, reveal)`) o `null` sin WebGL (la página debe seguir funcionando). `loop()` limita el render a 30 fps y para el `requestAnimationFrame` en pausa o con la pestaña oculta
- `daylight(min)` es la única fuente de luz: define a la vez el cielo del paisaje y los colores de pared, madera y asientos del vagón
- La hora «actual» siempre es la de Europe/Madrid (`madridNow()`), no la del navegador
- Estado de la UI en `state` {dir, useNow, minute}; `render()` lo recalcula todo. Si hoy no quedan trenes, muestra los primeros de mañana
- `extract_trains.py` conserva la clave `a` del fichero anterior y no escribe nada si el feed no devuelve trenes

## Publicación

- Prototipo publicado como artifact de claude.ai: https://claude.ai/artifact/WPG4PK7RoqLePQYZetQRY4
- Para actualizarlo, publica `dist/index.html` sobre esa misma URL (o adjúntalo con `/artifacts`)
