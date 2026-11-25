# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Paisaje de Marte en tiempo real con **Vite + Three.js** (JS plano, sin framework ni TypeScript). No hay lint ni tests unitarios; la verificación es `npm run check`.

## Comandos

- `npm run dev`: servidor de desarrollo en **http://localhost:5180** (el 5173 lo ocupa Docker/WSL en esta máquina).
- `npm run build`: build de producción en `dist/`. El aviso de chunk > 500 kB es Three.js y es esperado.
- `npm run check`: levanta su propio Vite (puerto 5199), abre la página en el **Chrome instalado** en modo headless mediante `playwright-core` (nunca descarga navegadores; WebGL vía SwiftShader), guarda `screenshots/check.png` y lista los errores/warnings de consola, `pageerror` y `requestfailed`. Sale con código 1 si hay alguno. Ruta de Chrome alternativa: variable `CHROME_PATH`.

Node se instaló con winget en `C:\Program Files\nodejs`. Si una shell vieja no lo encuentra, antepón esa ruta al `PATH`.

## Arquitectura (`src/`)

- `main.js`: renderer (ACESFilmic, sombras PCF), elige la posición de cámara en una cresta cercana, encuadra con el sol a la izquierda y las lunas a la derecha, OrbitControls, post-procesado (`RenderPass` → `UnrealBloomPass` → `OutputPass`) y bucle. Pone `window.__sceneReady = true` tras 5 frames; `check.mjs` espera esa bandera.
- `terrain.js`: `heightAt(x, z)` determinista (dunas en diente de sierra orientadas al viento + colinas fbm + montañas lejanas) y malla con colores por vértice. El resto de módulos usa `heightAt` para apoyar objetos.
- `sky.js`: domo con `ShaderMaterial` (degradado caramelo, disco solar, halo, bruma en el horizonte). Exporta `SUN_DIR` (fuente única de la dirección del sol) y `SKY_FOG`.
- `lighting.js`: luz direccional cálida con sombras + hemisférica.
- `rocks.js`: 4 geometrías de roca deformadas con ruido (`mergeVertices` para normales suaves) en `InstancedMesh`, distribuidas delante de la cámara.
- `moons.js`: Fobos y Deimos colocadas por ángulo (yaw/elevación) relativo a la cámara para que siempre queden en el encuadre inicial.
- `dust.js`: `Points` de polvo que siguen a la cámara y derivan con el viento.

Gotcha de Three r187: `PCFSoftShadowMap` y `THREE.Clock` están retirados o deprecados y emiten warnings, lo que hace fallar `check`.
