# Datos de la red: fomento_transit.zip vs Fichero_AV_LD (investigación, 28-09-2026)

Verificado descargando y leyendo ambos GTFS (`fomento_transit.zip` = «fom», `Fichero_AV_LD` = «av»; snapshot del 24-09-2026). `fom/stop_times.txt` no trae número de tren (no hay `trip_short_name`); por eso los trenes de `fom` se citan por `trip_id` y los de `av` por su número (`trip_short_name`).

## 1. Trenes a Lleida partidos en tramos

En `fom`, R13 y R14 solo se parten en **La Plana-Picamoixons** (73100) — no hay ningún caso de Cunit ni Sant Vicenç de Calders como fin de trip en R13/R14 en todo el periodo del feed (24-09 a 23-10): las paradas más frecuentes como primer/último stop son Lleida-Pirineus, La Plana-Picamoixons, Les Borges Blanques y Barcelona-França para R13, y La Plana-Picamoixons, França y Tarragona para R14. La hipótesis de un corte en Cunit no se confirma con los datos de este snapshot.

**¿Es el mismo tren o un transbordo real?** Es el mismo tren físico. Prueba con el ejemplo del lunes 28-09:

| Feed | trip / nº tren | Paradas relevantes |
|---|---|---|
| `fom` | `trip_id=5165J85000R13` | Lleida-Pirineus (04:48) → La Plana-Picamoixons (llega 06:30) |
| `fom` | `trip_id=5165J15040R13` | La Plana-Picamoixons (sale 06:42) → Barcelona-França (08:24) |
| `av` | **tren 15040** (REG.EXP., `trip_id=1504012026-09-23`) | Lleida-Pirineus (04:48) → … → La Plana-Picamoixons (llega 06:30, **sale 06:42**) → … → Barcelona-Sants (08:07-08:09) → Barcelona-França (08:24) |

`av` modela el trayecto completo Lleida→Sants→França como **un solo trip**, con una parada programada de 12 min en La Plana-Picamoixons (coincide exactamente con el corte de `fom`). Esa parada es consistente con un cambio de tracción (frontera de electrificación: R13 al sur es diésel, R14 al norte es eléctrico), no con un cambio de tren para el viajero. El `block_id` de `fom` no sirve para encadenar (es igual al `trip_id` sin el sufijo de línea: no vincula tramos).

Repetido para los 10 trenes Lleida↔Barcelona de `av` (product `REG.EXP.`, todos activos el 28-09-2026): **15040, 15042, 15044, 15046, 15052** (Lleida→Sants, 5/día) y **15041, 15043, 15045, 15047, 15053** (Sants→Lleida, 5/día). Todos paran en La Plana-Picamoixons, Valls, y de camino en L'Espluga de Francolí y Montblanc (paradas intermedias del mismo trip).

**Conclusión**: Lleida, Montblanc, L'Espluga de Francolí, Valls y Sant Vicenç de Calders **sí tienen hoy tren directo real a Barcelona-Sants** — 5 trenes/día por sentido — pero ese tren solo existe *completo* en `av` (producto `REG.EXP.`); en `fom` aparece partido en 2 trips sin información para recomponerlo.

**Regla para unir tramos**: no hace falta reconstruir manualmente. Cuando un trip de `fom` termina en una estación interna de la red (La Plana-Picamoixons es la única detectada) en vez de en un pueblo terminal, buscar en `av` un trip de producto `REGIONAL`/`REG.EXP.`/`MD` que pase por esa misma estación con el mismo minuto de llegada/salida; si existe y llega a Barcelona, tomar el tren **completo de `av`** y descartar los tramos partidos de `fom` para ese tren.

## 2. El tren Sants↔Reus que falta

`data/trains.json` (de `av`, hoy sin deduplicar) tiene 20/21 el 28-09; `fom` da 19/19. Diferencia = exactamente 3 trenes, estable los 4 días comprobados (28-09 lunes, 29-09 martes, 03-10 sábado, 04-10 domingo):

| Sentido | Salida→Llegada | Tren (`av`) | Producto | Por qué falta en `fom` |
|---|---|---|---|---|
| Sants→Reus | 13:03→14:35 | 15009 | REG.EXP. | Continúa Reus→Flix (Ribera d'Ebre): fuera de la concesión Rodalies |
| Reus→Sants | 10:36→12:07 | 15032 | REG.EXP. | Empieza en Caspe/Móra la Nova (Ribera d'Ebre) |
| Reus→Sants | 18:36→20:07 | 15038 | REG.EXP. | Empieza en Flix (Ribera d'Ebre) |

Los 3 son trenes Barcelona↔Ribera d'Ebre (Flix, Ascó, Móra la Nova…) que pasan por Reus/Tarragona. Las estaciones de la Ribera d'Ebre **sí existen** en `fom` (110 trips tocan Móra la Nova bajo R11/R13-R17), pero ninguno de estos 3 trenes aparece en `fom` con ningún route — no es un problema de partición en tramos, están simplemente ausentes del feed de Rodalies (son producto `REG.EXP.`, media distancia, no forman parte de la concesión Rodalies aunque compartan vía con R15/R16 entre Reus y Sants).

**Patrón confirmado en otros pueblos** (mismos 4 días, deduplicando por tren): Tarragona (+1/+2 mismos trenes), Tortosa (+2: `18054`/`18084`, REG.EXP.), Girona (+10 en sentido Girona→Sants: `15772`,`15774`,`15780`,`15842`,`15844`,`15860`,`15862`,`15864`,`15866`,`15868`, todos producto `MD`), Figueres (+11, mismos trenes MD + uno más), Valls (0, no hay diferencia). **Todos los trenes que sobran en `av` y faltan en `fom` son producto `REG.EXP.` o `MD`; nunca `REGIONAL`** (el producto que sí duplica 1:1 con `fom`).

**Regla**: los trenes `REGIONAL` de `av` duplican `fom` (incluirlos solo de `fom`). Los trenes `REG.EXP.` y `MD` de `av` que tocan una estación de Barcelona **no existen en `fom`** (ni completos ni partidos) y hay que tomarlos siempre de `av`.

## 3. Duplicados

**Entre feeds**: emparejar por `stop_id` (coinciden entre los dos feeds: verificado para Lleida, Reus, Tarragona, Sants, Camp de Tarragona, Cunit, etc.) + minuto de llegada/salida en la parada compartida. Regla de dedup: si un tren de `av` (`REGIONAL`) tiene la misma estación de Barcelona con el mismo minuto que un trip de `fom`, es el mismo tren → usar solo el de `fom`. Como `fom` no trae número de tren, el emparejamiento es por horario, no por número.

**Dentro de `fom`**: no hay duplicados — comprobado para los trips activos R11/R13-R17 del 28-09-2026 (170 trips activos, 170 horarios distintos, 0 grupos duplicados). Coherente con que `fom` usa un `service_id` por día.

**Dentro de `av`**: sí hay duplicados reales. 149 de 1.575 números de tren (~9,5%) tienen más de un `trip_id`/`service_id` **activo el mismo día** con idéntico horario — reexportaciones periódicas de Renfe con rangos de fecha solapados. Ejemplo: tren `00437` (ALVIA) tiene 3 `trip_id` activos el 28-09-2026 (`0043712026-09-28`, `0043722026-09-28`, `0043732026-09-28`), mismo horario. Para el AVE Sants→Camp de Tarragona del 28-09: 22 filas activas en `stop_times`, pero solo 15 números de tren distintos (`03062` sale duplicado, `03092` sale duplicado, `03162` sale triplicado…).

**Regla**: deduplicar `av` por número de tren (`trip_short_name`) por día — quedarse con un `trip_id` cualquiera de los activos y unir el conjunto de fechas en que circula alguno de sus `trip_id`/`service_id` duplicados.

## 4. AVE/Avlo Sants ↔ Camp de Tarragona

El prototipo deduplicaba por `(salida, llegada, producto)` sin el número de tren — con eso colapsa dos trenes distintos que casualmente coinciden al minuto (p. ej. `03940` y `03990`, ambos 510→543) y da un número **por debajo** del real.

| Día | Filas activas (sin dedup) | Trenes AVE distintos (dedup por nº tren) |
|---|---|---|
| Lun 28-09 | 22 | **15** |
| Mar 29-09 | 22 | 15 |
| Mié 30-09 | 22 | 15 |
| Jue 01-10 | 20 | 14 |
| Vie 02-10 | 20 | 14 |
| Sáb 03-10 | 17 | 13 |
| Dom 04-10 | 18 | 13 |

- El "22" de la investigación previa (martes 29-09) es el recuento **sin deduplicar** (filas de `stop_times`), no el número de trenes reales — coincide exactamente con lo que da este análisis para ese mismo día.
- El "13" del prototipo (lunes 28-09) es un recuento **sobre-deduplicado** (pierde 2 trenes reales por colisión de horario al deduplicar sin el número de tren). El valor correcto para el lunes 28-09 es **15**.
- Avlo: 0 los 7 días — no para en Camp de Tarragona en este snapshot (confirma la investigación previa).
- Desglose por producto (28-09, sin dedup): AVE 22, ALVIA 9, EUROMED 8, AVANT 8, AVE INT 2, INTERCITY 1, AVANT EXP 1. Filtrar por producto (`route_short_name` empieza por `AVE` o es `AVLO`), no por lista cerrada.

## 5. Regla final para `scripts/extract_red.py`

1. **Base**: todos los trips de `fom` en R11, R13, R14, R15, R16, R17 tal cual (no tiene duplicados internos; no hace falta número de tren para identificarlos, cada `trip_id` es un tren).
2. **Completar con `av`**: para cada trip de `av` cuyo producto sea `REGIONAL`, `REG.EXP.` o `MD` y que toque una estación de Barcelona (Sants/PdG/Clot/França) y una estación ya incluida (pueblo o Barcelona):
   - Si su estación de Barcelona + minuto coincide con un trip de `fom` → es un duplicado (`REGIONAL`, normalmente), descartar el de `av`.
   - Si no coincide con ningún trip de `fom` → añadirlo completo desde `av` (aplica tanto a los que `fom` no tiene en absoluto — `REG.EXP.`/`MD` de Ribera d'Ebre, Girona-Portbou, Tortosa-Ulldecona… — como a los que `fom` tiene partidos, como Lleida vía La Plana-Picamoixons).
3. **AVE/Avlo**: de `av`, producto `route_short_name` que empiece por `AVE` o sea `AVLO`, parada Sants (71801) y Camp de Tarragona (04104).
4. **Deduplicar `av`** (regionales y AVE/Avlo por igual) por número de tren (`trip_short_name`) y día: un tren, una entrada; unir las fechas de todos sus `trip_id`/`service_id` con el mismo horario.
5. **Verificación obligatoria**: Sants↔Reus (`r`/`b`) del resultado debe coincidir exactamente con `data/trains.json` — pasa con esta regla: `fom` aporta 19/19 y `av` aporta los 3 `REG.EXP.` que faltan (1 ida + 2 vuelta), total 20/21, igual que hoy.
