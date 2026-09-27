# Handoff · 27 de septiembre de 2026

Todo el contexto necesario está en este repositorio. Decisiones: `docs/plan.md` (registro estético). Producto: `docs/PRD.md`.

## Estado

**Hero:** cerrado a falta del nombre de la web («Nombre» es provisional).

**Transición hero → mesa («La repisa»):** implementada en `src/hero.html` y publicada (https://claude.ai/artifact/WPG4PK7RoqLePQYZetQRY4).
- Cambio de plano «cámara que baja» (`pitch()`): pared y mesa comparten la bisagra, que sigue el scroll 1:1. La pared se adelanta, la mesa llega después y rebota un poco hacia arriba al posarse. La pared se oscurece según su ángulo y lleva un margen de sobreescala del 15 %
- Mesa pintada en acuarela al llegar (`TABLE_FRAG`) + capas vivas (luz de la ventanilla, sombras de árboles, café, boli, gafas, billete de Rodalies, vibración)
- Papeles (`land()`): caen acelerando y con aleteo; la sombra (`--alto`) se separa y aclara con la altura; se asientan con un giro de 1–2°. La tapa del cuaderno (`openLeaf()`) se abre y rebota al quedar plana
- Pantallas apaisadas ≥ 1000 × 780: mesa fija con timeline scrubbeado. Menores: cada papel cae al entrar (triggers por offsets de layout)
- Tarea 3 (referencias para subir la calidad): `docs/referencias/scroll-calidad-transicion.md`. Aplicadas la 1 (ritmo), la 2 (caída con peso) y la 3 (lavado de pigmento en la pared, ver abajo)
- **Referencia 3 · lavado de pigmento (implementada):** `#sombra` (el velo plano de interfaz) ya no oscurece la pared con WebGL disponible; se mantiene solo como fallback sin WebGL. En su lugar, `pitch()` pasa `foldY` (= `p`, la bisagra en coordenadas de la pared) y `shade` (progreso según el ángulo, misma fórmula que antes) al shader `post` de `src/hero.html`; en la rama de la pared (`sdW >= 0`) un frente continuo `uv.y - foldY`, roto por `fbm` 2D, oscurece `col` con un borde más marcado (`ring`) — mismo modelo de pigmento que ya pinta la pared, sin capa DOM aparte. `world.setWash(foldY, shade)` repinta solo el post-pase (reutiliza la escena 3D ya renderizada en el render target) para que el lavado se vea aunque el bucle esté parado (pausa, `prefers-reduced-motion`, fuera de vista): es función directa del scroll, sin suavizado propio. El renderer principal ahora lleva `preserveDrawingBuffer:true` (lo necesita el check de `readPixels`)
- Prototipos: lienzo Design https://claude.ai/artifact/AQpTBQebv8LaAfEkjYPuiw (páginas «Transición», «Mesa», «Tarea 3 · calidad», «Referencia 3 · lavado» con 3 variantes comparables)

## Siguiente paso

1. Fase 3 · viaje de letras («Nombre» → «Qué es» como recortes de papel) y fase 4 · tren de papel sobre una vía en la mesa (prototipo aprobado en la página «Transición»). Reutilizar el patrón de `land()` (estado dibujado por un proxy, reversible con scrub) y la sombra según la altura
2. Grabar el vídeo para X y LinkedIn
3. Investigar la fuga intermitente de `check_backstage` (ver «Riesgos» abajo): no es nueva de esta sesión, pero conviene resolverla antes de grabar

## Lecciones técnicas

- Nunca suavizar los ángulos de pared/mesa con un bucle propio: con frames lentos deja ver el fondo. La suavidad va en las curvas
- `check.py` corre con render por software a ~2 fps: los checks nuevos deben esperar a que la bisagra alcance el scroll (`hinge_caught_up`), no un tiempo fijo, y usar `behavior:'instant'`
- Si `check_backstage` detecta el fondo, guarda `screenshots/<vista>-fondo-<pct>.png` y el estado del muro en el mensaje
- El canvas principal (`#gl`) puede crear un contexto `webgl2` aunque `THREE.WebGLRenderer` se pida como `webgl`: para leer sus píxeles desde Playwright, prueba `getContext('webgl') || getContext('webgl2')`

## Pendiente y riesgos

- Nombre de la web (lo decide Àlex)
- **`check_backstage` es intermitente y ya lo era antes de esta sesión:** en 6 pasadas seguidas de escritorio contra el `hero.html` previo a esta tarea (`HEAD~1`, sin tocar) solo 2/6 salieron limpias (fuga de fondo en magenta en distintos puntos del scroll, sobre todo 40–95 %); con el lavado de pigmento salió 1/6 en la misma prueba y 5/6 en otra. La tasa es parecida (dentro del ruido de 6 pasadas), así que no parece que esta tarea la agrave, pero tampoco la soluciona: sigue pendiente de raíz. No se ha tocado la geometría de `pitch()` para intentar arreglarla, según lo acordado
- Probar fluidez en un móvil real (solo probado con render por software)
- Horarios: `data/trains.json` llega hasta el 9 de octubre de 2026; regenerar antes de grabar
- Condiciones de uso de los datos abiertos de Renfe por verificar (probablemente exigen citar la fuente)
- Fase 2 (no empezar sin decisión): actualización diaria automática, precios del AVE, subdominio gratuito, contador de visitas

## Cómo verificar

`python3 scripts/build.py && python3 scripts/check.py` (varios minutos) y revisar las capturas de `screenshots/`.
