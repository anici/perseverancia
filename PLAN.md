# Paisaje de Marte con Vite + Three.js

## Contexto
`D:\perseverancia` está vacío (solo `CLAUDE.md`). Hay que crear un proyecto con Vite y Three.js con una escena cinematográfica de Marte: dunas, rocas, cielo caramelo con polvo, un sol de tarde cálido con sombras suaves, y Fobos y Deimos. El servidor de desarrollo tiene que estar en marcha lo antes posible para que lo veas en vivo en el navegador de Cursor, y `npm run check` sirve para verificar la página (captura + errores de consola).

**Hallazgo importante:** Node/npm **no está instalado** (no está en el PATH ni en las rutas habituales). Chrome sí está en `C:\Program Files\Google\Chrome\Application\chrome.exe`, y winget está disponible.

## Paso 0: Node (antes de que empiece a contar el reloj de 2 min)
- `winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements` (aprox. 1 min).
- La sesión actual no verá el PATH nuevo, así que en esta sesión uso la ruta completa `C:\Program Files\nodejs\` (la antepongo a `$env:PATH` en cada comando).

## Paso 1: algo visible en menos de 2 min
- Monto el proyecto a mano (sin el create-vite interactivo): `package.json` (type module; scripts `dev`, `build`, `check`), `index.html`, `src/main.js`, `.gitignore`.
- `npm i three` y `npm i -D vite playwright-core`. Uso `playwright-core`, que **nunca descarga navegadores**.
- Escena mínima: terreno con ruido + cielo con degradado + luz direccional cálida.
- Arranco `npx vite --port 5173 --strictPort` en segundo plano y te paso `http://localhost:5173` para Cursor. El HMR actualiza la vista con cada mejora.

## Paso 2: escena completa (archivos en `src/`)
- `main.js`: renderer (sRGB, ACESFilmic, `PCFSoftShadowMap`), cámara baja mirando hacia el sol, `OrbitControls` con damping, resize y bucle. Pone `window.__sceneReady = true` tras unos frames.
- `terrain.js`: plano de aprox. 2 km con 256² segmentos. Dunas con ruido ridged orientado según el viento + fbm (`SimplexNoise` de `three/examples/jsm`). Colores de vértice óxido/ocre según altura y pendiente. `MeshStandardMaterial` mate. Recibe sombras. Exporta `heightAt(x,z)`.
- `rocks.js`: icosaedros deformados con ruido en un `InstancedMesh` (unos 300), apoyados con `heightAt`, más densos cerca de la cámara. Proyectan y reciben sombras.
- `sky.js`: esfera con `ShaderMaterial`: degradado caramelo/butterscotch, horizonte polvoriento, disco solar pequeño con halo azulado (el atardecer real de Marte) y bruma. Además `scene.fog` exponencial del mismo color.
- `lighting.js`: `DirectionalLight` cálida, sol a unos 10° de elevación, `shadow.mapSize` 2048, cámara de sombra ajustada al primer plano y `radius` para suavizar. `HemisphereLight` caramelo/marrón de relleno.
- `moons.js`: Fobos (malla irregular, más grande) y Deimos (pequeña), iluminadas por el sol, en el encuadre inicial sobre el horizonte. El tamaño se exagera un poco por estética.
- `dust.js`: `Points` de polvo a la deriva con transparencia aditiva suave.
- Post-procesado: `EffectComposer` + `UnrealBloomPass` leve (sol/halo) + `OutputPass`.

## Paso 3: `npm run check` (`scripts/check.mjs`)
- Levanta su propio servidor Vite por API (`createServer`, puerto 5199) para no depender del dev server.
- Lanza `chromium.launch({ executablePath: <Chrome instalado>, headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] })` para que funcione WebGL en headless.
- Recoge `console` de tipo error/warning, `pageerror` y `requestfailed`. Espera `window.__sceneReady` y guarda la captura en `screenshots/check.png` (1600×900).
- Muestra la lista de errores y sale con código 1 si hay alguno.

## Rondas de revisión (máximo 3)
Tras el paso 2 y tras cada mejora grande: `npm run check`, leo `screenshots/check.png` y compruebo dunas, rocas, cielo caramelo con polvo, sol cálido con sombras suaves y las dos lunas visibles. Después corrijo (encuadre, exposición, tamaño de las lunas, sombras, etc.). Termino cuando no haya errores y la captura muestre todo.

## Cierre
- Actualizo `CLAUDE.md` con el stack, los comandos (`npm run dev`, `npm run build`, `npm run check`) y la arquitectura de `src/`.
- Dejo el servidor dev corriendo.

## Verificación
- `npm run check` termina con código 0 y "0 errores".
- Reviso `screenshots/check.png` a ojo con todos los elementos pedidos.
- `npm run build` compila sin errores.
