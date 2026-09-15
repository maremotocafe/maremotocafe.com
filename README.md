# maremotocafe.com

Web de **Maremoto Beach** (Zaragoza): una página estática con la carta del bar y los datos de contacto.

Está pensada para no costar nada ni necesitar mantenimiento: se publica gratis en GitHub Pages y lo único que hay que renovar es el dominio.

## Dónde está cada cosa

| Qué                         | Dónde                                                                  | Coste                            |
| --------------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| Código, carta y publicación | GitHub, organización [`maremotocafe`](https://github.com/maremotocafe) | Gratis                           |
| Dominio `maremotocafe.com`  | Namecheap (DNS apuntando a GitHub Pages)                               | ~12 €/año, renovación automática |
| Correo y redes sociales     | Cuentas del negocio (`maremotocafe@hotmail.com`, Facebook, Instagram)  | —                                |

No hay más servicios, cuotas ni servidores.

## Cómo funciona la publicación

1. Editas la carta en tu ordenador con el editor (ver abajo).
2. Pulsas **Subir cambios**. Eso guarda los cambios en GitHub.
3. GitHub reconstruye la web y la publica en 2–3 minutos. Puedes ver el progreso en la pestaña [Actions](https://github.com/maremotocafe/maremotocafe.com/actions): un ✅ verde significa que ya está publicada.

## Editar la carta

### Instalación en Windows (una sola vez)

Necesitas una cuenta de GitHub que sea miembro de la organización `maremotocafe`.

1. Abre **PowerShell** (búscalo en el menú Inicio; no hace falta ser administrador).
2. Pega esta línea y pulsa Intro:

   ```powershell
   irm https://raw.githubusercontent.com/maremotocafe/maremotocafe.com/master/scripts/setup-windows.ps1 | iex
   ```

3. El script instala Git y Node.js, descarga el proyecto en `C:\Users\<tu usuario>\maremotocafe.com`, te pregunta tu nombre y email (para firmar los cambios) y crea el acceso directo **Editar carta** en el escritorio.

Si el script falla, se puede hacer a mano: instalar [Git for Windows](https://git-scm.com/download/win) y [Node.js LTS](https://nodejs.org) con las opciones por defecto, abrir PowerShell y ejecutar `git clone https://github.com/maremotocafe/maremotocafe.com.git` dentro de tu carpeta de usuario. Después, doble clic en `Editar carta.cmd` dentro de la carpeta descargada.

En Mac o Linux: instala Node.js y Git, clona el proyecto y ejecuta `./run_local.sh`.

### Uso diario

1. Doble clic en **Editar carta**. Se abre una ventana negra (déjala abierta) y, unos segundos después, el navegador con la web en `http://localhost:4321`.
2. Arriba verás una banda amarilla: **MODO EDICIÓN ACTIVADO**. Solo tú ves esa banda; los clientes ven la web normal.
3. Edita lo que quieras:
   - Pulsa **Editar** (el lápiz) en un producto para cambiar nombre, precio, foto, ingredientes, alérgenos, etc. Desde ahí también se elimina.
   - **Nuevo Item** para añadir un producto. **Cambiar Categorías** para las categorías y subcategorías.
   - Arrastra un producto sobre otro para cambiar el orden.
   - Las fotos se suben desde el propio editor del producto.
4. Cuando termines, pulsa **Subir cambios**. La primera vez se abrirá una ventana para iniciar sesión en GitHub.
5. Espera 2–3 minutos y comprueba [maremotocafe.com](https://maremotocafe.com) (si no ves el cambio, recarga con Ctrl+F5).
6. Cierra la ventana negra.

Botones de la banda amarilla:

| Botón                | Qué hace                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Mostrar cambios**  | Lista lo que has cambiado y aún no has subido.                                                      |
| **Bajar cambios**    | Descarga cambios hechos desde otro ordenador. Si aparece el aviso "Hay cambios nuevos", pulsa esto. |
| **Subir cambios**    | Guarda y publica tus cambios.                                                                       |
| **Resetear cambios** | Descarta TODO lo que hayas cambiado y no subido, y vuelve a la versión publicada.                   |

## Si algo falla

- **"Hay cambios nuevos"** al abrir el editor: pulsa **Bajar cambios**. Alguien subió cambios desde otro ordenador.
- **Error al subir cambios**: pulsa **Bajar cambios** y vuelve a intentarlo. Si sigue fallando, **Mostrar cambios** te dice qué hay pendiente; **Resetear cambios** lo descarta todo y vuelve a la versión publicada (perderás lo que no hayas subido).
- **El editor no arranca**: borra la carpeta `node_modules` dentro de `C:\Users\<tu usuario>\maremotocafe.com` y vuelve a abrir **Editar carta**. Si sigue sin funcionar, ejecuta otra vez la línea de instalación de PowerShell.
- **La web no se actualiza** tras subir cambios: mira la pestaña [Actions](https://github.com/maremotocafe/maremotocafe.com/actions). Si hay una ❌ roja, algo ha fallado al construir la web. Abre el fallo y lee el mensaje; lo habitual es un dato mal escrito en la carta. Si no está claro, un desarrollador lo resuelve en minutos.
- **Para cualquier otra cosa**, cualquier desarrollador web puede trabajar con este proyecto: es un proyecto estándar de [Astro](https://astro.build). Enséñale este archivo y `AGENTS.md`. Cada pocos años puede hacer falta actualizar las versiones de las acciones en `.github/workflows/`; es un cambio de cinco minutos.

## Si en el futuro quieres rediseñar la web

Este proyecto no te ata a nada. Lo que tiene valor y conviene conservar:

- El **dominio** (`maremotocafe.com`, en Namecheap). Para usarlo con otra web, cambia los registros DNS desde Namecheap.
- La **carta**: `src/data/menu/` (productos y categorías en JSON) y `src/assets/carta/` (fotos).
- El **logo**: `public/images/` y el archivo fuente `dev/logo_square.xcf`.

Si haces la web nueva con un constructor (Wix, Squarespace, etc.), apunta el dominio allí y archiva este repositorio. Si la hace un desarrollador, dale acceso a la organización de GitHub.

## Para desarrolladores

Astro 5 (salida estática) + React 19 + Tailwind CSS 4 + TypeScript. Más detalles en [`AGENTS.md`](AGENTS.md).

| Comando          | Qué hace                               |
| ---------------- | -------------------------------------- |
| `npm ci`         | Instala dependencias                   |
| `npm run dev`    | Servidor local con el panel de edición |
| `npm run build`  | Build de producción en `dist/`         |
| `npm run check`  | `astro check` + `tsc --noEmit`         |
| `npm run format` | Prettier                               |

- El panel de edición (`src/admin/`) solo existe en `npm run dev`. Escribe los JSON de `src/data/menu/` y las fotos de `src/assets/carta/` en disco, y hace `git commit` + `git push` desde la propia interfaz.
- Cada push a `master` ejecuta CI (`astro check` + `build`) y despliega `dist/` a la rama `gh-pages`, que GitHub Pages sirve con el dominio `maremotocafe.com` (registros A en Namecheap apuntando a las IPs de GitHub Pages).

## Licencia

[GPL-3.0](LICENSE). El diseño original se basa en [Meghna Hugo](https://github.com/themefisher/meghna-hugo) (CC BY 3.0).
