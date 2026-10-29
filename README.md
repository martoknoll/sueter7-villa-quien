# sueter7 — La Sencilla Villa Quién

Sitio oficial del disco **Todo salió bien en la Sencilla Villa Quién**, de sueter7.
Proyecto Final de Diseño Digital — Instituto Tecnológico ORT, 2026.

**Sitio publicado:** https://martoknoll.github.io/sueter7-villa-quien/

---

## Qué es

No es una web de banda convencional. Es una ciudad chica y explorable —estaciones, casas,
túneles, carteles y papeles— donde las canciones esconden referencias y cartas que el
visitante va encontrando y guardando en un diario propio. El progreso es narrativo: se
cuentan hallazgos, nunca puntos ni tiempos.


## Qué hay en este repositorio

| Archivo | Qué es |
|---|---|
| `index.html` | **Inicio — la estación.** Andén con las cuatro puertas (Sueter7, Diario, Discos, Tienda) y el reproductor persistente. Las secciones se abren adentro de esta página, así la música no se corta al navegar. |
| `discos.html` | **Discos y Canciones**, con acceso a las letras del tema que suena. |
| `letras.html` | **Letras** sincronizadas: se resaltan solas siguiendo el reproductor de la estación. |
| `sueter7.html` | **Sobre Sueter 7**. |
| `tienda.html` | **Tienda** con carrito y cobro por Mercado Pago (el pago se abre en la ventana entera). |
| `fechas.html` | **Próximas fechas**. |
| `compra.html` | Vuelta de Mercado Pago: pago aprobado, pendiente o rechazado. |
| `diario.html` | **Diario de Mari**: libro de 24 páginas con la historia del disco, hecho con StPageFlip (`lib/`, licencia MIT). |
| `img/mari.png` | Sprite en pixel art de Mari (caminata de costado, de espaldas y de frente) que camina por el andén y entra a las puertas. |
| `tu-version/` | **Tu versión**: la persona sube una foto, elige escena (colectivo, plaza o recital) y colores de la paleta, y recibe su retrato en el estilo collage de Suéter 7. Página completa (fuera de la estación): se entra por el botón "Tu versión" del menú o por el cartel "Creá tu versión" del andén. |
| `api/generate.ts` | Función de Vercel que genera la imagen con OpenAI. La key vive solo en el servidor; la foto se procesa en memoria y no se guarda. |
| `vercel.json` | Tiempo máximo de la función y el archivo de referencia de estilo que lleva. |
| `puente.js` | Conecta cada sección con la estación: navegación y reproductor compartido. |
| `proyecto.html` | Portada del proyecto académico: piezas, documentos y sprints. |
| `img/` | Escena de la estación, carteles, puertas y tapa en versión liviana. |
| `prototipo.html` | Prototipo navegable de baja fidelidad, once pantallas conectadas. |
| `flujo.html` | Mapa de flujo de usuario con las convenciones de lectura. |
| `reproductor.html` | Estudio estético del reproductor persistente, cuatro estados. |
| `docs/anteproyecto-wireframes.pdf` | Entrega del anteproyecto, 18 láminas. |
| `docs/mapa-de-flujo.pdf` | Diagrama de flujo en A3. |

## Estado

| Sprint | Entrega | Estado |
|---|---|---|
| 1 · 3–14 ago | Reuniones internas y concepto | Completado |
| 2 · 17–28 ago | Web — Diseño y arquitectura | Completado |
| 3 · 31 ago–11 sep | Anteproyecto | Completado |
| 4 · 14–25 sep | Web — Programación del prototipo | Completado |
| 5 · 28 sep–9 oct | Estética, redes y posteos | En curso |
| 6 · 12–23 oct | Realidad aumentada — Programación | Planificado |
| 7 · 26 oct–6 nov | Realidad aumentada — Diseño | Planificado |

Presentación final: **24 de noviembre de 2026**.

## Sistema visual

Definido en Figma y aplicado en código.

**Color**

| Nombre | Valor |
|---|---|
| azul sueter | `#2c61b2` |
| rojo sueter | `#d24426` |
| amarillo sueter | `#e8c229` |
| crema sueter | `#efe9de` |

**Tipografía** — tres familias, tres roles, nunca mezcladas dentro de un mismo bloque.

- **Bebas Neue** — títulos, botones, navegación y logotipo. Siempre en mayúsculas.
- **Geist / Geist Mono** — interfaz, cuerpo de texto, datos y metadatos.
- **Caveat** — acento manuscrito: citas, notas al margen y stickers. Nunca en elementos clickeables.

Las tres son gratuitas y tienen licencia para web.

## Cómo trabajar sobre esto

Las páginas son HTML autocontenido: no hay build, ni dependencias, ni instalación.
Se abren haciendo doble clic en `index.html`; cada sección también tiene su dirección propia (`index.html#discos`, `#diario`, etc.). Si se abre una sección suelta, redirige a la estación. Para publicar un cambio, se sube el archivo
modificado a la rama `main` y GitHub Pages lo actualiza solo en un par de minutos.

### Tu versión: configuración

La generación corre en Vercel (`sueter7-villa-quien.vercel.app/api/generate`); GitHub Pages es estático y le pide la imagen a esa dirección.
En Vercel → Settings → Environment Variables:

| Variable | Obligatoria | Qué es |
|---|---|---|
| `OPENAI_API_KEY` | Sí | Key de OpenAI. Sin ella la página funciona en modo demo (muestra la imagen de referencia). |
| `OPENAI_IMAGE_MODEL` | No | Modelo de imagen; por defecto `gpt-image-2.5-sunburst`. |

Nunca se usa `NEXT_PUBLIC_…` ni se manda la key al navegador.

## Pendiente

- Ilustraciones de tapa y las tres tapas de otros lanzamientos.
- Letras con marcas de tiempo, por canción.
- Textos de las nueve referencias secretas y las cinco cartas.
