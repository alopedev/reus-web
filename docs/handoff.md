# Handoff · 27 de septiembre de 2026 (tarde)

Todo el contexto necesario está en este repositorio. Decisiones: `docs/plan.md` (registro estético). Producto: `docs/PRD.md`.

## Estado

**Web publicada:** https://reus-web.vercel.app (se despliega en cada push a `main`; ver «Publicación» en `CLAUDE.md`).

**Código:** Vite + TypeScript estricto en módulos (`src/`, mapa en `CLAUDE.md`), Three.js 0.128 y GSAP 3.15 desde npm. Migración completa en `docs/migracion.md`. GitHub Actions pasa tipos, compilación y `check.py` en cada push; `check.py paridad` compara con fotogramas de referencia por sistema (`scripts/baseline/darwin|linux/`).

**Hero:** cerrado a falta del nombre de la web («Nombre» es provisional).

**Transición hero → mesa («La repisa»):** implementada en `src/shelf.ts` (y el lavado en `src/world.ts` + `src/shaders/watercolor.frag`).
- Cambio de plano «cámara que baja» (`pitch()`): pared y mesa comparten la bisagra, que sigue el scroll 1:1. La pared se adelanta, la mesa llega después y rebota un poco hacia arriba al posarse. La pared se oscurece según su ángulo y lleva un margen de sobreescala del 15 %
- Mesa pintada en acuarela al llegar (`src/table.ts` + `src/shaders/table.frag`) + capas vivas (luz de la ventanilla, sombras de árboles, café, boli, gafas, billete de Rodalies, vibración)
- Papeles (`land()`): caen acelerando y con aleteo; la sombra (`--alto`) se separa y aclara con la altura; se asientan con un giro de 1–2°. La tapa del cuaderno (`openLeaf()`) se abre y rebota al quedar plana
- Pantallas apaisadas ≥ 1000 × 780: mesa fija con timeline scrubbeado. Menores: cada papel cae al entrar (triggers por offsets de layout)
- Tarea 3 (referencias para subir la calidad): `docs/referencias/scroll-calidad-transicion.md`. Aplicadas la 1 (ritmo), la 2 (caída con peso) y la 3 (lavado de pigmento en la pared, ver abajo)
- **Referencia 3 · lavado de pigmento:** la sombra de la pared se pinta en su shader (`post`, uniforms `foldY`/`shade`, `world.setWash()`): nace en la bisagra y trepa por toda la pared, ventanilla incluida, según el ángulo; los textos se oscurecen con `--lavado`. `setWash()` repinta solo el pase de pintura, como mucho una vez por frame, para que se vea aunque el bucle del paisaje esté parado. `#sombra` es el fallback sin WebGL
- Prototipos: lienzo Design https://claude.ai/artifact/AQpTBQebv8LaAfEkjYPuiw (páginas «Transición», «Mesa», «Tarea 3 · calidad», «Referencia 3 · lavado» con 3 variantes comparables)

## Siguiente paso

1. Comprobar la web publicada en un móvil real (fluidez, toque en la regla). Revisada ya en Safari del simulador de iOS (28-09): ventanilla panorámica, paisaje ×2 y bisagra con la barra encogida. Pendientes de esa revisión: la barra flotante de Safari tapa el pie del hero, la mesa acaba antes que la página y la repisa pintada bajo la ventanilla se corta en los dos bordes
2. Fase 3 · viaje de letras: **hecho** (`src/letters.ts` + capa `#letras`, ya en `main`). Fase 4 · tren de papel sobre una vía en la mesa: **aparcada** (28-09, decisión de Àlex: el diseño ya es suficientemente espectacular). Para retomarla: prototipo aprobado en la página «Transición»; reutilizar el patrón de `land()` (estado dibujado por un proxy, reversible con scrub) y la sombra según la altura
3. **Nueva prioridad (28-09): producto antes que diseño.** En este orden: (a) generalizar la web a más trayectos: regionales de Renfe en Catalunya y, si se puede gratis y legal, los AVE Barcelona ↔ Camp de Tarragona (investigación en curso); el origen se elige pulsando un billete y el destino pulsando el otro; (b) el nombre; (c) el copy
4. Grabar el vídeo para X y LinkedIn
5. Pendiente técnico: subir Three.js desde r128 (hoy ~186 KB comprimido, casi todo Three entero; las versiones nuevas permiten descartar lo que no se usa). Cambia luz y color: hacerlo con la paridad visual como red y renovar referencias solo si Àlex aprueba el resultado

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

## Pendiente y riesgos

- Nombre de la web (lo decide Àlex)
- Horarios: `data/trains.json` llega hasta el 9 de octubre de 2026; regenerar antes de grabar
- Condiciones de uso de los datos abiertos de Renfe por verificar (probablemente exigen citar la fuente)
- Fase 2 (no empezar sin decisión): actualización diaria automática, precios del AVE, subdominio gratuito, contador de visitas

## Cómo verificar

`python3 scripts/build.py && python3 scripts/check.py` (varios minutos) y revisar las capturas de `screenshots/`.
