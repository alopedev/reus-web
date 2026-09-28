# A Reus — Plan de proyecto

Sep 26, 2026 · @Àlex Olivé Pérez

## Qué es y qué manda

Web de horarios de tren Barcelona Sants ↔ Reus cuyo fondo es un paisaje en acuarela generado en directo. Es sobre todo una pieza de portfolio para enseñar lo que Àlex hace con Claude, y además una herramienta real.

- **Prioridad 1: la estética.** En caso de conflicto, la belleza gana a la rapidez, siempre que la animación no vaya a tirones.
- **Prioridad 2: funcionalidad mínima.** Web sencilla: sin cálculo de tiempo hasta la estación ni funciones extra.
- **Aportación de Àlex:** el criterio y la decisión estética. Claude construye; Àlex elige, descarta y justifica.

## Éxito y valor

Éxito = cumplir estas señales a los dos meses de publicarla:

| Señal | Objetivo |
| --- | --- |
| Uso propio | En el 80 % de los viajes a Reus (unos 2 al mes) |
| Publicación | Colgada en internet y en el portfolio |
| LinkedIn | 5 reacciones |
| X | Al menos un comentario positivo |
| Uso ajeno | 10 personas al mes (requiere contar visitas, fase 2) |

**Qué la hace valiosa para Àlex:** que sea funcionalmente impecable, preciosa y original, que genere un momento «guau» al verla en vídeo, y que la use gente que hace el trayecto.

## Fases

**Fase 1 — el momento «guau» (ahora).** Objetivo: un vídeo corto para X y LinkedIn que impresione en los primeros segundos.

1. Investigación de originalidad: posts y proyectos compartidos en redes desde el lanzamiento de Opus 5.5 (22 sep 2026), para saber qué se ha visto ya y diferenciarse. Después, referencias (Awwwards, Codrops; Mobbin si se paga) y 3 direcciones visuales.
2. Àlex elige, combina y justifica.
3. Hero con el paisaje generado en directo a pantalla completa.
4. Funcionalidad mínima: próximos trenes Sants → Reus con los datos actuales.
5. Cerrar el hero; definir y diseñar las secciones con scroll (qué es y para quién, cómo leer la pantalla, cómo se hizo con Claude, datos y límites); después, grabar el vídeo.

**Fase 2 — features (después).** Horarios automáticos con avisos, trayecto de vuelta, precios del AVE (si hay fuente), publicación en subdominio gratuito y medición de visitas.

## Tareas y delegación

«Claude» = quién lo construye; la web en sí no usa IA al funcionar.

| # | Tarea | Fase | Claude | Àlex |
| --- | --- | --- | --- | --- |
| 1 | Horarios automáticos | 2 | Programa de descarga diaria, filtrado y avisos (fallo, cero trenes, caducidad) | Crear cuentas, recibir avisos, comparar 5–6 trenes reales antes de publicar |
| 2 | Precios | 2 | Investigar si hay fuente fiable para el AVE | Decidir qué se muestra (o enlace «ver precio») |
| 3 | Investigación de diseño | 1 | Revisar lo publicado en redes con Opus 5.5, referencias, comparar librerías y skills (shadcn/ui a evaluar, no dada por hecha), 3 direcciones visuales | Elegir, combinar, justificar; registro de decisiones |
| 4 | Experiencia | 1 | Estructura, textos, selector único de hora | Decidir qué es imprescindible |
| 5 | Paisaje en directo | 1 | Hero sin marco, espacio en el cielo para el texto, catenaria suavizada, imagen fija de reserva | Juzgar si es bonito; probar en su móvil |
| 6 | Publicación | 2 | Proyecto, tarea diaria, configuración | Cuentas y botón de publicar |
| 7 | Medición de visitas | 2 | Contador sencillo y respetuoso con la privacidad | Revisar la cifra mensual |
| 8 | Lanzamiento | 1 | Ayuda con guion del vídeo y textos | Grabar, publicar en X y LinkedIn, portfolio |

## Decisiones y riesgos

**Decisiones tomadas**

- Paisaje generado en directo, no vídeo; sin marco de ventanilla. Fondo del hero aprobado: acuarela, con el paisaje pintándose al abrir y el tren arrancando después (el hecho a mano queda descartado). Estructura aprobada: interior de compartimento pintado en acuarela con la ventanilla en el centro (mezcla de Alto's Odyssey, The Tuscan Journey y el wireframe C); nombre y hora como cartel sobre la pared, sin bloques blancos, y el nombre nunca pisa la ventanilla. Tipografía: Young Serif (nombre y horas) + Familjen Grotesk en peso medio y negrita (resto del texto). Nombre de la web pendiente. Contexto en el hero (opción C): subtítulo bajo el nombre, etiqueta «Próximo tren» y billete activo con el viaje. Controles públicos: sentido como dos billetes de tren recortados en papel, y hora; sin pausa ni repintar. El celaje de Fortuny no se eligió por ahora. La ventanilla del primer borrador sigue como opción.
- Estética por encima de rapidez.
- Subdominio gratuito; sin dominio de pago.
- Sin pruebas con usuarios antes de publicar.
- El tiempo hasta la estación lo calcula cada usuario.

**Riesgos abiertos**

- Los horarios actuales caducan el 7 de octubre de 2026.
- Horario teórico: no refleja retrasos, frecuentes en Rodalies.
- Precios del AVE: puede no existir fuente accesible (que Trainline los muestre no lo demuestra).
- Rendimiento del paisaje en móvil sin comprobar en un dispositivo real.
- Texto sobre fondo en movimiento: riesgo de legibilidad.
- Condiciones de uso de los datos abiertos de Renfe por verificar.

## Registro de decisiones estéticas

| Decisión | Descartado | Por qué |
| --- | --- | --- |
| Mantener como candidata la ventanilla del primer borrador | — | Le gusta mucho a Àlex; sigue en la comparación |
| Explorar dirección A: acuarela que se pinta sola | — | Da el momento «guau» en los primeros segundos del vídeo |
| Explorar dirección C: hecho a mano, con el mismo arranque que A | — | El contraste «parece hecho a mano, lo hizo una IA» |
| Mismo comportamiento en A y C: el paisaje se dibuja al abrir y después el tren arranca y sigue en movimiento | Paisaje en movimiento desde el primer instante | El dibujo inicial es el gancho; el movimiento, la continuidad |
| No usar B (celaje de Fortuny) como dirección propia | B | Pendiente de valorar como fuente de inspiración dentro de A o C |
| Secciones con scroll: opción B «La repisa» (la mirada baja a la mesa; folleto = cómo leerla, cuaderno = cómo se hizo con decisiones y técnica, reverso del billete = datos y límites) | A «El vagón sigue», C «El trayecto» | B enseña mejor el criterio de Àlex (cuaderno de decisiones) y continúa el lenguaje de los billetes de papel. De C se rescata la idea de un tren de papel sobre una vía que conecta los objetos |
| «Cómo se hizo» cuenta decisiones y parte técnica | Solo decisiones, solo técnica | Las decisiones son la aportación de Àlex; la técnica, breve, da credibilidad |
| Transición hero → repisa pensada para el uso diario; sigue el dedo (scrub) y se deshace al subir; el paisaje se pausa fuera de vista | Pensada para el vídeo; animación que va sola | Quien la usa a diario no debe esperar; el scrub se siente físico |
| Letras como recortes de papel que vuelan: un viaje grande del hero a «Qué es» y viajes discretos entre secciones; se diseña con «Nombre» y se recalibra al tener el nombre | Anagrama, morph de formas; que todo viaje igual | Coherente con los billetes; si todo viaja, nada destaca |
| Tren de papel plano recortado (locomotora + vagón) que aparece en la mesa, solo marca el progreso; vía sobre la mesa uniendo los objetos, recta en móvil | Tren pulsable; papercraft en volumen; vía como índice lateral | No añade controles; mismo lenguaje que los billetes |
| La mirada baja de verdad (la pared se inclina en perspectiva hasta la mesa); los objetos caen y solo el cuaderno se abre; papel plano con grano, sin acuarela abajo | Fundido a la madera; todos los objetos se despliegan; acuarela en la mesa | Momento «guau» sin duplicar el coste de GPU; el gesto se reserva a la sección clave |
| GSAP 3.13 (ScrollTrigger, SplitText, Flip, MotionPath) desde cdnjs como segunda dependencia | Todo a mano | Gratis y verificado en cdnjs; ~60–90 KB |
| Reducir movimiento: estados finales sin viaje; si un móvil modesto no va fluido, se simplifica solo en móvil | Fundidos; simplificar en todas partes | Accesibilidad sin mareos; escritorio conserva la versión completa |
| Pausa de grabación con la tecla P | Espacio | Con scroll, el espacio es la tecla estándar para bajar la página |
| Solo GSAP núcleo + ScrollTrigger; letras y tren con medidas nativas del navegador | SplitText, Flip, MotionPath | Ahorra ~40 KB; el prototipo ya resuelve esas piezas con cálculo propio |
| El copy de la web se trata en su propia fase del plan; los textos actuales son provisionales | Cerrar el copy dentro de la fase de secciones | Separar forma y contenido |
| Cambiar la fuente secundaria por una que case mejor con Young Serif | Familjen Grotesk | Àlex: no casa con la principal (alternativas pendientes de elegir) |
| Fuente secundaria: Karla 500/700 | Familjen Grotesk, Outfit, Geist | Humanista y cálida; casa con el trazo de cartel de Young Serif (precedente en Typewolf). Geist/Familjen: grotescas de producto que chocan |
| Cambio de plano como cámara que baja: pared y mesa comparten bisagra; la mesa se acerca por abajo; la pared con sangrado calculado y oscurecida, sin transparencia | Girar pared y mesa por separado con fundido | Nunca puede verse el fondo detrás del diseño |
| Mesa, dirección 3 «híbrida»: tablero pintado en acuarela una vez (mismo modelo de pigmento que el hero) + capas vivas encima: luz de la ventanilla con el color de la hora y sombras de árboles que pasan, objetos de viaje (café, bolígrafo, gafas, billete de Rodalies), huellas de uso y vibración del tren. Continuidad con el hero: misma madera y pie de la ventanilla arriba | 1 «Pintada con el mismo pincel» (todo en shader), 2 «Collage de papel» (SVG/CSS) | Cierra la brecha de nivel con el hero sin coste continuo de GPU; la luz y la vibración la mantienen viva. Revisa la decisión anterior «papel plano, sin acuarela abajo» |
| Tamaños con una escala única de cartel (según ancho y alto de pantalla) con mínimos de legibilidad; en pantallas grandes todo crece en proporción | Topes fijos en píxeles y más aire alrededor | La composición debe verse igual en 1440 y en 2560, como un póster ampliado |
| Billetes siempre del ancho de su texto; en tablet vertical y móvil, en fila debajo del nombre | Billete estirado al hueco libre; al lado del nombre mientras quepan | Un billete no crece: es un objeto |
| Tarea 3 · subir la calidad de la transición con referencias: primero ritmo con capas solapadas y aterrizaje de la mesa (caja plegable de Codrops) + caída con peso de los papeles, con sombra según la altura y asentamiento (Ponpon Mania); después, lavado de pigmento en la pared (David Whyte Experience). Ver `docs/referencias/scroll-calidad-transicion.md` | Las tres a la vez; Matter.js para la física; ScrollSmoother/Lenis | 1 y 2 arreglan lo que más se nota (cambio de plano rígido, aterrizaje seco) sin dependencias y sirven a las fases 3 y 4; la 3 toca el shader y se valora aparte |
| Tarea 3 implementada (prototipo aprobado): la pared se adelanta y la mesa llega después con un pequeño rebote hacia arriba; la sombra de la pared depende de su ángulo; los papeles caen acelerando y con aleteo, con la sombra más separada y clara cuanto más altos, y se asientan con un giro de 1–2°; la tapa del cuaderno se abre antes de que acabe de caer el reverso y rebota al quedar plana | Suavizar los ángulos de pared y mesa (estaba en el prototipo) | Con frames lentos, el suavizado dejaba ver el fondo (4 de 6 pasadas de `check.py` en render por software); las curvas dan casi toda la suavidad. La pared lleva además un margen de sobreescala (bisagra un 15 % de pantalla más abajo), ~4 % más de zoom durante el giro |
| Fase 3 · viaje de letras, opción A «cálculo propio»: capa fija `#letras` encima de pared y mesa; cada letra es función pura del scroll, sale del glifo del nombre proyectado sobre la pared y aterriza en el de «Qué es» proyectado sobre la mesa; recorte de papel en el aire (sombra según la altura, volteo 180°), cartel al posarse; emparejado en orden y las letras que sobran se funden en el hueco (las que faltan aparecen al final). Investigación: `docs/referencias/viaje-letras.md` | B · GSAP SplitText + Flip; letras en WebGL | 0 KB, reversible sin estado propio y control total del arco, el volteo y la sombra; Flip mide estados fijos y aquí origen y destino se mueven en cada frame |
| Referencia 3 (David Whyte Experience): la sombra de la pared es un lavado de pigmento pintado en su propio shader (`post`, uniforms `foldY`/`shade`) que nace en la bisagra y trepa por toda la pared, ventanilla incluida, a medida que la pared gira; se oscurece al subir, su frente es una línea continua rota por ruido 2D (avanza desigual por zonas) con el borde más oscuro y granulado. Los textos de la pared se oscurecen con él (`--lavado`, `filter: brightness`). `#sombra` queda como fallback sin WebGL | Primera versión del agente: franja pegada a la bisagra (quedaba casi siempre bajo la mesa y la pared se veía más clara que con el velo) y sin oscurecer ventanilla ni textos; columnas discretas; ángulo uniforme | Mantiene la decisión «la pared se oscurece en vez de desvanecerse» con la textura de la acuarela. Técnica: sin `preserveDrawingBuffer` (el test lee capturas) y el pase de pintura se repinta como mucho una vez por frame |
| `check_backstage` captura cada frame con scroll instantáneo y solo cuando la bisagra ha alcanzado el scroll; si no la alcanza, lo reporta como retraso y no lee el frame. La geometría de `pitch()` no se toca | Ampliar el margen de sobreescala de la pared (15 %); suavizar o retrasar la captura con más tiempo fijo | La fuga intermitente era un frame a medio pintar (franja tan alta como el salto de scroll, sin relación con el ángulo), no un hueco: la pared ya cubre la pantalla sola. Viejo 0/6, nuevo 30/30 pasadas sin fuga |
| Migrar a Vite + TypeScript con módulos, sin cambios visibles (plan en `docs/migracion.md`); alojamiento en Vercel o Netlify; no publicar en el artifact hasta tenerlo | Seguir con un único HTML; React; Cloudflare Pages; GitHub Pages | Un solo archivo de 1.100 líneas frena el trabajo y las pruebas; React no aporta nada a una web de dibujo y animación con poco estado y choca con GSAP/Three |
| Alojamiento en Vercel (https://reus-web.vercel.app), despliegue en cada push a `main`; GitHub Actions pasa las pruebas; referencias visuales separadas para macOS y Linux | Netlify; pruebas de GitHub en macOS; comparación visual solo en local | Vercel detecta Vite y da URL de prueba por cambio; los servidores Linux de GitHub son los más baratos y las fuentes se dibujan distinto en cada sistema |
| Hero móvil (revisión en Safari de iOS, 28-09): ventanilla panorámica tan ancha como el escenario y con el alto que queda (nunca más alta que ancha), dejando sitio arriba y abajo para el marco pintado; hora compacta (4,4rem) y menos aire en el bloque de salida | A · solo panorámica; B · solo hora compacta; dejarla como estaba | La ventanilla, la pieza protagonista, ocupaba unos 127 pt de ancho y el billete «A Barcelona» rozaba su marco; así gana unas tres veces de superficie y la hora sigue mandando |
| Paisaje de la ventanilla pintado al doble de resolución en el hero apilado (móvil, tablet vertical) | ×2,4 de paisaje + pintura de la pared ×2; dejarlo | En una ventanilla pequeña cada pincelada del Kuwahara cubría demasiado y se leía como píxel; coste casi nulo. Afinar también la pared multiplicaba por 2,5 el trabajo de GPU de toda la pantalla |
| La bisagra y el viaje de letras siguen la posición de reposo real de la mesa (`#repisa.offsetTop`, 100svh), no `innerHeight` | — (bug) | En Safari de iOS la barra se encoge al hacer scroll y `innerHeight` crece 40 pt: la bisagra quedaba bajo el borde de la mesa y las letras aterrizaban encima del párrafo |
| Cuaderno: una sola página de contenido, «Cómo se hizo», con cuatro conceptos y la tecnología de cada uno debajo (paisaje en 3D → Three.js; cada fotograma en acuarela → shader Kuwahara y pigmento; el sentido con un billete → HTML y CSS con `clip-path`; la mirada baja a la mesa → CSS 3D y GSAP ScrollTrigger). La izquierda pasa a ser el interior de la tapa («Cuaderno de viaje · Barcelona ↔ Reus») y la apertura no cambia; en móvil las dos páginas miden igual para que la tapa cerrada tape la segunda | Tachados debajo, saltando con la última palabra o delante; conservar «Por dentro»; quitar la tapa; interior de tapa más corto en móvil | Los tachados partían líneas en móvil y el panel debe decir qué tecnología logra cada concepto; «Por dentro» repetía Three.js y el shader. Se quita el lema «Àlex decide; Claude construye» |
