# Contrato de `data/red.json` (paso 2 · datos de la red, 28-09-2026)

Formato que produce `scripts/extract_red.py` y que comprueba `scripts/check_datos.py`. Todavía no lo usa la web (sigue con `data/trains.json`); lo usará el selector (P0-14 a P0-18 del PRD).

## Qué entra

- Regionales de Renfe en Catalunya **con tren directo a Barcelona** (R11, R13, R14, R15, R16, R17), solo desde `fomento_transit.zip` (el feed `Fichero_AV_LD` duplica los regionales: de él no se toman), salvo lo que decida la investigación (`docs/referencias/datos-red.md`).
- Los trenes rápidos de Renfe (AVE, Avant, Alvia, Euromed, Intercity, Avlo), desde `Fichero_AV_LD`, entre una estación de Barcelona y cualquier estación catalana, en los dos sentidos, con todas sus paradas en Catalunya (desde el 08-11-2026; antes, solo el AVE y el Avlo entre Sants y Camp de Tarragona). Entran así Girona, Figueres-Vilafant (04307, la estación del AVE de Figueres, a 2 km de la de la R11), Lleida, Camp de Tarragona y las estaciones de la costa del Ebre donde para algún Alvia, Intercity o Avant Exprés. El mismo tren vendido con dos nombres (AVE 03062 y Avant 34062) sale una vez.
- Estaciones de Barcelona: Sants 71801, Passeig de Gràcia 71802, El Clot 79009, França 79400.
- 14 días desde la fecha de generación (como `extract_trains.py`).

## Forma

```json
{
  "fuente": "Origen de los datos: Renfe Operadora",
  "actualizado": "2026-09-28",
  "estaciones": {
    "71400": {"nombre": "Reus", "comarca": "Baix Camp", "lineas": ["R14", "R15"], "ll": [41.161, 1.1]},
    "71801": {"nombre": "Barcelona-Sants", "barcelona": true, "lineas": ["R11", "R13", "R14", "R15", "R16", "R17", "AV"]}
  },
  "trenes": [
    {"n": "15123", "p": "R15", "s": [["71801", 393, 393], ["71600", 425, 426], ["71400", 483, 483]]}
  ],
  "dias": {"2026-09-28": [0, 1, 2]}
}
```

- `estaciones`: solo las que aparecen en algún tren. Cada pueblo lleva `comarca` (Baix Camp y Tarragonès ven además los rápidos de Camp de Tarragona: `altOf` en `src/time.ts`) y `lineas`; las de Barcelona llevan `"barcelona": true`. Camp de Tarragona lleva `"lineas": ["AV"]`. Figueres-Vilafant (04307), solo con trenes rápidos, lleva comarca (Alt Empordà) como un pueblo, pero no es un pueblo del selector (sus `lineas` no tienen ninguna línea R): es la otra estación de Figueres. Desde el 08-10, cada pueblo lleva además `ll`, `[latitud, longitud]` de su estación en el GTFS con 3 decimales (unos 100 m), para pedir el tiempo de casa (Open-Meteo); es opcional: un pueblo sin `ll` se ve sin tiempo.
- `trenes`: cada tren una vez, aunque circule muchos días. `n` número de tren, `p` producto o línea (`R11`…`R17`, `AV` para todos los rápidos: AVE, Avant, Alvia, Euromed, Intercity; desde el 08-11, antes `AVE`/`AVLO`), `s` paradas en orden: `[stop_id, llegada, salida]` en minutos desde medianoche (pueden pasar de 1440 si cruza la medianoche).
- `f` (opcional, desde el 04-11): el número del tren en el feed de Rodalies, solo cuando no es `n`. Los dos feeds numeran distinto algunos trenes (el de Sants a las 19:03 hacia Reus es el 15039 en AV_LD y el 30519 en Rodalies), y el tiempo real de Renfe da un tren cancelado solo con el `trip_id` de Rodalies, sin posición ni número de tren: la web lo cruza con `f` (`src/retards.ts`).
- `b` (opcional, desde el 05-11): el tramo que el tren hace en autobús, `[primera parada, última parada]`, dos paradas de `s` en orden. Por obras, Rodalies hace a veces parte de una línea en autobús (desde el 02-11-2026, Lleida ↔ La Plana-Picamoixons en las R13 y R14): AV_LD sigue dando el tren entero y el feed de Rodalies da el tren y el autobús aparte. `s` es entonces el viaje de verdad: las paradas y horas del autobús (que no para en todas las del tren), y en la parada del cambio, la llegada de un vehículo y la salida del otro (`with_bus` en `scripts/extract_red.py`). La web lo dibuja en el recorrido (`src/journey.ts`) y lo dice en el móvil.
- `dias`: fecha ISO → índices de `trenes` que circulan ese día.
- Tamaño: ≤ 150 KB con gzip.

## Reglas

- Sin duplicados: un mismo tren físico (número y horas) aparece una sola vez por día.
- Horas crecientes a lo largo de `s`.
- Cobertura: los pueblos con tren directo a Barcelona de `PUEBLOS_59` (`scripts/check_datos.py`) tienen estación y algún tren. Las paradas del área de Barcelona (Bellvitge - Gornal, El Prat Aeroport, El Prat de Llobregat) pueden faltar: el selector no las ofrece y Renfe deja de parar ahí cuando hay obras (desde el 03-10-2026).
- Ningún día incompleto: cada día, cada línea (R11, R13–R17, y los rápidos juntos) lleva al menos la mitad de su mediana de trenes diarios en el fichero. Si el mismo día quedan cortas dos líneas o más (parece un feed roto), no se publica. Si queda corta una sola (suele ser una obra en esa línea), se publica con un aviso en el run del robot (Àlex, 07-11).
- Sants → Reus y Reus → Sants deben coincidir con `data/trains.json` (claves `r` y `b`) los días que ambos cubren: es la red de seguridad de que la web actual no pierde trenes.

## `data/rodalies.json` · las demás líneas de Rodalies (08-11-2026)

Para que Capacasa sirva a cualquiera que viva en Catalunya (Àlex, 08-11), `extract_red.py` guarda además las líneas de Rodalies que no son regionales: R1, R2, R2 Nord, R2 Sud, R3, R4, R7 y R8 (`LINEAS_RODALIES`), sin corte de distancia (Badalona y L'Hospitalet cuentan como Blanes). Va en un fichero aparte porque la web aún no lo lee y pesa casi cinco veces `red.json` (78 KB con gzip frente a 16, con los feeds del 08-11): cuando la web lo enseñe, tendrá que bajar solo lo del pueblo elegido.

- Misma forma que `red.json` (`fuente`, `actualizado`, `estaciones`, `trenes`, `dias`), solo desde `Fichero_CER_FOMENTO`, 14 días.
- Un tren entra si para en una estación de **la ciudad de Barcelona** y en otra fuera: Sants, Passeig de Gràcia, Plaça de Catalunya (78805), Arc de Triomf (78804), El Clot, França, Sant Andreu (79004), La Sagrera-Meridiana (78806), Fabra i Puig (78802) y Torre Baró-Vallbona (78801) (`BARCELONA_CIUTAT`). Esas llevan `"barcelona": true`; las demás, `comarca`, `lineas` y `ll`.
- `n` es el número de tren, el de en medio del `trip_id` de Rodalies («5112L25601R1» → 25601); `p`, la línea tal como la da Renfe (`R2` es el tronco Castelldefels/Sant Vicenç – Granollers/Maçanet, que circula casi solo entre semana).
- Sin autobuses (los de obras de la R3 desde Fabra i Puig no cuentan) y sin repetir lo que ya está en `red.json`: Rodalies llama R2 Sud a algún R15 de Flix; si `red.json` tiene ese tren ese día (`same_train`), no sale aquí.
- Reglas (`check_datos.py --rodalies`): forma, 14 días, trenes (línea de `PRODUCTOS_RODALIES`), que toquen Barcelona, sin duplicados, estaciones, que estén `PUEBLOS_RODALIES` (un pueblo grande o dos por línea), ≤ 150 KB con gzip y la regla 12 de días incompletos, con R2, R2 Nord y R2 Sud contadas juntas (el fin de semana el tronco R2 casi no circula y lo cubren las otras dos).
- Si el fichero no se puede generar (una estación nueva sin comarca) o no pasa sus reglas, `red.json` se publica igual y `rodalies.json` se queda como estaba, con un aviso en el run del robot.
- Hoy no entra la R3 (desde La Garriga va en autobús hasta Fabra i Puig por obras, al menos hasta finales de 2026) ni la R7 ni la R8: las estaciones de sus rutas ya tienen comarca, así que entrarán solas el día que vuelva un tren directo.
