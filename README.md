# ⚡ Circuito Cerrado

Un juego puzzle web minimalista de temática electrónica desarrollado con **HTML5, CSS3 y JavaScript puro (Vanilla JS)**, sin librerías externas ni motores de videojuegos. Funciona de manera inmediata abriendo `index.html` en cualquier navegador moderno.

---

## 🎮 Concepto y Reglas del Juego

El objetivo es conectar el **polo positivo (+)** y el **polo negativo (−)** de una batería a una **lámpara incandescente** formando un circuito cerrado continuo para encenderla, evitando a toda costa provocar un cortocircuito.

- **Cuadrícula de 5×5:** Contiene cables rectos, esquinas en L, bifurcaciones en T, la batería y la lámpara.
- **Giro en 90°:** Cada clic sobre una pieza no fija la gira 90 grados en sentido horario con una transición suave. Cada clic cuenta como un movimiento en el contador.
- **Piezas fijas (🔒):** Marcadas con un candado y un borde especial; no pueden girarse y actúan como anclas o restricciones del circuito.
- **Circuito Cerrado (Victoria):** Existe un camino continuo desde el `(+)` de la batería, pasando a través de la lámpara, hasta el `(−)` de la batería. La lámpara se enciende radiante y se completa el nivel.
- **Cortocircuito (⚠️ Peligro):** Ocurre cuando el polo `(+)` se conecta directamente con el polo `(−)` de la batería **sin pasar por la lámpara**. En ese caso los cables parpadean en rojo neón, suena una alarma de advertencia y el nivel no puede ganarse hasta que se rompa esa conexión directa.
- **Energización en tiempo real:** Los cables conectados al polo `(+)` se iluminan en color cian para visualizar en vivo hasta dónde llega la corriente eléctrica mientras giras las piezas.

---

## 🧠 ¿Cómo funciona el algoritmo? (Explicación simple)

Si tienes que explicar cómo funciona internamente el juego a otra persona o en una entrevista técnica, aquí tienes la explicación en palabras claras y cotidianas:

> *"El juego modela el tablero como una red o **grafo de conexiones**. Cada casilla sabe qué lados tiene abiertos (arriba, derecha, abajo o izquierda) según su rotación. Dos casillas están conectadas solo si ambas apuntan mutuamente con un terminal abierto.*
> 
> *Cada vez que el jugador hace un clic, el juego ejecuta un algoritmo clásico de **Búsqueda en Anchura (BFS)** en dos pasos:*
> 
> 1. ***Detección de Cortocircuito:*** *Imaginamos que soltamos electrones desde el polo positivo (+). Seguimos todos los cables conectados, pero **con una regla clave: no se permite cruzar por dentro de la lámpara**. Si ese camino de cables logra tocar directamente el polo negativo (−), significa que la corriente encontró un atajo sin resistencia: **¡Cortocircuito!** El juego activa la alerta roja y detiene la evaluación.*
> 
> 2. ***Detección de Circuito Cerrado:*** *Si no hubo cortocircuito, verificamos qué cables toca el polo (+) y qué cables toca el polo (−). Si un extremo de la lámpara está tocando los cables del (+) y el otro extremo está tocando los cables del (−), la corriente está obligada a atravesar el filamento: **¡Circuito cerrado!** La lámpara se ilumina y el nivel se completa."*

---

## 🕹️ Guía de los 5 Niveles

El juego incluye 5 niveles progresivos diseñados a mano:

1. **Nivel 1 — Primer Flujo:** Un bucle rectangular simple. Ideal para familiarizarse con las rotaciones y ver cómo viaja la energía.
2. **Nivel 2 — Camino Sinuoso:** Un trazado perimetral más largo con múltiples esquinas que enseña a esquivar vacíos.
3. **Nivel 3 — La Bifurcación:** Introduce cables en T y piezas fijas intermedias que bloquean caminos directos.
4. **Nivel 4 — El Atajo Peligroso:** ¡Nivel trampa! Incluye un cable puente central. Si giras las piezas en T hacia el centro, caerás instantáneamente en un cortocircuito. La solución exige evitar el atajo y rodear por la lámpara.
5. **Nivel 5 — Red de Precisión:** El rompecabezas maestro con múltiples bifurcaciones, distractores y piezas bloqueadas.

> **Tip para desarrolladores / depuración:** Si abres la consola de desarrollador del navegador (F12) y escribes `resolverNivel()`, el juego resolverá automáticamente el nivel actual mostrando la configuración ganadora.

---

## 🚀 Cómo publicarlo gratis en GitHub Pages

Para compartir tu juego online con amigos o agregarlo a tu portafolio, puedes subirlo a GitHub en pocos minutos:

1. **Crea un repositorio en GitHub:**
   - Entra a [github.com](https://github.com) e inicia sesión.
   - Haz clic en **New repository**.
   - Nómbralo por ejemplo: `circuito-cerrado`.
   - Selecciona **Public** y haz clic en **Create repository**.

2. **Sube los archivos del proyecto:**
   - En la página de tu repositorio, puedes arrastrar directamente los 4 archivos (`index.html`, `style.css`, `script.js` y `README.md`) haciendo clic en **uploading an existing file**, o bien subirlos con Git desde tu terminal:
   ```bash
   git init
   git add .
   git commit -m "Versión inicial de Circuito Cerrado"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/circuito-cerrado.git
   git push -u origin main
   ```

3. **Activa GitHub Pages:**
   - Ve a la pestaña **Settings** (Configuración) de tu repositorio.
   - En el menú lateral izquierdo, haz clic en **Pages**.
   - Bajo la sección **Build and deployment > Branch**, selecciona la rama `main` y la carpeta `/ (root)`.
   - Haz clic en **Save**.

4. **¡Listo!** En 1 o 2 minutos, GitHub te dará una URL pública del tipo:
   `https://tu-usuario.github.io/circuito-cerrado/`

---

## 🛠️ Tecnologías Utilizadas

- **HTML5:** Estructura accesible, semántica y responsiva.
- **CSS3:** Diseño estilo PCB (placa de circuitos impresos oscura), animaciones con `@keyframes`, sombras de neón dinámicas (`drop-shadow`) y CSS Grid.
- **JavaScript (ES6+):** Programación orientada a objetos modular, algoritmos de grafos (BFS) y síntesis de audio nativa con **Web Audio API** (sin archivos de audio externos).
- **SVG Inline:** Gráficos vectoriales ligeros generados en tiempo real para bornes, filamentos y pistas de cobre.

---

## ℹ️ Sobre este proyecto

Este proyecto es un **prototipo personal reciente** creado con fines educativos y de entretenimiento. Para su diseño de niveles, formulación de algoritmos y pulido de interfaz visual se utilizó asistencia de Inteligencia Artificial (**Claude**). El objetivo fue demostrar cómo construir una experiencia de juego interactiva, visualmente atractiva y técnicamente sólida utilizando exclusivamente tecnologías web estándar sin ninguna dependencia externa.
