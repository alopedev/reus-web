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

1. Comprobar la web publicada en un móvil real (fluidez, toque en la regla)
2. Fase 3 · viaje de letras: **hecho** (`src/letters.ts` + capa `#letras`, rama `fase3-letras`). Fase 4 · tren de papel sobre una vía en la mesa (prototipo aprobado en la página «Transición»). Reutilizar el patrón de `land()` (estado dibujado por un proxy, reversible con scrub) y la sombra según la altura
3. Grabar el vídeo para X y LinkedIn
4. Pendiente técnico: subir Three.js desde r128 (hoy ~186 KB comprimido, casi todo Three entero; las versiones nuevas permiten descartar lo que no se usa). Cambia luz y color: hacerlo con la paridad visual como red y renovar referencias solo si Àlex aprueba el resultado

## Lecciones técnicas

- Nunca suavizar los ángulos de pared/mesa con un bucle propio: con frames lentos deja ver el fondo. La suavidad va en las curvas
- `check.py` corre con render por software a ~2 fps: los checks nuevos deben esperar a que la bisagra alcance el scroll (`hinge_caught_up`), no un tiempo fijo, y usar `behavior:'instant'`
- Si `check_backstage` detecta el fondo, guarda `screenshots/<vista>-fondo-<pct>.png` y el estado del muro en el mensaje
- La fuga intermitente de `check_backstage` no era de la bisagra, sino de la captura (resuelto en `fa8ba76` + endurecido después). Con `scrollTo(0, y)` el scroll es suave (`scroll-behavior:smooth`) y la espera fija de 1300 ms no bastaba con la máquina cargada: la captura salía de un frame a medio pintar. Firma inequívoca: una franja magenta recta y a todo el ancho, tan alta como el último salto de scroll (128 px = 15 % de 860 en saltos de 15 %, 84 px en el de 85→95 %) e independiente del ángulo de la pared; a veces la captura entera en magenta. No es la misma clase de fallo que el suavizado de ángulos: aquel abría un hueco real entre pared y mesa; este es un frame viejo. La pared, por sí sola, tapa toda la pantalla en cualquier punto del giro (es `fixed` y su escala se calcula con su propia bisagra; margen ≥ 0 comprobado analíticamente de p = 0 a 1)
- Medición: procedimiento viejo 0/6 pasadas limpias; con `behavior:'instant'` + `hinge_caught_up`, 30/30 sin fuga (con otra sesión cargando la CPU). Si la bisagra no alcanza el scroll, `check_backstage` ahora lo dice («the hinge never catches up … frame not read») en vez de leer ese frame
- Si vuelve a salir fondo: mira la captura. Franja recta a todo el ancho con la altura del salto = frame viejo (revisa la espera). Cuña o trapecio que cambia con el ángulo = geometría de `pitch()`
- Ejecutar dos `check.py` (o dos sesiones con Playwright) a la vez duplica la carga del render por software y dispara los checks que esperan un tiempo fijo (`settle`, `check_fall`): mide los flakes con la máquina libre
- Para comprobar colores del hero, lee capturas de pantalla y proyecta los puntos de la pared con su transform (`WALL_AT` en `check.py`); no actives `preserveDrawingBuffer` solo para los tests
- `will-change` nunca sobre el elemento que hace un flip 3D (`rotateY` + `backface-visibility:hidden`): promocionarlo a su propia capa confunde el backface culling bajo compositor por software (reproducido en un HTML suelto, sin nada del proyecto: con `will-change` en el flipper se ve la cara frontal espejada en vez de la trasera). `will-change` sí es seguro en hijos que no llevan el giro (p. ej. la sombra de una ficha)
- Un elemento con `transition` propia (como `.top`/`.info`, que entran con `translateY`/`opacity` al terminar el pintado del paisaje) no cambia al instante aunque le fuerces un `style.transform` distinto: la transición se dispara igual. Para medir su geometría "en reposo" antes de que la transición haya terminado, pon también `transition:none` a la vez que el valor forzado (y restaura ambos después) — si no, el valor leído queda a medio camino y varía con cuánto ha corrido la transición real
- Al proyectar un punto a través de un `transform` con `position:fixed` (como `#hero`) su posición «en reposo» es independiente del scroll; el mismo truco sobre un elemento en flujo normal (`#repisa`) no lo es — hay que cachear la posición relativa a su propio top/left, no la posición absoluta de pantalla en el momento de medir, o el resultado deriva cientos de píxeles en cuanto cambia el scroll

## Pendiente y riesgos

- Nombre de la web (lo decide Àlex)
- Horarios: `data/trains.json` llega hasta el 9 de octubre de 2026; regenerar antes de grabar
- Condiciones de uso de los datos abiertos de Renfe por verificar (probablemente exigen citar la fuente)
- Fase 2 (no empezar sin decisión): actualización diaria automática, precios del AVE, subdominio gratuito, contador de visitas

## Cómo verificar

`python3 scripts/build.py && python3 scripts/check.py` (varios minutos) y revisar las capturas de `screenshots/`.
