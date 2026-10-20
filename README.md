# Cerebro Orlando

Sistema de información sobre Orlando, Florida, para el taller de datos de Tópicos de Sistemas de Información (EAFIT).
Responde seis preguntas con datos abiertos; cada cifra trae su fuente, su vigencia y la fecha en que la comprobamos.

Réplica del lago del Cerebro Lima: un script por tema, un contrato común, una verificación que sabe fallar y una vista
de una sola página. Solo biblioteca estándar de Python 3.9 o superior: no hay nada que instalar ni llaves que pedir.
(`catalogo/exportar_catalogo.py` es la excepción: usa `openpyxl` para leer el Excel, y no forma parte del lago.)

## Las seis preguntas y de dónde salen

| Pregunta | Temas del lago | Fuentes (ficha del Excel) |
|---|---|---|
| ¿Cuánta gente vive aquí y cómo le va frente a condados parecidos? | `gente` | Census vía FRED: población, ingreso mediano, pobreza (F14) |
| ¿Cómo se mueve la economía y cuánto cuesta vivir aquí? | `economia`, `empleo`, `vivienda`, `permisos` | BLS, FHFA, Realtor.com y Census vía FRED (F14); Indeed Hiring Lab (F70); permisos de la ciudad (F79) |
| ¿Qué pasa en cada barrio? | `permisos`, `seguridad`, `codigo`, `negocios`, `territorio` | Datos abiertos de Orlando (F79, F81, F83, F88, F90, F93, F94); Policía de Orlando (F106) |
| ¿Qué pasa con la seguridad y la convivencia? | `seguridad`, `codigo` | Policía de Orlando (F106); casos de código urbano (F83) |
| ¿Cuánto pesa el turismo? | `turismo`, `negocios`, `escucha` | BLS vía FRED (F14); licencias de negocio (F81) y de alquiler de corto plazo (F85); Wikipedia (F71) |
| ¿Qué clima hay hoy y cómo está cambiando? | `clima`, `clima_historico` | National Weather Service (F57); NOAA NCEI (F58) |

Cada pregunta se compara «contra algo»: Tampa, Miami y Jacksonville (y Florida) para las cifras del área; el año
anterior para las tendencias; los demás barrios para el mapa.

## Cómo se corre

```
python3 reconstruir.py                       # borra el lago, corre todos los ingesta/pull_*.py y verifica (funciona en Windows)
python3 verificacion/verificar.py            # con un solo FAIL no se publica
python3 verificacion/probar_verificador.py   # comprueba que la verificación sepa fallar
python3 vista/construir_vista.py             # arma vista/index.html; corre verificar.py antes y no construye si falla
```

Los scripts de ingesta, uno por tema (cada uno dice arriba qué lee y qué escribe):

| Script | Qué trae |
|---|---|
| `pull_gente.py` | Población del condado y del área, ingreso mediano y pobreza de Orange y sus pares |
| `pull_economia.py` | Desempleo de Orlando, Tampa, Miami, Jacksonville, Florida y EE. UU.; empleo total del área |
| `pull_empleo.py` | Índice de avisos de empleo de Indeed para Orlando y sus pares |
| `pull_vivienda.py` | Índice de precios (largo plazo y pares), precio de lista, inventario, días en el mercado, viviendas autorizadas |
| `pull_permisos.py` | Permisos de construcción por año y por barrio (cinco años) |
| `pull_seguridad.py` | Casos de la policía por año, por grupo (hurtos, violencia, drogas), por barrio y por tipo |
| `pull_codigo.py` | Casos de código urbano por año y por barrio; quejas ciudadanas; motivos |
| `pull_negocios.py` | Licencias de negocio vigentes por barrio; restaurantes, hospedajes, categorías |
| `pull_turismo.py` | Empleo en ocio y hotelería y su peso en el empleo; alquileres de corto plazo con licencia |
| `pull_escucha.py` | Visitas al artículo de cada ciudad en Wikipedia en español |
| `pull_clima.py` | Temperatura actual, alertas y pronóstico (cambia en cada corrida) |
| `pull_clima_historico.py` | Temperatura media y lluvia de cada año desde 1953 |
| `pull_territorio.py` | Límite de la ciudad, barrios, distritos de comisionados y lagos |

En Windows se usa `python` o `py` en lugar de `python3`. Opcional: `set CONTACTO=correo-del-grupo@...` antes de
correr, porque el servicio del clima pide que el cliente se identifique.

## Qué hay en cada carpeta

| Carpeta | Qué guarda |
|---|---|
| `ingesta/` | Un script por tema. `comun.py` tiene lo compartido: contrato, consultas a Socrata, ArcGIS y FRED, y la supresión bajo el umbral. |
| `catalogo/` | `fuentes_lago.json`: las 21 fuentes que alimentan el lago, con su licencia tal como aparece y su nivel de protección. `catalogo_completo.json`, `diccionario.json` y `bitacora_ia.json`: exportados del Excel por `exportar_catalogo.py`. |
| `lago/` | `lago/raw/<tema>/<tema>.json` (13 temas): lo que escribe cada script, con la forma del contrato. Está en `.gitignore`. `lago/territorio/`: capas GeoJSON en WGS84, simplificadas; esta sí se publica. |
| `verificacion/` | `verificar.py` y la prueba de que sabe fallar. |
| `vista/` | `plantilla.html` (estructura), `estilos.css`, `app.js` y `construir_vista.py`, que junta todo con el lago en una sola página: `index.html`. |
| `entrega1/`, `entrega2/` | El diccionario de datos (Excel) tal como se entregó en cada corte. |

## Cómo cuidamos a las personas

Cinco fuentes traen datos de personas: permisos (propietario, contratista), casos de la policía (número de caso, fecha,
punto exacto), código urbano (nombres en el caso), licencias de negocio (dueño, teléfono) y alquileres de corto plazo
(nombre, correo). Su nivel de protección en `fuentes_lago.json` es **«solo agregados»**:

- Nada de eso se descarga. Los servidores de la ciudad devuelven conteos por barrio y por año (`$group` en Socrata,
  `outStatistics` en ArcGIS); el lago nunca tiene una fila por persona.
- Un barrio con menos de 5 casos en el año no se publica (`umbral_minimo_por_barrio`), y los barrios suprimidos no se
  nombran en ninguna parte. En la vista salen en gris, igual que los que no tuvieron ninguno.
- De la policía no entran Baker Act (salud mental), suicidios, muertes, personas desaparecidas, custodia ni órdenes de
  alejamiento: no son delitos y señalarían a personas vulnerables.
- `verificar.py` falla si aparece un campo personal (nombres, número de caso, dirección, teléfono, correo), una categoría
  excluida o una celda por barrio bajo el umbral. `probar_verificador.py` comprueba que esas tres fallas se detecten.

Las demás fuentes son **«abierto»**: series agregadas por área sin datos de personas.

## La vista

`vista/index.html` es una sola página sin servidor. Ocho secciones: resumen, gente, economía y vivienda, barrios,
seguridad, turismo, clima y fuentes.

- **Resumen:** las seis respuestas con su cifra, su tendencia en palabras y su fuente; Orlando contra ciudades parecidas;
  las preguntas que no tienen respuesta abierta; un mapa 3D con recorrido guiado por cinco barrios (elegidos por los datos).
- **Barrios:** mapa 3D (MapLibre GL desde cdnjs, sin teselas ni llaves: solo las capas del lago) con seis lentes,
  total o por km², barra de años, buscador, ficha por barrio con comparación, ranking, un **índice de atención** con
  pesos movibles (y cuántos barrios siguen arriba con cualquier enfoque), dispersión entre dos medidas con ρ de Spearman
  y la tabla completa. Si el navegador no tiene WebGL, el mapa cae a SVG plano.
- **Modo presentación:** nueve láminas con las respuestas, para exponer (flechas del teclado, Esc para salir).
- Cada cifra abre su ficha de trazabilidad: fuente, licencia, enlace exacto consultado, fecha de prueba y campo del
  diccionario. Lo que la vista calcula (distrito de cada barrio, área, «por km²», el índice) está marcado como «derivado».
- Para desplegar en Vercel: carpeta raíz `vista/`, sin comando de build.
- `python3 vista/construir_vista.py --sin-verificar` sirve solo para probar el diseño; la página lo dice en «Fuentes».
- Desde la consola del navegador, `cerebro.B` tiene el modelo de barrios que usan todas las vistas.

## Lo que sigue pendiente

1. **Licencias de la ciudad.** Las fuentes del portal de Orlando y la capa de la policía «no declaran» licencia (la ficha
   del portal tiene el campo vacío). `verificar.py` lo marca con WARN. Antes de un uso fuera del curso, hay que leer los
   términos del portal.
2. **Realtor.com vía FRED** dice «Copyrighted: Citation Required»: se usa con la atribución visible en la vista.
3. **Huecos declarados:** población por barrio (la ACS pide llave), PIB del área (descontinuado en FRED), solicitudes al
   311 (no publicadas), turistas y pasajeros (solo en PDF), cargos y salarios de las ofertas (Indeed prohíbe extraerlas).

## Cosas que cambian solas

- `clima.json` cambia en cada corrida (tiempo real): no entra en la prueba de reproducibilidad.
- Wikipedia suma un mes nuevo cada mes; Indeed, cada semana; las series de FRED, cuando la agencia publica.
- Seguridad, código y permisos guardan el año en curso solo como cifra aparte («va en …»); los gráficos usan años completos.
