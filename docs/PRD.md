# PRD · Horarios de tren Barcelona ↔ Reus en acuarela

| | |
|---|---|
| **Producto** | Web de horarios Barcelona-Sants ↔ Reus (nombre definitivo pendiente) |
| **Responsable de producto** | Àlex Olivé Pérez |
| **Construcción** | Claude (Anthropic), dirigido por Àlex |
| **Estado** | Borrador · Fase 1 en curso (hero terminado, secciones con scroll pendientes) |
| **Versión** | 0.1 · 26 de septiembre de 2026 |
| **Prototipo** | https://claude.ai/artifact/WPG4PK7RoqLePQYZetQRY4 |

## Resumen

Una web de una sola pantalla que responde a una pregunta: *¿cuál es el próximo tren directo entre Barcelona y Reus?* La respuesta se muestra dentro de un vagón pintado en acuarela, con el paisaje de la costa moviéndose por la ventanilla. El proyecto tiene un doble propósito: ser la herramienta que Àlex usa en sus viajes y ser una pieza de portfolio que demuestre su criterio dirigiendo a Claude.

## 1. Problema

Las herramientas para consultar horarios (la app de Renfe, los buscadores de viajes) están pensadas para comprar billetes y cubrir toda la red. Para quien repite siempre el mismo trayecto, obligan a introducir origen, destino y fecha cada vez para obtener un dato simple: la próxima salida. A la vez, la mayoría de webs creadas con IA se parecen entre sí, y Àlex necesita una pieza que muestre un criterio propio, no una plantilla.

Si no se resuelve: la consulta sigue costando varios pasos en cada viaje y el portfolio de Àlex carece de una pieza que haga visible su forma de trabajar con IA.

## 2. Objetivos

**Objetivos de usuario**
1. Saber en menos de 5 segundos, sin escribir nada, a qué hora sale el próximo tren directo y a qué hora llega.
2. Poder mirar otros trenes del día (antes o después) con uno o dos toques.

**Objetivos de negocio (portfolio)**
3. Generar interés al publicarla: 5 reacciones en LinkedIn y al menos un comentario positivo en X.
4. Convertirse en la herramienta habitual de Àlex: usarla en el 80 % de sus viajes a Reus.
5. Atraer uso real ajeno: 10 personas al mes que la visiten (requiere medición, ver P1).

## 3. No objetivos

| No objetivo | Por qué |
|---|---|
| Vender o reservar billetes | Añade complejidad y dependencia de Renfe; el valor está en consultar rápido |
| Retrasos e incidencias en tiempo real | No hay fuente elegida y contradice «web sencilla»; se muestra horario teórico y se avisa |
| Otros trayectos u orígenes | El foco en un solo trayecto es lo que simplifica la experiencia |
| Calcular el tiempo hasta la estación | Cada usuario lo calcula; decisión explícita para no complicar la funcionalidad |
| Precios del AVE en la v1 | Cambian a diario y no se ha confirmado una fuente de datos accesible |
| Controles para el visitante sobre la animación | Decisión artística: el creador fija la experiencia (sin pausa ni repintar) |

## 4. Usuarios

- **Àlex (usuario principal):** viaja a Reus unas dos veces al mes desde Barcelona y paga billete sencillo.
- **Viajero habitual del trayecto:** persona que va y viene entre Barcelona y Reus y quiere la próxima salida sin buscarla.
- **Visitante de LinkedIn o X:** llega desde el vídeo; no conoce el proyecto y decide en segundos si lo entiende y le interesa.

## 5. Historias de usuario

Ordenadas por prioridad.

1. Como viajero a Reus, quiero ver al abrir la web la hora del próximo tren directo y cuánto falta para que salga, para decidir si me da tiempo sin buscar nada.
2. Como viajero, quiero saber a qué hora llegaré y cuánto dura el viaje, para organizar mi llegada.
3. Como viajero de vuelta, quiero cambiar el sentido a «A Barcelona» con un toque, para ver los trenes desde Reus.
4. Como viajero con el tren justo, quiero ver los trenes siguientes y pasar a ellos con un toque, para elegir otra opción si no llego.
5. Como viajero que planifica, quiero elegir otra hora del día y ver el tren correspondiente, para preparar un viaje más tarde.
6. Como visitante que llega desde LinkedIn, quiero entender a primera vista qué es la web, para decidir si me interesa.
7. Como visitante, quiero que la web sea visualmente memorable, para compartirla o recordarla.
8. Como viajero de noche, quiero que la web me diga si ya no quedan trenes hoy y cuál es el primero de mañana, para no quedarme sin respuesta.
9. Como visitante con «reducir movimiento» activado, quiero una versión estática, para usarla sin mareos.

## 6. Requisitos

### P0 · Imprescindibles (Fase 1)

| ID | Requisito | Criterios de aceptación | Estado |
|---|---|---|---|
| P0-1 | Próximo tren al abrir | Dado que abro la web con horario disponible, cuando carga, entonces veo la hora de salida del próximo tren directo, «Sale de … en X min» y los dos siguientes | Hecho |
| P0-2 | Llegada y duración | El billete activo muestra trayecto, hora de llegada y duración del tren mostrado | Hecho |
| P0-3 | Cambio de sentido | Dado que veo «Sants → Reus», cuando pulso el billete «A Barcelona», entonces se muestran los trenes Reus → Sants y el billete activo cambia | Hecho |
| P0-4 | Navegar entre trenes | Al pulsar una hora de «Luego» o «Anterior», ese tren pasa a ser el principal; la regla del día salta siempre a un tren (nunca entre dos); flechas del teclado pasan al anterior o siguiente | Hecho |
| P0-5 | Volver al presente | Cuando he elegido otro tren, aparece «Volver al próximo tren»; al pulsarlo desaparece y vuelvo al próximo tren | Hecho |
| P0-6 | Sin trenes hoy | Dado que ya no quedan trenes, entonces veo «Hoy ya no quedan trenes» y el primero de mañana | Hecho |
| P0-7 | Aviso de horario aproximado | Si el día no está en los datos, se usa el último día del mismo tipo (laborable, sábado o domingo) y se muestra un aviso visible | Hecho |
| P0-8 | Contexto en el hero | Nombre, subtítulo que explica la web y etiqueta «Próximo tren» visibles sin hacer scroll | Hecho (nombre provisional) |
| P0-9 | Identidad visual aprobada | Vagón y paisaje en acuarela; el paisaje se pinta al abrir y después el tren arranca; la luz sigue la hora elegida | Hecho |
| P0-10 | Reglas de diseño | Dos fuentes como máximo; sin bloques blancos; el nombre nunca pisa la ventanilla (verificado por `scripts/check.py` en escritorio y móvil) | Hecho |
| P0-11 | Accesibilidad básica | Controles accesibles con teclado y foco visible; con `prefers-reduced-motion` se muestra un fotograma fijo | Hecho |
| P0-12 | Secciones con scroll | Debajo del hero: qué es y para quién, cómo leer la pantalla, cómo se hizo con Claude, datos y límites; con indicación visible de que hay más contenido | Pendiente |
| P0-13 | Nombre definitivo | La web tiene un nombre elegido por Àlex, aplicado en título, cabecera y publicaciones | Pendiente |

### P1 · Muy deseables (Fase 2)

| ID | Requisito | Criterios de aceptación |
|---|---|---|
| P1-1 | Horarios siempre al día | Una tarea diaria regenera los horarios desde el GTFS de Renfe sin intervención |
| P1-2 | Avisos de datos | Aviso a Àlex si la descarga falla, si salen cero trenes o muchos menos de lo normal, o si los datos caducan en pocos días |
| P1-3 | Publicación en subdominio gratuito | La web vive fuera de claude.ai con coste cero |
| P1-4 | Medición de visitas | Contador sencillo y respetuoso con la privacidad que permita saber si se alcanzan 10 visitantes al mes |
| P1-5 | Recordar el sentido | La web abre con el último sentido elegido y la URL lo refleja (propuesta UX n.º 3, no aprobada aún) |

### P2 · Consideraciones futuras

- Precios del AVE vía Camp de Tarragona, solo si existe una fuente accesible; alternativa: enlace «ver precio».
- Retrasos en tiempo real.
- Más detalle en la ilustración del vagón (asientos, objetos propios como un billete de Rodalies sobre la repisa).

## 7. Métricas de éxito

Evaluación a los dos meses de publicar.

| Métrica | Tipo | Objetivo | Cómo se mide |
|---|---|---|---|
| Uso propio | Retrasada | 80 % de los viajes de Àlex a Reus (~2 al mes) | Autorregistro de Àlex |
| Reacciones en LinkedIn | Adelantada | 5 | Estadísticas de la publicación |
| Comentario positivo en X | Adelantada | ≥ 1 | Revisión manual |
| Visitantes ajenos | Retrasada | 10 al mes | Contador de visitas (P1-4); no medible hasta que exista |
| Legibilidad del hero | Adelantada | Un visitante entiende qué es la web sin hacer scroll | Revisión informal con quien lo vea en el vídeo |

## 8. Diseño

Dirección aprobada: interior de compartimento pintado en acuarela con la ventanilla en el centro (mezcla de las referencias Alto's Odyssey y The Tuscan Journey Begins con el wireframe «cartel de viaje»). Referencias y capturas en `docs/referencias/`; decisiones y descartes en `docs/plan.md`.

## 9. Consideraciones técnicas

- Un único HTML autocontenido; Three.js r128 y Google Fonts como únicas dependencias externas.
- Datos: GTFS abierto de Renfe (feed AV/LD/MD). Ventana de validez de unas dos semanas; regenerar con `scripts/extract_trains.py`.
- Paradas: Barcelona-Sants 71801, Reus 71400. Trayecto regional directo de unos 90 minutos; entre 16 y 21 trenes al día por sentido según el día, según los datos actuales.
- Una página publicada como artifact de claude.ai no puede conectarse a Renfe; la actualización automática requiere alojarla fuera (P1-1, P1-3).

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Horarios caducados | Información falsa para quien la use | Regenerar antes de publicar y grabar; P1-1 y P1-2 |
| Horario teórico sin retrasos | Un tren retrasado aparece como puntual | Explicarlo en «datos y límites» (P0-12) |
| Rendimiento en móviles modestos | Animación a tirones, peor estética | Probar en el móvil de Àlex; bajar resolución del render si hace falta |
| Legibilidad del texto sobre la pintura | Información difícil de leer | Contraste con la pared, formato cartel, pesos 500/700 |
| Condiciones de uso de los datos de Renfe | Incumplimiento de licencia | Verificar y citar la fuente en la web |

## 11. Preguntas abiertas

| Pregunta | Responde | ¿Bloquea? |
|---|---|---|
| ¿Qué contar en «cómo se hizo con Claude»: decisiones, parte técnica o ambas? | Àlex | Sí, para P0-12 |
| ¿Nombre definitivo de la web? | Àlex | Sí, para publicar |
| ¿Qué exigen las condiciones de uso del GTFS de Renfe? | Claude (investigación) | Sí, para publicar |
| ¿Hay fuente accesible de precios del AVE? | Claude (investigación) | No |
| ¿Va fluido en el móvil de Àlex? | Àlex (prueba) | No, pero condiciona la grabación |

## 12. Calendario y fases

- **Fase 1 · Momento «guau» (en curso):** hero terminado → secciones con scroll → vídeo para X y LinkedIn → publicación en portfolio.
- **Fase 2 · Features:** horarios automáticos con avisos, publicación en subdominio gratuito, medición de visitas, precios del AVE si hay fuente.
- **Fecha límite práctica:** los horarios incluidos llegan al 9 de octubre de 2026; grabar y publicar con datos regenerados.

## Historial de cambios

| Versión | Fecha | Cambios |
|---|---|---|
| 0.1 | 26/09/2026 | Primera versión, a partir de la entrevista de objetivos, el plan de proyecto y el hero aprobado |
