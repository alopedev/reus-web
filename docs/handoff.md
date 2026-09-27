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
- **Referencia 3 · lavado de pigmento:** la sombra de la pared se pinta en su shader (`post`, uniforms `foldY`/`shade`, `world.setWash()`): nace en la bisagra y trepa por toda la pared, ventanilla incluida, según el ángulo; los textos se oscurecen con `--lavado`. `setWash()` repinta solo el pase de pintura, como mucho una vez por frame, para que se vea aunque el bucle del paisaje esté parado. `#sombra` es el fallback sin WebGL
- Prototipos: lienzo Design https://claude.ai/artifact/AQpTBQebv8LaAfEkjYPuiw (páginas «Transición», «Mesa», «Tarea 3 · calidad», «Referencia 3 · lavado» con 3 variantes comparables)

## Siguiente paso

1. Fase 3 · viaje de letras («Nombre» → «Qué es» como recortes de papel) y fase 4 · tren de papel sobre una vía en la mesa (prototipo aprobado en la página «Transición»). Reutilizar el patrón de `land()` (estado dibujado por un proxy, reversible con scrub) y la sombra según la altura
2. Grabar el vídeo para X y LinkedIn

## Lecciones técnicas

- Nunca suavizar los ángulos de pared/mesa con un bucle propio: con frames lentos deja ver el fondo. La suavidad va en las curvas
- `check.py` corre con render por software a ~2 fps: los checks nuevos deben esperar a que la bisagra alcance el scroll (`hinge_caught_up`), no un tiempo fijo, y usar `behavior:'instant'`
- Si `check_backstage` detecta el fondo, guarda `screenshots/<vista>-fondo-<pct>.png` y el estado del muro en el mensaje
- La fuga intermitente de `check_backstage` no era de la bisagra, sino de la captura (resuelto en `fa8ba76` + endurecido después). Con `scrollTo(0, y)` el scroll es suave (`scroll-behavior:smooth`) y la espera fija de 1300 ms no bastaba con la máquina cargada: la captura salía de un frame a medio pintar. Firma inequívoca: una franja magenta recta y a todo el ancho, tan alta como el último salto de scroll (128 px = 15 % de 860 en saltos de 15 %, 84 px en el de 85→95 %) e independiente del ángulo de la pared; a veces la captura entera en magenta. No es la misma clase de fallo que el suavizado de ángulos: aquel abría un hueco real entre pared y mesa; este es un frame viejo. La pared, por sí sola, tapa toda la pantalla en cualquier punto del giro (es `fixed` y su escala se calcula con su propia bisagra; margen ≥ 0 comprobado analíticamente de p = 0 a 1)
- Medición: procedimiento viejo 0/6 pasadas limpias; con `behavior:'instant'` + `hinge_caught_up`, 30/30 sin fuga (con otra sesión cargando la CPU). Si la bisagra no alcanza el scroll, `check_backstage` ahora lo dice («the hinge never catches up … frame not read») en vez de leer ese frame
- Si vuelve a salir fondo: mira la captura. Franja recta a todo el ancho con la altura del salto = frame viejo (revisa la espera). Cuña o trapecio que cambia con el ángulo = geometría de `pitch()`
- Ejecutar dos `check.py` (o dos sesiones con Playwright) a la vez duplica la carga del render por software y dispara los checks que esperan un tiempo fijo (`settle`, `check_fall`): mide los flakes con la máquina libre
- Para comprobar colores del hero, lee capturas de pantalla y proyecta los puntos de la pared con su transform (`WALL_AT` en `check.py`); no actives `preserveDrawingBuffer` solo para los tests

## Pendiente y riesgos

- Nombre de la web (lo decide Àlex)
- Probar fluidez en un móvil real (solo probado con render por software)
- Horarios: `data/trains.json` llega hasta el 9 de octubre de 2026; regenerar antes de grabar
- Condiciones de uso de los datos abiertos de Renfe por verificar (probablemente exigen citar la fuente)
- Fase 2 (no empezar sin decisión): actualización diaria automática, precios del AVE, subdominio gratuito, contador de visitas

## Cómo verificar

`python3 scripts/build.py && python3 scripts/check.py` (varios minutos) y revisar las capturas de `screenshots/`.
