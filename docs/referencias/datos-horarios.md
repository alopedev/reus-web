# Datos de horarios para generalizar la web (investigación, 28-09-2026)

Tres investigaciones en paralelo, verificadas descargando y leyendo los feeds (no solo la documentación).

## Resumen

| Fuente | Qué da | Coste y acceso | Licencia |
|---|---|---|---|
| Renfe `Fichero_AV_LD` (el feed actual) | AVE, Alvia, Euromed, Avant, Intercity… incluidos los que paran en **Camp de Tarragona** (`stop_id` 04104) | Gratis, descarga directa | Ley 37/2007: reutilización libre, citar «Origen de los datos: Renfe Operadora», mantener la fecha de actualización |
| Renfe `fomento_transit.zip` (Cercanías/Rodalies) | Todas las líneas de Rodalies de Catalunya con su código (R11, R13–R17, RG1, RL3/RL4, RT1/RT2, y R1–R8) | Gratis, descarga directa | La misma |
| Ouigo (NAP, ficha 1515) | GTFS con sus paradas en Camp de Tarragona | Gratis, pero exige **registro en el NAP** (y token para automatizar) | Reutilización libre con atribución «Powered by MITRAMS» + enlace |
| Iryo | Nada: no publica datos abiertos | — | Solo *scraping*, desaconsejado |
| Precios | Ninguna fuente abierta (el GTFS de Renfe no trae tarifas) | — | — |
| Tiempo real (`gtfsrt.renfe.com`) | Avisos y retrasos | Sin CORS: exigiría un servidor o función propia | CC-BY 4.0 (según terceros) |

URLs: `https://ssl.renfe.com/gtransit/Fichero_AV_LD/google_transit.zip`, `https://ssl.renfe.com/ftransit/Fichero_CER_FOMENTO/fomento_transit.zip`, https://data.renfe.com/legal, https://nap.transportes.gob.es/licencia-datos, https://datos.gob.es/es/solicitud-de-datos/horarios-de-servicios-de-tren-en-formato-gtfs

## AVE a Camp de Tarragona (Renfe)

- Ya está en el feed que usamos. El producto solo se distingue por `route_short_name` (`route_type` es 2 en todas las rutas): AVE, AVLO, ALVIA, Intercity, EUROMED, AVANT, AVANT EXP, AVE INT, MD, REGIONAL, REG.EXP…
- Martes 29-09: Sants → Camp de Tarragona 51 trenes (AVE 22, Alvia 9, Euromed 8, Avant 8, AVE INT 2, Intercity 1, Avant Exp 1); vuelta 48. Sábado: 40 y 38.
- Avlo no para hoy en Camp de Tarragona (sus trenes de este feed son Madrid–Sevilla). Filtrar por producto y no por lista cerrada: si Renfe lo añade, entra solo.
- Algunos trenes salen duplicados (varios `service_id`/`trip_id` para el mismo número de tren): deduplicar por número de tren y hora.
- Vigencia del feed: ~12 semanas (hasta el 20-12-2026); Renfe lo regenera cada pocos días.

## Regionales de Catalunya

- El feed correcto es `fomento_transit.zip`. **Duplica** los regionales que también trae `Fichero_AV_LD` (el mismo tren Reus → Sants de las 5:36 es `REG.EXP.` en uno y `R15` en el otro), con los mismos `stop_id`. Hay que tomar los regionales solo de `fomento_transit.zip` y de `Fichero_AV_LD` solo la alta velocidad y la larga distancia.
- Solo regionales (sin R1–R8): 103 estaciones, 227 trenes al día, ~11 paradas por tren. Con R1–R8: 210 estaciones y 1.485 trenes al día.
- Modelo de datos recomendado: por tren, la lista de paradas con su hora (`[[estación, minuto], …]`); el navegador calcula cualquier par recorriendo la secuencia. Precalcular todos los pares ocupa ~10× más.
- Tamaño (14 días, cota superior sin deduplicar días iguales): solo regionales ~380 KB (~120 KB gzip); con R1–R8 ~2,8 MB (~770 KB gzip).
- Vigencia más corta: ~1 mes (24-09 a 23-10). No trae `calendar_dates.txt`: un `service_id` por día en `calendar.txt`.
- Los campos vienen con espacios de relleno (`"R15 "`): `strip()` en todos.

## Consecuencias

- Con más trayectos y un feed que caduca al mes, **la actualización automática deja de ser opcional** (GitHub Action programada que regenere los datos y publique). Hoy no existe: los horarios se regeneran a mano.
- Iryo no puede entrar de forma legal y automática. Ouigo sí, con una cuenta del NAP que tendría que crear Àlex.
- La web no puede enseñar precios ni retrasos sin salir del modelo «sin servidor».
