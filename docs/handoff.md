# Handoff · 28 de septiembre de 2026 (noche)

Todo el contexto necesario está en este repositorio. Decisiones: `docs/plan.md` (registro estético). Producto: `docs/PRD.md` v0.2.

## Estado

**Web publicada:** https://reus-web.vercel.app (se despliega en cada push a `main`; ver «Publicación» en `CLAUDE.md`).

**Código:** Vite + TypeScript estricto en módulos (`src/`, mapa en `CLAUDE.md`), Three.js 0.128 y GSAP 3.15 desde npm. GitHub Actions pasa tipos, compilación y `check.py` en cada push; `check.py paridad` compara con fotogramas de referencia por sistema (`scripts/baseline/darwin|linux/`).

**Datos:** la web lee `data/red.json` (regionales R11, R13–R17 y AVE/Avlo Sants ↔ Camp de Tarragona, 14 días; contrato en `docs/referencias/datos-red-contrato.md`), regenerado cada día por `.github/workflows/horarios.yml`. `src/time.ts`: `direct(fecha, desde, hasta)`; `dayData` da Sants ↔ Reus (`r`/`b`) y, para Baix Camp y Tarragonès, el AVE (`ar`/`ab`).

**Hero (paso 3.2, hecho):** «Capacasa» · «El tren a casa, y de vuelta a Barcelona». Un único billete «Billete · Sants ⇄ Reus» (⇄ cambia el sentido; los extremos son texto hasta 3.3/3.5). Tablero de 3 trayectos: 2 regionales + el próximo AVE, «R15 10:03 en 3 min → 11:33», todos pulsables; elegido, el AVE pasa a ser el tren grande. Regla con una marca: la bolita sobre el tren grande, «ahora» es una rayita naranja; el AVE en la regla con la misma raya que los regionales. De Reus por la noche, sin regionales pero con AVE, ese AVE va primero y detrás los regionales de mañana. Check 15 de `check.py` (`python3 scripts/check.py hero`).

**Transición hero → mesa y viaje de letras:** hechos (`src/shelf.ts`, `src/letters.ts`). Con «Capacasa», tres letras se funden en el hueco de «Qué es».

## Siguiente paso

1. **3.3 · selector de pueblo:** lista por corredor (4 grupos: R11 · R13 · R14+R15 · R16+R17) y tira de estaciones de la línea con el ramal al final. Pulsar el pueblo del billete lo abre. Referencia visual: rama desechable `prototipo/selector-pueblo` (`?variant=B&regla=1&sub=2`; nunca a `main`, reescribir sin copiar)
2. 3.4 · recordar el trayecto + URL · 3.5 · estación de Barcelona (Sants, Passeig de Gràcia, El Clot, França) desde el billete
3. Generalizar la mesa: folleto «Cómo leerla» (aún habla de dos billetes), cuaderno «Barcelona ↔ Reus», billete de Rodalies, «Qué es»
4. Grabar el vídeo para X y LinkedIn
5. Pendiente técnico: subir Three.js desde r128, con la paridad visual como red

## Lecciones técnicas

- Nunca suavizar los ángulos de pared/mesa con un bucle propio: con frames lentos deja ver el fondo. La suavidad va en las curvas
- `check.py` corre con render por software a ~2 fps: los checks nuevos deben esperar a que la bisagra alcance el scroll (`hinge_caught_up`), no un tiempo fijo, y usar `behavior:'instant'`
- En Safari de iOS, `innerHeight` no es la altura de reposo de la mesa: la barra se encoge al hacer scroll y `innerHeight` crece (40 pt en un iPhone 17 Pro) mientras `#repisa` sigue a `100svh`. La bisagra (`dropped`/`hingeAt`) usa `#repisa.offsetTop`, leído en `resize`. En Chromium de escritorio son iguales: `check_toolbar` lo simula bajando la mesa 40 px. Para ver la web en iOS: simulador + `xcrun simctl openurl <udid> http://127.0.0.1:<puerto>` (comparte la red del Mac)
- Si `check_backstage` detecta el fondo, guarda `screenshots/<vista>-fondo-<pct>.png` y el estado del muro en el mensaje
- La fuga intermitente de `check_backstage` no era de la bisagra, sino de la captura (resuelto en `fa8ba76` + endurecido después). Con `scrollTo(0, y)` el scroll es suave (`scroll-behavior:smooth`) y la espera fija de 1300 ms no bastaba con la máquina cargada: la captura salía de un frame a medio pintar. Firma inequívoca: una franja magenta recta y a todo el ancho, tan alta como el último salto de scroll (128 px = 15 % de 860 en saltos de 15 %, 84 px en el de 85→95 %) e independiente del ángulo de la pared; a veces la captura entera en magenta. No es la misma clase de fallo que el suavizado de ángulos: aquel abría un hueco real entre pared y mesa; este es un frame viejo. La pared, por sí sola, tapa toda la pantalla en cualquier punto del giro (es `fixed` y su escala se calcula con su propia bisagra; margen ≥ 0 comprobado analíticamente de p = 0 a 1)
- Medición: procedimiento viejo 0/6 pasadas limpias; con `behavior:'instant'` + `hinge_caught_up`, 30/30 sin fuga (con otra sesión cargando la CPU). Si la bisagra no alcanza el scroll, `check_backstage` ahora lo dice («the hinge never catches up … frame not read») en vez de leer ese frame
- Si vuelve a salir fondo: mira la captura. Franja recta a todo el ancho con la altura del salto = frame viejo (revisa la espera). Cuña o trapecio que cambia con el ángulo = geometría de `pitch()`
- Ejecutar dos `check.py` (o dos sesiones con Playwright) a la vez duplica la carga del render por software y dispara los checks que esperan un tiempo fijo (`settle`, `check_fall`): mide los flakes con la máquina libre
- Para comprobar colores del hero, lee capturas de pantalla y proyecta los puntos de la pared con su transform (`WALL_AT` en `check.py`); no actives `preserveDrawingBuffer` solo para los tests
- `will-change` nunca sobre el elemento que hace un flip 3D (`rotateY` + `backface-visibility:hidden`): promocionarlo a su propia capa confunde el backface culling bajo compositor por software (reproducido en un HTML suelto, sin nada del proyecto: con `will-change` en el flipper se ve la cara frontal espejada en vez de la trasera). `will-change` sí es seguro en hijos que no llevan el giro (p. ej. la sombra de una ficha)
- Un elemento con `transition` propia (como `.top`/`.info`, que entran con `translateY`/`opacity` al terminar el pintado del paisaje) no cambia al instante aunque le fuerces un `style.transform` distinto: la transición se dispara igual. Para medir su geometría "en reposo" antes de que la transición haya terminado, pon también `transition:none` a la vez que el valor forzado (y restaura ambos después) — si no, el valor leído queda a medio camino y varía con cuánto ha corrido la transición real
- Al proyectar un punto a través de un `transform` con `position:fixed` (como `#hero`) su posición «en reposo» es independiente del scroll; el mismo truco sobre un elemento en flujo normal (`#repisa`) no lo es — hay que cachear la posición relativa a su propio top/left, no la posición absoluta de pantalla en el momento de medir, o el resultado deriva cientos de píxeles en cuanto cambia el scroll
- Bajo software rendering, mezclar `rotateY` (el volteo) con `rotateZ`/`scale` en la ÚNICA matriz de un elemento confunde el backface culling: la cara frontal se ve espejada en vez de ocultarse. El volteo debe vivir en su propio hijo (`.flip`) con solo `rotateY`, dejando `rotateZ`/`scale`/`perspective` en el padre — así la sombra tampoco hereda el giro y su offset nunca sale espejado a media vuelta. Además, una ficha cuya cara trasera queda vacía (una letra que se funde en el hueco) mejor que nunca voltee: si no hay letra que enseñar, no hay volteo — la cara frontal simplemente se desvanece con `gone`, evitando el caso límite de una cara trasera sin contenido
- Un rectángulo o mancha rara junto a una ficha durante el scroll puede no ser un bug de la ficha: compruébalo poniendo `#letras{display:none}` a mano en devtools/Playwright antes de asumir que es tuyo — si sigue ahí, es un objeto ya existente de la mesa que coincide en pantalla por casualidad
- `innerWidth` incluye el ancho de una scrollbar clásica (no overlay); `document.documentElement.clientWidth` no. Un `position:fixed;inset:0` (como `#hero`) se mide con `innerWidth` (su containing block es el viewport completo, scrollbar incluida); un bloque en flujo normal sin ancho explícito (como `#repisa`) se mide con `clientWidth` (su containing block es el `body`, ya recortado) — el mismo motivo por el que `table.ts` ya usa `esc.clientWidth` y no `innerWidth`
- `git pull`/`push` dan «Repository not found» salvo con la cuenta `alopedev`: usa el procedimiento de `CLAUDE.md` › Publicación también para `pull`, y vuelve a `alex-olive_raona`
- Antes de cada commit, `git status`: un `git rm` ya preparado se cuela en el commit siguiente
- Capturas con Playwright: `reduced_motion="reduce"` + `page.clock.set_fixed_time(...)` (`clock.install` bloquea `screenshot`); fuerza `.top,.info{opacity:1;transition:none}` para no capturar antes de la entrada
- Verifica los datos contando, no solo leyendo: la revisión por subagente no vio un tren duplicado entre feeds ni pueblos descartados en silencio
- La paridad de `escritorio-mesa` fallaba a ratos en CI con dos estados fijos (media 0,12 / 4,4): la mesa se mide al arrancar (el IntersectionObserver la da por visible porque `.escena` empieza justo en el borde inferior, a 100svh, y la intersección de borde cuenta), a menudo antes de que lleguen Karla y Young Serif. En Linux la fuente de reserva (DejaVu, más ancha) parte el texto de los papeles de otra forma, y los objetos de viaje (boli, Rodalies, gafas) y el tamaño del lienzo se quedaban con esa medida. En macOS la reserva apenas cambia los saltos, por eso no se veía. Ahora un `ResizeObserver` sobre `.escena` y los hijos de `.mesa` recoloca los objetos al instante y repinta el lienzo (con el mismo retardo de 200 ms que `resize`). Check 16 (`check.py mesa`): reflujo forzado del texto tras pintar y comparación con una medida fresca
- Python no descarga de Renfe en esta máquina (SSL); `curl` sí. `extract_red.py --fomento/--avld RUTA --desde AAAA-MM-DD` regenera en local


## Pendiente y riesgos

- La referencia de Linux `scripts/baseline/linux/escritorio-mesa.png` retrata el estado erróneo (boli pisando el cuaderno, Rodalies y gafas ~30–50 px más abajo, crédito antiguo «Fuente: Renfe, datos abiertos (GTFS)»). Con el fix, CI dará siempre el estado correcto y fallará contra ella: hay que renovarla (con aprobación de Àlex)
- La mesa se pinta al cargar, tapada por el hero, no «la primera vez que se ve» como dice `table.ts`: la intersección de borde de `.escena` (a 100svh) cuenta como visible. El pintado en acuarela no se llega a ver en escritorio. Sin tocar: cambia lo que se ve
- Robot diario: si `red.json` falla su check, tampoco se publica `trains.json`. Claude recomendó dejarlo así; Àlex no ha respondido
- Accesibilidad visible sin propuesta: la barra de Safari tapa el pie del hero (`safe-area-inset` no llega a `#hero` fijo) y el contraste de las etiquetas pequeñas de la regla (~4,2:1)
- En el tablero, pulsar un trayecto de mañana muestra el de hoy a esa hora (heredado del hero anterior); con la vista de mañana la bolita se queda en «ahora»
- En móvil, «Camp de Tarragona, en 47 min» ocupa tres líneas en la fila grande del AVE nocturno

## Cómo verificar

`npm run check` (varios minutos) y revisar las capturas de `screenshots/`. Modos rápidos: `python3 scripts/check.py hero|a11y|letras|red|paridad|mesa`.
