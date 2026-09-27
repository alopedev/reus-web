# Referencias · viaje de letras (fase 3, 27-09-2026)

Amplía `scroll-transiciones.md` y `scroll-calidad-transicion.md`. Aquí no se busca solo calidad de movimiento sino cómo resolver, con GSAP núcleo + ScrollTrigger (sin SplitText/Flip/MotionPath), el reparto letra-a-letra entre `h1.brand` y `h2#qe`, la medición bajo los `transform` 3D de `pitch()`, y el material «recorte de papel». URLs comprobadas por cuatro sub-agentes el 27-09-2026; se marca qué se vio abriendo la fuente y qué se dedujo combinando varias.

## Punto de partida (qué le falta al prototipo aprobado)

- `Escena.dc.html` ya resuelve el viaje con una función pura `f(p)` (proxy dibujado a mano, como `land()` en `shelf.ts`): arco `Math.sin(π·t)·260`, ficha de dos caras `rotateY 0→180`, escalonado `0,035·i`. Falta hacerlo genérico: el emparejado letra-a-letra y la altura de salida (`sy = 20 − wallAt(start)·760`) están escritos a mano para «Nombre»→«Qué es»
- `pitch()` inclina `#hero` y `#repisa` con `transform` dinámico; cualquier capa de fichas anidada dentro de cualquiera de los dos deja de comportarse como `fixed` respecto al viewport en cuanto arranca el scroll (ver MDN, containing block, abajo) — necesita vivir en una capa nueva, hermana de ambos
- `.escena` tiene `overflow:hidden` incondicional: una ficha volante dentro de `#repisa` vería su arco recortado
- El viaje grande debe caber en `p∈[0,1]` (el primer `100vh` de scroll, el mismo tramo que gobierna `pitch()`), no en la fase de caída de los tres papeles, que empieza después con `p` ya saturado en 1

## Referencias verificadas

### 1 · Emparejar identidades sin tocarlas a mano — el patrón de Flip
- GSAP Flip, documentación oficial — https://gsap.com/docs/v3/Plugins/Flip/
- Codrops, *Building an Infinite GSAP Scroll Gallery with Parallax and Flip Transitions* (30-07-2026) — https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/
- Qué se vio: Flip liga dos elementos **distintos** del DOM con un `data-flip-id` compartido y anima entre sus `getBoundingClientRect()`; la doc dice explícitamente que está pensado para *"state-to-state layout transitions"*, no para vuelos con arco ni para el flip de tarjeta de dos caras
- Qué tomamos: el mecanismo de identidad compartida (aquí, `data-pair` por **índice de posición**, no por letra semántica), sin la dependencia. Ninguna demo consultada empareja por letra igual→igual; todas emparejan por índice y dejan que la cara trasera resuelva la discrepancia visual — confirma que la ficha de dos caras del prototipo ya es la solución correcta al problema de «Nombre» ≠ «Qué es»
- Descartado: añadir Flip. No aporta nada que el prototipo no resuelva ya con 15 líneas propias, y mantiene la decisión de plan.md (~40 KB ahorrados)

### 2 · El código real que resuelve scrub + reversibilidad + resize
- Codrops, *Consecutive scroll animations with one element* — https://tympanus.net/codrops/2024/11/20/consecutive-scroll-animations-with-one-element/
- Código fuente de la demo, leído vía raw.githubusercontent.com — https://github.com/codrops/OneElementScroll/blob/main/js/index.js
- Qué se vio: mide una vez con `Flip.getState()` antes de construir el timeline (no en cada frame de scroll); usa `gsap.context()` + `.revert()` en el listener de `resize` para recalcular todo sin fugas ni timelines duplicados; encadena tramos con offsets relativos (`'+=0.5'`) en vez de tiempos absolutos, así el solape se mantiene si cambia el número de pasos; el primer tramo usa `ease:'none'` (sigue el dedo crudo) y los siguientes `sine.inOut`
- Qué tomamos: el patrón entero sin Flip — medir offsets una vez, `context().revert()` en resize (es la pieza que falta formalizar para «recalibrar con el nombre definitivo», que es un resize conceptual), y `stagger` con offsets relativos en vez de la tabla `0,06+i·0,035` fija
- Coste/riesgo: bajo. Es reestructurar el propio timeline del prototipo, no una dependencia nueva

### 3 · Two-sided flip y texto 3D con CSS puro
- Codrops, *Creating 3D Scroll-Driven Text Animations with CSS and GSAP* (04-11-2025, David Faure) — https://tympanus.net/codrops/2025/11/04/creating-3d-scroll-driven-text-animations-with-css-and-gsap/
- Codrops, *Bringing Letters to Life: Coding a Kinetic SVG Typography Animation* (2023) — https://tympanus.net/codrops/2023/01/31/bringing-letters-to-life-coding-a-kinetic-svg-typography-animation/
- MDN, `backface-visibility` — https://developer.mozilla.org/en-US/docs/Web/CSS/backface-visibility
- Qué se vio: el artículo de Faure logra el cartel↔recorte con `backface-visibility:hidden` + `transform-style:preserve-3d` puro (sin JS por frame más allá de fijar el ángulo) y anima **palabras**, no letras — dato relevante: partir por letra no es obligatorio para que el efecto se lea bien. El de SVG usa `<textPath>`/`foreignObject`, útil solo como moodboard de tipografía cinética, no como técnica (SVG no aporta nada sobre el HTML que ya tenemos resuelto en `rem`)
- Qué tomamos: la técnica de la ficha de dos caras del prototipo ya es exactamente esta receta estándar, barata en compositor GPU. `backface-visibility` es «Baseline: widely available» desde marzo 2022
- Descartado: mover el texto a SVG

### 4 · Ritmo del vuelo: stagger, arco, easing
- GreenSock, *Staggers* (docs oficiales) — https://gsap.com/resources/getting-started/Staggers/
- Codrops, *Building a Scroll-Driven Dual-Wave Text Animation with GSAP* (15-01-2026) — https://tympanus.net/codrops/2026/01/15/building-a-scroll-driven-dual-wave-text-animation-with-gsap/
- Interaction Design Foundation, *UI Animation — 12 principios de Disney* — https://ixdf.org/literature/article/ui-animation-how-to-apply-disney-s-12-principles-of-animation-to-ui-design
- Material Design 3, *Easing and duration* — https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
- Apple HIG, *Motion* — https://developers.apple.com/design/human-interface-guidelines/foundations/motion
- Qué se vio: la guía de Staggers confirma que un `stagger.each` pequeño frente a la duración de cada elemento produce solape masivo, no una cola independiente — con 6 letras y el `0,035+ventana 0,3` del prototipo, la letra 6 arranca dentro de la ventana de vuelo de la letra 1. IxDF cita *arcs* (nunca líneas rectas) y *slow-in slow-out*, sin valores numéricos. M3 y Apple coinciden en «acelerar rápido, llegar despacio» (M3 con curva asimétrica emphasized, pensada para paneles que entran y se quedan, no para un arco simétrico de ida y vuelta). El artículo Dual-Wave usa `gsap.quickTo()` para no crear un tween nuevo por frame cuando varias letras se actualizan desde un único `onUpdate`
- Qué tomamos: mantener el arco `Math.sin(π·t)` (sustituto barato de MotionPath, ya descartado) y el in-out cúbico simétrico (más correcto aquí que el emphasized de M3); usar `quickTo` si se coordinan muchas letras desde un `onUpdate` tipo proxy, como ya hace `land()`
- Descartado: curvas asimétricas tipo M3 emphasized para el arco (están pensadas para otro tipo de movimiento)

### 5 · Caída con peso y sombra según altura (ya validado, se reutiliza)
- Codrops, *Ponpon Mania: How WebGL and GSAP Bring a Comic Sheep's Dream to Life* (07-10-2025) — https://tympanus.net/codrops/2025/10/07/ponpon-mania-how-webgl-and-gsap-bring-a-comic-sheeps-dream-to-life/
- Awwwards, ficha SOTD y case study — https://www.awwwards.com/sites/ponpon-mania y https://www.awwwards.com/ponpon-mania-a-comic-that-breathes-through-web-interaction.html
- Qué se vio: la sombra dura se separa y aclara con la altura del objeto en el aire; el asentamiento se pasa 1–2° y vuelve, nunca rebote de dibujos animados — ya documentado en `scroll-calidad-transicion.md` y ya implementado en `land()` (`shelf.ts`) vía `--alto = 1 − k.u^1.4`
- Qué tomamos: reutilizar literalmente la misma variable `--alto` para las letras (no inventar una curva de sombra nueva), y el mismo orden de magnitud de overshoot (1,5–2° en `rotateZ`, escala 1,03→1,00)

### 6 · Medir bajo `transform` 3D sin romper el fondo
- MDN, *Containing block* — https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block
- MDN, `DOMMatrix` — https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix
- MDN, `Range.getClientRects()` — https://developer.mozilla.org/en-US/docs/Web/API/Range/getClientRects
- Qué se vio: un ancestro con `transform`/`filter`/`will-change:transform` se convierte en el *containing block* de sus descendientes `position:fixed` (confirma el riesgo del punto de partida: la capa de fichas no puede vivir dentro de `#hero`/`.stage`, que llevan `filter` cuando el lavado de pigmento está activo). `DOMMatrix`/`getComputedStyle().transform` permiten proyectar un punto a través de una cadena de transforms, pero exige multiplicar matrices de todos los ancestros a mano. `Range.getClientRects()` mide un nodo de texto sin partirlo en spans, preservando el kerning
- Qué tomamos: medir con **offsets de layout** (`offsetLeft`/`offsetTop` subiendo por `offsetParent`), el mismo mecanismo que `pageTop()` ya usa en `shelf.ts` con el comentario explícito de que evita leer la caja ya rotada por `pitch()`. Para el aspecto 3D del vuelo, exportar el ángulo `wall`/`table` de `pitch()` (igual que ya se exportan `dropped`/`hingeAt`) y dárselo a la ficha en vez de multiplicar matrices: la propia CSS engine proyecta si se le da el mismo `rotateX`
- Descartado: `DOMMatrix` para proyección exacta (más código, más coste por frame, sin garantía de que se note); `getBoxQuads` (no estándar, solo Firefox)

### 7 · Accesibilidad al partir texto
- GSAP SplitText, documentación oficial — https://gsap.com/docs/v3/Plugins/SplitText/
- MDN, `aria-hidden` — https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden
- Qué se vio: SplitText admite sin rodeos que partir en spans **rompe el kerning** (*"the spacing shifts slightly"*) y por eso pone `aria-label` en el contenedor + `aria-hidden` en los hijos partidos — el mismo patrón documentado por MDN para contenido decorativo/duplicado
- Qué tomamos: no partir `h1.brand`/`h2#qe` de forma permanente. Dejarlos intactos (con su kerning normal) y montar un clon `aria-hidden="true"` solo durante la ventana de vuelo; el `h1`/`h2` real solo se hace invisible **visualmente** (nunca `visibility:hidden`, que los saca del árbol de accesibilidad en todos los motores actuales)

### 8 · Fuentes y re-medición
- MDN, `FontFaceSet.ready` — https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready
- Qué se vio: es una `Promise` que resuelve cuando el documento ha terminado de cargar fuentes y el layout dependiente de ellas ya está listo
- Qué tomamos: esperar `document.fonts.ready` una vez al arrancar, antes de la primera medición de origen/destino (Young Serif tarda en llegar de Google Fonts; medir antes daría posiciones con la fuente de reserva). Re-medir en el mismo listener de `resize` que ya usa `pitch()`

## Tecnología elegida y descartada

- **Elegido: GSAP núcleo + ScrollTrigger, proxy a mano, sin plugins nuevos.** Ninguna fuente consultada da un argumento de peso para revertir la decisión de plan.md. Confirmado también por el informe de tecnología nativa y el de código: la metodología (offsets de layout para medir bajo transform, proxy reversible con scrub) ya existe en `shelf.ts`, no hay que inventarla
- **Descartado: GSAP Flip.** Pensado para transiciones de layout, no para arcos ni flips de tarjeta; su patrón de identidad compartida (`data-flip-id`) se copia en espíritu con `data-pair`, sin la dependencia
- **Descartado: SplitText.** Rompe kerning por diseño propio (admitido en su doc); se sustituye por un clon decorativo temporal + medición con spans de usar y tirar (o `Range`, más preciso pero más código — con nombres cortos como «Nombre»/«Qué es» la diferencia es cosmética)
- **Descartado: MotionPath.** Ya descartado en plan.md; el arco `Math.sin(π·t)` es el sustituto barato y ya validado en el prototipo
- **Descartado: CSS `animation-timeline: view()/scroll()`.** Soporte ~87% (Chrome/Edge 115+, Safari 26, Firefox rezagado) exigiría de todos modos un fallback JS; la trayectoria (arco, flip, reparto por letra) es demasiado dinámica para expresarse en `@keyframes` declarativos sin generarlos también desde JS — pierde la ventaja de «cero JS» que justifica la técnica
- **Descartado: View Transitions API.** Mecanismo de un solo disparo (`document.startViewTransition()`), sin scrubbing continuo ni reversibilidad frame a frame — incompatible con «sigue el dedo»
- **Descartado: SVG `<textPath>`/`foreignObject`.** No aporta nada sobre HTML+CSS ya resuelto en `rem`; complicaría el layout
- **Descartado: `DOMMatrix` para proyección exacta de la ficha a través de la pared 3D.** Más código y CPU por frame sin garantía de mejora perceptible; el prototipo aprobado ya funciona bien con la aproximación «heredar el ángulo de `pitch()` y relajarlo a 0»
- **Elegido: capa `position:fixed` nueva, hermana de `#hero` y `#repisa` bajo `<body>`.** Es la única ubicación que no hereda ningún `transform`/`filter` de `pitch()` ni queda recortada por el `overflow:hidden` de `.escena`

## Checklist de calidad (para el viaje de letras específicamente)

1. Medir origen y destino con offsets de layout, nunca `getBoundingClientRect()` mientras pared/mesa estén inclinadas
2. Emparejar por índice de posición, no por letra semántica; resolver sobrantes con fundido (nunca viaje forzado a un hueco que no existe)
3. Split del vuelo: ~82 % en cúbico in-out (tramo aéreo) / ~18 % de asentamiento con overshoot de 1,5–2° en `rotateZ` y escala 1,03→1,00 — mismo lenguaje que `land()`
4. El volteo `rotateY` termina antes que el asentamiento (p. ej. al 70 % de la ventana de la letra), para que el overshoot final sea solo `rotateZ`/escala sobre una cara ya fija
5. La sombra reutiliza `--alto` tal cual está definida en `shelf.ts`, no una curva nueva
6. `will-change:transform,opacity` solo durante la ventana de vuelo de cada ficha, quitado (`auto`) al aterrizar
7. Recalcular todo (`context().revert()` o equivalente) en `resize` y al cambiar el nombre definitivo — es el mismo evento conceptual
8. `document.fonts.ready` antes de la primera medición
9. `prefers-reduced-motion`: no crear el `ScrollTrigger` de vuelo en absoluto; pintar directamente `h1`/`h2` en su estado final
10. Nunca `visibility:hidden` sobre `h1.brand`/`h2#qe` reales; ocultarlos solo visualmente para no romper el árbol de accesibilidad
11. Nada de `filter` animado por letra ni capas `mix-blend`; solo `transform`/`opacity` (regla ya vigente en el proyecto)
