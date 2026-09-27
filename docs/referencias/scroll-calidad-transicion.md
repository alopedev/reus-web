# Referencias · calidad de la transición pared → mesa (tarea 3, 27-09-2026)

Amplía `scroll-transiciones.md`. Aquí no se busca una técnica para cada pieza, sino ejemplos de **calidad**: ritmo, easing, capas, material. URLs comprobadas (HTTP 200 el 27-09-2026); se indica qué se vio directamente y qué se deduce de un case study.

## Punto de partida (qué le falta a la transición actual)

- `pitch()` sigue el scroll 1:1: sin inercia ni solapes; pared, mesa y sombra comparten el mismo progreso `p` con curvas sencillas (`p²`, `(1−p)^1.5`, lineal)
- `#sombra` oscurece la pared con un degradado uniforme: se lee como un fundido de interfaz, no como pigmento
- Los papeles caen con `power2.out` y aterrizan secos: la sombra no cambia con la altura, no hay asentamiento

## Las tres elegidas

### 1 · Caja de cartón que se pliega con el scroll (Codrops, Ksenia Kondrashova, 2022)
- Artículo: https://tympanus.net/codrops/2022/12/13/how-to-code-an-on-scroll-folding-3d-cardboard-box-animation-with-three-js-and-gsap/ · demo: https://tympanus.net/Tutorials/OnScrollFoldingCardboardBox/ · pen: https://codepen.io/ksenia-k/pen/dyjWPdp
- Qué hace (visto): GSAP no anima transforms, anima un **objeto proxy** (`openingAngle`, `flapAngles[]`); `onUpdate` redibuja. Las solapas tienen **rangos que se solapan** (0–1, 0,9–1,5, 1,1…) y easings `back` cada vez más marcados: cada pliegue arranca antes de que acabe el anterior y se «cierra» con peso
- Qué tomamos: convertir `pitch()` en una timeline con proxy `{wall, table, shade}` y scrub con suavizado. La pared se adelanta, la mesa llega un poco después y se asienta con un leve rebote; el oscurecido va a su propio ritmo (*overlapping action*)
- Cómo sin romper la regla del fondo: la **bisagra** (`fold`) sigue leyendo el scroll crudo (la mesa real está ahí); solo se suavizan los **ángulos**. El sangrado `s` se recalcula cada frame con el ángulo suavizado y la bisagra real, así que la garantía de `check_backstage` se mantiene
- Coste/riesgo: bajo. Solo GSAP núcleo + ScrollTrigger. Riesgo: un rebote de la mesa por debajo de 0° abriría un hueco en su borde → el rebote tiene que ser hacia arriba (más inclinada), nunca más plana de lo final
- Sirve también a la fase 3 (letras con rangos solapados) y a la fase 4 (tren con el mismo proxy de progreso)

### 2 · Ponpon Mania (Awwwards SOTD + SOTM, oct. 2025)
- Galería: https://www.awwwards.com/sites/ponpon-mania · sitio: https://ponpon-mania.com/
- Qué hace (visto): cómic en páginas de papel con grano; al hacer scroll la hoja se desplaza con una ligera inclinación, como un papel real, y dentro de las viñetas caen objetos con física (Matter.js) que rebotan y se asientan
- Qué tomamos (sin Matter.js): la **caída con peso**. Mientras un papel está en el aire, su sombra dura `#2D241C` está más desplazada y un poco más clara; al tocar la mesa se reduce hasta el desplazamiento de siempre. Al llegar, un asentamiento corto (rotación que se pasa 1–2° y vuelve). En reposo, un balanceo mínimo casi imperceptible (idea de https://justinesoulie.fr/)
- Coste/riesgo: bajo-medio. Todo con keyframes de GSAP sobre `filter: drop-shadow` o una capa de sombra aparte (mejor la capa: animar `filter` en móvil cuesta). Matter.js queda descartado: dependencia nueva y física no reversible con scrub
- Sirve a la fase 3: las letras recortadas vuelan con el mismo lenguaje de sombra según la altura

### 3 · David Whyte Experience (Immersive Garden; Awwwards SOTM, FWA SOTD)
- Sitio: https://davidwhyte.com/experience/ · case study: https://www.awwwards.com/case-study-david-whyte-experience-by-immersive-garden.html
- Qué hace (visto el sitio; técnica leída en el case study): acuarelas reales que aparecen con un **revelado de agua**: capas de ruido precalculadas se combinan para que el pigmento avance por zonas, no con un fundido plano
- Qué tomamos: sustituir el degradado uniforme de `#sombra` por un **lavado de pigmento** en el shader del hero (la pared ya se pinta ahí): un uniform `uShade` que avanza desde la bisagra con umbral de ruido y bordes de acuarela (mismo modelo de pigmento). La pared no «se apaga», se queda en sombra pintada
- Coste/riesgo: medio-alto. Cambia un shader que funciona; el hero sigue renderizando durante la transición (ya lo hace). Con WebGL no disponible, vuelve al degradado actual. Riesgo de tirones en móvil si el shader se complica: se mide antes de aprobar

## Descartadas (y por qué)
- Cinematic 3D Scroll (Codrops, nov. 2025): https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ · curvas `CustomEase` útiles, pero se solapa con la 1 y pide ScrollSmoother (gratuito desde GSAP 3.13; el informe del agente decía lo contrario) y OGL
- Galería por curva de Blender (Codrops, jul. 2026): https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/ · `Observer` + `quickTo` para suavizar; alternativa válida a la 1, pero sustituye el scroll nativo
- Codrops 3D Folding Layout (2020): https://tympanus.net/codrops/2020/01/14/3d-folding-technique/ · ya hacemos lo mismo con mejor control del sangrado
- GSAP Sun and Shadow (CodePen): https://codepen.io/WebGuyJeff/pen/oNaMNrM · sombras que giran con la luz; interesante si un día la luz de la ventanilla se mueve con el scroll
- Crafts of Life (https://craftsoflife.com/): tinta y veladuras bellas, pero la transición es un fundido a blanco (prohibido por nuestra regla)
- Resn «Adventuring the Fantastical» (https://www.awwwards.com/case-study-resn-presents-adventuring-the-fantastical.html): una sola variable 0–1 comparte vía, tren e indicador → apuntado para la fase 4
- Dribbble (pop-up de Andrea Rochelle, papel de Briana, tren de Găbrian) y Behance (Epigenetics · Vox): son imágenes estáticas o vídeo lineal; sirven como moodboard, no como referencia de movimiento
- Masar Destination, Cartier Watches & Wonders: experiencias ya retiradas

## Checklist de calidad (para evaluar prototipo y resultado)
1. Solapar, no encadenar: cada capa arranca antes de que acabe la anterior
2. Ease-in-out para A→B (la cámara), ease-out para lo que llega (los papeles)
3. Asentamiento con peso: un pequeño exceso y vuelta, nunca rebote de dibujos animados
4. La sombra dice la altura: a más altura, más desplazada y más clara
5. El oscurecido es material (pigmento), no una capa de interfaz
6. Scrub suavizado solo en lo que no puede abrir huecos; la geometría que tapa el fondo sigue el scroll real
7. Reversible y con `prefers-reduced-motion` = estado final sin viaje
