# PRD · Capacasa: el tren a casa, y de vuelta a Barcelona

| | |
|---|---|
| **Producto** | Web de horarios de tren entre Barcelona y los pueblos de las líneas regionales · **Capacasa** (*cap a casa*, «hacia casa») |
| **Responsable de producto** | Àlex Olivé Pérez |
| **Construcción** | Claude (Anthropic), dirigido por Àlex |
| **Estado** | Borrador · Fase 2 en curso (hero y mesa terminados con Sants ↔ Reus; generalizar trayectos) |
| **Versión** | 0.2 · 28 de septiembre de 2026 |
| **Web** | https://reus-web.vercel.app |

## Resumen

La forma más rápida de saber cuándo sale el próximo tren entre Barcelona y tu pueblo: abres la web y ahí está la hora, sin escribir nada. La respuesta se muestra dentro de un vagón pintado en acuarela, con el paisaje moviéndose por la ventanilla.

## 1. Problema

Mucha gente de Reus y de los pueblos de las líneas regionales vive, trabaja o estudia en Barcelona, y vuelve a casa el fin de semana o varias veces al mes para ver a la familia. Hacen siempre el mismo trayecto y se hacen siempre la misma pregunta: ¿a qué hora sale el próximo tren?

Para responderla solo tienen herramientas pensadas para otra cosa. La app de Renfe y los buscadores de viajes existen para vender billetes y cubrir toda la red: piden origen, destino y fecha en cada consulta para dar un único dato.

Los momentos en que duele:
- **El viernes, al salir del trabajo o de clase:** ¿llego al de las 18:33 o espero al siguiente?
- **El domingo por la tarde:** ¿cuál es el último tren para volver a Barcelona?
- **De camino a la estación:** ¿cuánto falta?, ¿y si lo pierdo, cuándo sale el siguiente?

Si no se resuelve, cada viaje repite el mismo trámite para un dato simple y deja la duda de si se llega a tiempo.

## 2. Objetivos

**Objetivos de usuario**
1. Saber en menos de 5 segundos, sin escribir nada, a qué hora sale el próximo tren directo entre Barcelona y tu pueblo, cuánto falta y a qué hora llega (desde la segunda visita).
2. En la primera visita, elegir tu pueblo en tres toques como máximo y sin teclado.
3. Poder mirar otros trenes del día (antes o después) con uno o dos toques.
4. Para quien vuelve al Baix Camp o al Tarragonès: ver de un vistazo si le compensa el AVE desde Camp de Tarragona frente al regional.

**Objetivos de negocio**
5. Pieza de portfolio: mostrar el criterio de Àlex dirigiendo a Claude. 5 reacciones en LinkedIn y al menos un comentario positivo en X al publicarla.
6. Convertirse en la herramienta habitual de Àlex: usarla en el 80 % de sus viajes a Reus.
7. Atraer uso real ajeno: 10 personas al mes (requiere medición, ver P1-4).

## 3. No objetivos

| No objetivo | Por qué |
|---|---|
| Trayectos entre dos pueblos sin pasar por Barcelona, y las líneas que no llegan a Barcelona | El problema es ir y volver de Barcelona; una sola elección simplifica la experiencia |
| Trayectos con transbordo | Se mantiene la promesa «tren directo» y un modelo de datos sin enlaces |
| Elegir otro día | La web responde «¿cuándo sale el próximo?» y los trenes de hoy; para planificar otro día, la app de Renfe |
| Cercanías R1–R8 | Otro uso (frecuencias altas) y ~2,8 MB de datos |
| Ouigo, Iryo y la alta velocidad que no sea AVE/Avlo de Renfe en Camp de Tarragona | Ouigo exige registro en el NAP; Iryo no publica datos abiertos |
| Vender billetes o mostrar precios | No hay fuente abierta de tarifas; el valor está en consultar rápido |
| Retrasos e incidencias en tiempo real (v1) | Exige una función serverless; se muestra el horario teórico y se avisa (P2) |
| Calcular el tiempo hasta la estación (incluido llegar a Camp de Tarragona) | Cada usuario lo calcula; decisión explícita para no complicar |
| Un paisaje distinto por línea (v1) | Trabajo 3D por corredor antes de publicar (P2) |
| Controles para el visitante sobre la animación | Decisión artística: el creador fija la experiencia (sin pausa ni repintar) |

## 4. Usuarios

- **Quien vuelve a casa (principal):** es de Reus o de un pueblo de la línea, vive, trabaja o estudia en Barcelona y vuelve el fin de semana o varias veces al mes. Siempre el mismo trayecto. Àlex es uno de ellos (unas dos veces al mes a Reus, billete sencillo).
- **Quien vuelve al Baix Camp o al Tarragonès:** además del regional (1 h 40 min), tiene el AVE desde Camp de Tarragona (unos 35 min, normalmente más caro y con la estación lejos del pueblo).
- **Visitante de LinkedIn o X:** llega desde el vídeo, no conoce el proyecto y decide en segundos si lo entiende y le interesa.

## 5. Historias de usuario

Ordenadas por prioridad.

1. Como quien vuelve a casa el viernes, quiero ver al abrir la web la hora del próximo tren a mi pueblo y cuánto falta, para decidir si llego sin buscar nada.
2. Como viajero, quiero saber a qué hora llegaré y cuánto dura el viaje, para organizar mi llegada.
3. Como quien vuelve a Barcelona el domingo, quiero cambiar el sentido con un toque, para ver los trenes desde mi pueblo.
4. Como viajero con el tren justo, quiero ver los trenes siguientes y pasar a ellos con un toque, para elegir otra opción si no llego.
5. Como viajero que se organiza el día, quiero elegir otra hora de hoy y ver el tren correspondiente (por ejemplo, el último), para decidir cuándo salir.
6. Como nuevo usuario, quiero elegir mi pueblo sin escribir. (Que la web lo recuerde queda fuera de esta fase: P0-16 descartado.)
7. Como quien sale de Passeig de Gràcia o de França, quiero cambiar la estación de Barcelona una vez, para ver mis trenes reales.
8. Como quien vuelve al Baix Camp o al Tarragonès, quiero ver junto al regional el próximo AVE desde Camp de Tarragona, para decidir si me compensa.
9. Como viajero de noche, quiero que la web me diga si ya no quedan trenes hoy y cuál es el primero de mañana, para no quedarme sin respuesta.
10. Como viajero, quiero compartir mi trayecto con un enlace, para que otra persona lo abra directamente.
11. Como visitante que llega desde LinkedIn, quiero entender a primera vista qué es la web, para decidir si me interesa.
12. Como visitante, quiero que la web sea visualmente memorable, para compartirla o recordarla.
13. Como visitante con «reducir movimiento» activado, quiero una versión estática, para usarla sin mareos.

## 6. Requisitos

### P0 · Imprescindibles

| ID | Requisito | Criterios de aceptación | Estado |
|---|---|---|---|
| P0-1 | Próximo tren al abrir | Dado que abro la web con horario disponible, cuando carga, entonces veo la hora de salida del próximo tren directo de mi trayecto, cuánto falta para que salga y los dos siguientes | Hecho (Sants ↔ Reus) |
| P0-2 | Llegada y duración | El billete activo muestra trayecto, hora de llegada y duración del tren mostrado | Hecho |
| P0-3 | Cambio de sentido | Dos billetes: «a Barcelona» y «a tu pueblo»; al pulsar el otro, se muestran los trenes en ese sentido | Hecho (Sants ↔ Reus) |
| P0-4 | Navegar entre trenes | Al pulsar una hora de «Luego» o «Anterior», ese tren pasa a ser el principal; la regla del día salta siempre a un tren; las flechas del teclado pasan al anterior o al siguiente | Hecho |
| P0-5 | Volver al presente | Cuando he elegido otro tren, aparece «Volver a ahora»; al pulsarlo, vuelvo al próximo tren | Hecho |
| P0-6 | Sin trenes hoy | Dado que ya no quedan trenes, veo «Hoy ya no quedan trenes» y el primero de mañana | Hecho |
| P0-7 | Aviso de horario aproximado | Si el día no está en los datos, se usa el último día del mismo tipo y se muestra un aviso visible | Hecho |
| P0-8 | Contexto en el hero | «Capacasa» y el subtítulo «El tren a casa, y de vuelta a Barcelona» visibles sin scroll; hero según el prototipo B revisado (ver `docs/plan.md`) | Hecho en 3.2 |
| P0-9 | Identidad visual aprobada | Vagón y paisaje en acuarela; el paisaje se pinta al abrir y después el tren arranca; la luz sigue la hora elegida | Hecho |
| P0-10 | Reglas de diseño | Dos fuentes como máximo; sin bloques blancos; el nombre nunca pisa la ventanilla (verificado por `scripts/check.py`) | Hecho |
| P0-11 | Accesibilidad AA | Controles accesibles con teclado y foco visible; `prefers-reduced-motion` da un fotograma fijo; el lector de pantalla solo oye el cambio de tren; sin atajos de una tecla para el público | Hecho en parte; pendientes: barra de Safari sobre el pie del hero, contraste de las etiquetas de la regla, `<title>`, landmark del hero, reflow a 320 px |
| P0-12 | Secciones con scroll | Debajo del hero: qué es, cómo leerla, cómo se hizo, datos y límites | Hecho (La repisa); textos por generalizar |
| P0-13 | Nombre definitivo | «Capacasa», aplicado en título, cabecera y publicaciones; recalibrar el viaje de letras (hoy diseñado con «Nombre») | Hecho en 3.2 |
| P0-14 | Elegir tu pueblo | En la primera visita se elige el pueblo sin teclado, en tres toques como máximo, entre las estaciones con tren directo a Barcelona; el selector vive en los billetes | Hecho en 3.3: el pueblo del billete abre un selector (corredor → estación) en tres toques, entre unos 70 pueblos (71 en el horario del 28-09) |
| P0-15 | Estación de Barcelona | Sants por defecto; se puede cambiar a Passeig de Gràcia o França (El Clot descartado el 05-10: nadie la pide). Si no hay tren directo entre esa estación y el pueblo, la web lo dice | Hecho (06-10) |
| P0-16 | Recordar el trayecto | La web abre con el último pueblo, estación y sentido elegidos; la URL los refleja y se puede compartir. La primera visita abre en Sants → Reus | Descartado el 05-10 (Àlex: no hace falta en esta fase) |
| P0-17 | Alternativa AVE (Baix Camp y Tarragonès) | Si el pueblo es del Baix Camp o del Tarragonès, junto al regional se ve el próximo AVE/Avlo desde o hasta Camp de Tarragona (salida y llegada), sin quitar protagonismo al regional | Hecho en 3.2 |
| P0-18 | Datos de la red | Regionales de `fomento_transit.zip` y AVE/Avlo de `Fichero_AV_LD` (solo Camp de Tarragona), sin duplicados, un modelo por tren con su lista de paradas, ≤ ~150 KB comprimido | Hecho (`data/red.json`, 14 KB gzip; desde 3.3 la web lee de ahí todos los pueblos elegibles, no solo Sants ↔ Reus) |
| P0-19 | Atribución | «Origen de los datos: Renfe Operadora» y la fecha de actualización visibles | Hecho (reverso del billete) |

### P1 · Muy deseables

| ID | Requisito | Criterios de aceptación | Estado |
|---|---|---|---|
| P1-1 | Horarios siempre al día | Una tarea diaria regenera los horarios sin intervención | Hecho (`horarios.yml`) |
| P1-2 | Avisos de datos | Aviso a Àlex si la descarga falla, si salen cero trenes o muchos menos de lo normal, o si los datos caducan en pocos días (el feed regional dura un mes) | En parte (email si falla) |
| P1-3 | Publicación gratuita | La web vive fuera de claude.ai con coste cero | Hecho (Vercel) |
| P1-4 | Medición de visitas | Contador sencillo y respetuoso con la privacidad para saber si se llega a 10 visitantes al mes | Pendiente |

### P2 · Consideraciones futuras

- Retrasos en tiempo real con una función serverless mínima (`gtfsrt.renfe.com` no admite CORS).
- Un paisaje por línea (costa, interior, Pirineo).
- Fase 4 del diseño: tren de papel sobre una vía en la mesa (aparcada).
- Subir Three.js desde r128 para aligerar la carga.

## 7. Métricas de éxito

Evaluación a los dos meses de publicar.

| Métrica | Tipo | Objetivo | Cómo se mide |
|---|---|---|---|
| Uso propio | Retrasada | 80 % de los viajes de Àlex a Reus (~2 al mes) | Autorregistro de Àlex |
| Reacciones en LinkedIn | Adelantada | 5 | Estadísticas de la publicación |
| Comentario positivo en X | Adelantada | ≥ 1 | Revisión manual |
| Visitantes ajenos | Retrasada | 10 al mes | Contador de visitas (P1-4) |
| Legibilidad del hero | Adelantada | Un visitante entiende qué es la web sin hacer scroll | Revisión informal con quien lo vea en el vídeo |
| Primera elección | Adelantada | Alguien que no conoce la web elige su pueblo en ≤ 3 toques sin ayuda | Prueba informal con 3 personas |

## 8. Diseño

Dirección aprobada: interior de compartimento pintado en acuarela con la ventanilla en el centro; debajo, «La repisa» (la mirada baja a la mesa: folleto, cuaderno y reverso del billete). Referencias en `docs/referencias/`; decisiones y descartes en `docs/plan.md`.

Al generalizar: el paisaje es el mismo para todos los trayectos; el billete de Rodalies de la mesa, la tapa del cuaderno y los textos de «Qué es» y «Datos y límites» dejan de nombrar Reus o reflejan el trayecto elegido.

## 9. Consideraciones técnicas

- Vite + TypeScript estricto; Three.js r128 y GSAP 3.15 como dependencias; Google Fonts. Publicada en Vercel en cada push a `main`; GitHub Actions pasa tipos, compilación y `check.py`.
- Sin servidor: los horarios son estáticos y una tarea de GitHub los regenera cada día (04:00 UTC); si Renfe falla, la web sigue con los de ayer.
- Datos: GTFS abierto de Renfe. Los regionales, solo de `fomento_transit.zip` (vigencia ~1 mes); la alta velocidad, de `Fichero_AV_LD` filtrando AVE/Avlo en Camp de Tarragona (`stop_id` 04104). Los dos feeds duplican los regionales: deduplicar por número de tren y hora. Investigación: `docs/referencias/datos-horarios.md`.
- Licencia: reutilización libre citando «Origen de los datos: Renfe Operadora» y la fecha de actualización.

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Horario teórico sin retrasos | Un tren retrasado aparece como puntual | Explicarlo en «Datos y límites»; tiempo real en P2 |
| Selector difícil sin teclado | La primera visita se hace larga y se pierde el usuario | Una sola elección (Barcelona fija); tres propuestas con prueba informal |
| Peso de los datos | Arranque lento en móvil | Modelo por tren (~120 KB comprimido); medir antes de publicar |
| Duplicados entre feeds | Trenes repetidos | Regionales solo de un feed; deduplicar |
| El feed regional caduca al mes | Horarios que se acaban | Refresco diario; P1-2 |
| Rendimiento en móviles modestos | Animación a tirones | Probar en el móvil de Àlex; bajar resolución si hace falta |
| Legibilidad del texto sobre la pintura | Información difícil de leer | Contraste con la pared, formato cartel; revisión de accesibilidad |
| Mensaje diluido al generalizar | La web parece un buscador más | El problema manda: «entre Barcelona y tu pueblo», una sola elección |

## 11. Preguntas abiertas

| Pregunta | Responde | ¿Bloquea? |
|---|---|---|
| ¿Cómo se elige el pueblo con los billetes (orden, agrupación por línea o comarca)? | Respondida en 3.3: selector en `<dialog>` por corredor (4 grupos de línea) y después tira de estaciones en orden de línea | Sí, para P0-14 |
| ¿Qué líneas llegan de verdad a Barcelona con tren directo? | Claude (datos) | Sí, para P0-14 |
| ¿Cómo se muestra el AVE sin cargar el hero? | Claude propone, Àlex decide | Sí, para P0-17 |
| ¿Va fluido en el móvil de Àlex? | Àlex (prueba) | No, pero condiciona la grabación |

## 12. Calendario y fases

- **Fase 1 · Momento «guau» (hecha):** hero, «La repisa» y viaje de letras con Sants ↔ Reus.
- **Fase 2 · Producto (ahora), en este orden:** trayectos (P0-14, P0-15, P0-17 a P0-19; P0-16 descartado), nombre (P0-13, decidido: Capacasa), copy (P0-8, textos de la mesa).
- **Fase 3 · Lanzamiento:** vídeo para X y LinkedIn y publicación en el portfolio.

## Historial de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 0.1 | 26/09/2026 | Primera versión, a partir de la entrevista de objetivos, el plan de proyecto y el hero aprobado |
| 0.2 | 28/09/2026 | El problema se centra en quien vuelve a casa desde Barcelona; Barcelona fija y el usuario elige su pueblo; estación de Barcelona cambiable; alternativa AVE para el Baix Camp y el Tarragonès; sin elegir día; recordar el trayecto sube a P0; estado real (La repisa, horarios diarios, Vercel); licencia resuelta; portfolio como objetivo de negocio |
| 0.3 | 05/10/2026 | Recordar el trayecto (P0-16) descartado para esta fase; estación de Barcelona solo Sants, Passeig de Gràcia y França (fuera El Clot) |
