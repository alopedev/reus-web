# Contrato de `data/red.json` (paso 2 · datos de la red, 28-09-2026)

Formato que produce `scripts/extract_red.py` y que comprueba `scripts/check_datos.py`. Todavía no lo usa la web (sigue con `data/trains.json`); lo usará el selector (P0-14 a P0-18 del PRD).

## Qué entra

- Regionales de Renfe en Catalunya **con tren directo a Barcelona** (R11, R13, R14, R15, R16, R17), solo desde `fomento_transit.zip` (el feed `Fichero_AV_LD` duplica los regionales: de él no se toman), salvo lo que decida la investigación (`docs/referencias/datos-red.md`).
- AVE y Avlo de Renfe entre Barcelona-Sants (71801) y Camp de Tarragona (04104), desde `Fichero_AV_LD`. Nada más de alta velocidad (ni Alvia, Euromed, Avant, Intercity…).
- Estaciones de Barcelona: Sants 71801, Passeig de Gràcia 71802, El Clot 79009, França 79400.
- 14 días desde la fecha de generación (como `extract_trains.py`).

## Forma

```json
{
  "fuente": "Origen de los datos: Renfe Operadora",
  "actualizado": "2026-09-28",
  "estaciones": {
    "71400": {"nombre": "Reus", "comarca": "Baix Camp", "lineas": ["R14", "R15"], "ll": [41.161, 1.1]},
    "71801": {"nombre": "Barcelona-Sants", "barcelona": true, "lineas": ["R11", "R13", "R14", "R15", "R16", "R17", "AVE"]}
  },
  "trenes": [
    {"n": "15123", "p": "R15", "s": [["71801", 393, 393], ["71600", 425, 426], ["71400", 483, 483]]}
  ],
  "dias": {"2026-09-28": [0, 1, 2]}
}
```

- `estaciones`: solo las que aparecen en algún tren. Cada pueblo lleva `comarca` (para el grupo AVE: Baix Camp y Tarragonès) y `lineas`; las de Barcelona llevan `"barcelona": true`. Camp de Tarragona lleva `"lineas": ["AVE"]`. Desde el 08-10, cada pueblo lleva además `ll`, `[latitud, longitud]` de su estación en el GTFS con 3 decimales (unos 100 m), para pedir el tiempo de casa (Open-Meteo); es opcional: un pueblo sin `ll` se ve sin tiempo.
- `trenes`: cada tren una vez, aunque circule muchos días. `n` número de tren, `p` producto o línea (`R11`…`R17`, `AVE`, `AVLO`), `s` paradas en orden: `[stop_id, llegada, salida]` en minutos desde medianoche (pueden pasar de 1440 si cruza la medianoche).
- `f` (opcional, desde el 04-11): el número del tren en el feed de Rodalies, solo cuando no es `n`. Los dos feeds numeran distinto algunos trenes (el de Sants a las 19:03 hacia Reus es el 15039 en AV_LD y el 30519 en Rodalies), y el tiempo real de Renfe da un tren cancelado solo con el `trip_id` de Rodalies, sin posición ni número de tren: la web lo cruza con `f` (`src/retards.ts`).
- `b` (opcional, desde el 05-11): el tramo que el tren hace en autobús, `[primera parada, última parada]`, dos paradas de `s` en orden. Por obras, Rodalies hace a veces parte de una línea en autobús (desde el 02-11-2026, Lleida ↔ La Plana-Picamoixons en las R13 y R14): AV_LD sigue dando el tren entero y el feed de Rodalies da el tren y el autobús aparte. `s` es entonces el viaje de verdad: las paradas y horas del autobús (que no para en todas las del tren), y en la parada del cambio, la llegada de un vehículo y la salida del otro (`with_bus` en `scripts/extract_red.py`). La web lo dibuja en el recorrido (`src/journey.ts`) y lo dice en el móvil.
- `dias`: fecha ISO → índices de `trenes` que circulan ese día.
- Tamaño: ≤ 150 KB con gzip.

## Reglas

- Sin duplicados: un mismo tren físico (número y horas) aparece una sola vez por día.
- Horas crecientes a lo largo de `s`.
- Cobertura: los pueblos con tren directo a Barcelona de `PUEBLOS_59` (`scripts/check_datos.py`) tienen estación y algún tren. Las paradas del área de Barcelona (Bellvitge - Gornal, El Prat Aeroport, El Prat de Llobregat) pueden faltar: el selector no las ofrece y Renfe deja de parar ahí cuando hay obras (desde el 03-10-2026).
- Ningún día incompleto: cada día, cada línea (R11, R13–R17, y AVE/Avlo juntos) lleva al menos la mitad de su mediana de trenes diarios en el fichero. Un feed que llega con un día o una línea a medias no se publica.
- Sants → Reus y Reus → Sants deben coincidir con `data/trains.json` (claves `r` y `b`) los días que ambos cubren: es la red de seguridad de que la web actual no pierde trenes.
