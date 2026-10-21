/**
 * ============================================================================
 * CIRCUITO CERRADO - LÓGICA DEL JUEGO Y ANÁLISIS DE GRAFOS
 * ============================================================================
 * Juego puzzle en JavaScript puro sin dependencias externas.
 * 
 * CONCEPTOS CLAVE DEL ALGORITMO:
 * 1. Cada casilla del tablero 5x5 tiene puertos de conexión según su rotación:
 *    0: Arriba (Norte), 1: Derecha (Este), 2: Abajo (Sur), 3: Izquierda (Oeste).
 * 2. Dos casillas contiguas están conectadas eléctricamente si y solo si ambas
 *    poseen un terminal abierto que apunta a la otra de forma recíproca.
 * 3. En cada turno se ejecuta una Búsqueda en Anchura (BFS):
 *    - Primero verifica si existe un "Cortocircuito" (camino de cables entre + y -
 *      sin atravesar la lámpara).
 *    - Luego verifica si existe un "Circuito Cerrado" (camino desde + hacia la lámpara
 *      y desde la lámpara hacia el -, completando el bucle).
 */

'use strict';

// ============================================================================
// 1. CONSTANTES Y CONFIGURACIÓN DE DIRECCIONES
// ============================================================================

/**
 * Vectores de dirección en la cuadrícula [dr, dc] y su dirección opuesta complementaria.
 * Dirección 0: Arriba  -> Opuesto: 2 (Abajo)
 * Dirección 1: Derecha -> Opuesto: 3 (Izquierda)
 * Dirección 2: Abajo   -> Opuesto: 0 (Arriba)
 * Dirección 3: Izquierda -> Opuesto: 1 (Derecha)
 */
const DIRS = [
  { dr: -1, dc: 0, opp: 2 }, // 0: Arriba
  { dr: 0, dc: 1, opp: 3 },  // 1: Derecha
  { dr: 1, dc: 0, opp: 0 },  // 2: Abajo
  { dr: 0, dc: -1, opp: 1 }  // 3: Izquierda
];

/**
 * Retorna los puertos activos de una pieza dada su rotación (0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°).
 */
function getPorts(type, rot) {
  let basePorts = [];
  switch (type) {
    case 'straight':
      basePorts = [0, 2]; // Recto vertical base
      break;
    case 'corner':
      basePorts = [0, 1]; // Esquina Arriba-Derecha base (┌)
      break;
    case 't-junction':
      basePorts = [3, 0, 1]; // T apuntando hacia abajo base (┴)
      break;
    case 'battery':
      basePorts = [0, 2]; // 0 es el polo (+), 2 es el polo (−)
      break;
    case 'lamp':
      basePorts = [0, 2]; // 0 es Terminal A, 2 es Terminal B
      break;
    case 'empty':
    default:
      return [];
  }
  // Al rotar 90° en sentido horario, cada puerto `p` se convierte en `(p + rot) % 4`
  return basePorts.map(p => (p + rot) % 4);
}

// ============================================================================
// 2. DEFINICIÓN DE LOS 5 NIVELES DISEÑADOS A MANO
// ============================================================================

const LEVELS_DATA = [
  // --------------------------------------------------------------------------
  // NIVEL 1: "Primer Flujo" (Tutorial básico)
  // Bucle rectangular directo. La batería y la lámpara están fijas.
  // --------------------------------------------------------------------------
  {
    id: 1,
    name: "Primer Flujo",
    description: "Conecta el polo (+) y (−) a la lámpara girando las 6 piezas de cable.",
    pieces: [
      { r: 2, c: 1, type: 'battery', rot: 0, fixed: true },
      { r: 2, c: 3, type: 'lamp', rot: 0, fixed: true },
      // Esquinas y tramos superiores e inferiores desordenados
      { r: 1, c: 1, type: 'corner', rot: 0, fixed: false },
      { r: 1, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 1, c: 3, type: 'corner', rot: 0, fixed: false },
      { r: 3, c: 3, type: 'corner', rot: 1, fixed: false },
      { r: 3, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 3, c: 1, type: 'corner', rot: 2, fixed: false }
    ],
    // Solución esperada de rotaciones:
    solutionRotations: {
      '1,1': 1, '1,2': 1, '1,3': 2,
      '3,3': 3, '3,2': 1, '3,1': 0
    }
  },

  // --------------------------------------------------------------------------
  // NIVEL 2: "Camino Sinuoso"
  // Circuito más amplio que recorre el perímetro exterior con cables en L y rectos.
  // --------------------------------------------------------------------------
  {
    id: 2,
    name: "Camino Sinuoso",
    description: "Un trazado más amplio por los extremos del circuito.",
    pieces: [
      { r: 2, c: 1, type: 'battery', rot: 0, fixed: true },
      { r: 2, c: 4, type: 'lamp', rot: 0, fixed: true },
      // Rama superior
      { r: 1, c: 1, type: 'straight', rot: 1, fixed: false },
      { r: 0, c: 1, type: 'corner', rot: 3, fixed: false },
      { r: 0, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 0, c: 3, type: 'straight', rot: 0, fixed: false },
      { r: 0, c: 4, type: 'corner', rot: 0, fixed: false },
      { r: 1, c: 4, type: 'straight', rot: 1, fixed: false },
      // Rama inferior
      { r: 3, c: 1, type: 'straight', rot: 1, fixed: false },
      { r: 4, c: 1, type: 'corner', rot: 2, fixed: false },
      { r: 4, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 4, c: 3, type: 'straight', rot: 0, fixed: false },
      { r: 4, c: 4, type: 'corner', rot: 1, fixed: false },
      { r: 3, c: 4, type: 'straight', rot: 1, fixed: false }
    ],
    solutionRotations: {
      '1,1': 0, '0,1': 1, '0,2': 1, '0,3': 1, '0,4': 2, '1,4': 0,
      '3,1': 0, '4,1': 0, '4,2': 1, '4,3': 1, '4,4': 3, '3,4': 0
    }
  },

  // --------------------------------------------------------------------------
  // NIVEL 3: "La Bifurcación"
  // Introduce piezas en T y componentes fijos que actúan como barreras.
  // --------------------------------------------------------------------------
  {
    id: 3,
    name: "La Bifurcación",
    description: "Piezas en T y cables bloqueados. Cuidado con hacia dónde derivas la energía.",
    pieces: [
      { r: 2, c: 1, type: 'battery', rot: 0, fixed: true },
      { r: 2, c: 4, type: 'lamp', rot: 0, fixed: true },
      // Rama superior
      { r: 1, c: 1, type: 'corner', rot: 2, fixed: false },
      { r: 1, c: 2, type: 't-junction', rot: 0, fixed: false },
      { r: 2, c: 2, type: 'straight', rot: 1, fixed: true }, // Fijo horizontal (bloqueo central)
      { r: 1, c: 3, type: 'straight', rot: 0, fixed: false },
      { r: 1, c: 4, type: 'corner', rot: 3, fixed: false },
      // Rama inferior
      { r: 3, c: 1, type: 'corner', rot: 3, fixed: false },
      { r: 3, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 3, c: 3, type: 't-junction', rot: 2, fixed: false },
      { r: 2, c: 3, type: 'straight', rot: 0, fixed: true }, // Fijo vertical
      { r: 3, c: 4, type: 'corner', rot: 1, fixed: false }
    ],
    solutionRotations: {
      '1,1': 1, '1,2': 2, '1,3': 1, '1,4': 2,
      '3,1': 0, '3,2': 1, '3,3': 0, '3,4': 3
    }
  },

  // --------------------------------------------------------------------------
  // NIVEL 4: "El Atajo Peligroso"
  // ¡Trampa de cortocircuito! Hay un cable puente vertical en (2,1).
  // Si las piezas en T apuntan hacia el centro, el circuito entra en cortocircuito directo.
  // --------------------------------------------------------------------------
  {
    id: 4,
    name: "El Atajo Peligroso",
    description: "¡Peligro de cortocircuito! Evita conectar el puente central entre los polos.",
    pieces: [
      { r: 2, c: 0, type: 'battery', rot: 0, fixed: true },
      { r: 2, c: 3, type: 'lamp', rot: 0, fixed: true },
      { r: 1, c: 0, type: 'corner', rot: 2, fixed: false },
      { r: 3, c: 0, type: 'corner', rot: 3, fixed: false },
      // Piezas T trampa
      { r: 1, c: 1, type: 't-junction', rot: 3, fixed: false }, // En rot 3 apunta hacia abajo
      { r: 2, c: 1, type: 'straight', rot: 0, fixed: true },   // Puente directo vertical
      { r: 3, c: 1, type: 't-junction', rot: 0, fixed: false }, // En rot 0 apunta hacia arriba
      // Camino seguro largo hacia la lámpara
      { r: 1, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 1, c: 3, type: 'corner', rot: 1, fixed: false },
      { r: 3, c: 3, type: 'corner', rot: 0, fixed: false },
      { r: 3, c: 2, type: 'straight', rot: 0, fixed: false }
    ],
    solutionRotations: {
      '1,0': 1, '3,0': 0,
      '1,1': 0, // [3, 0, 1] no apunta hacia abajo (evita el puente)
      '3,1': 2, // [1, 2, 3] no apunta hacia arriba (evita el puente)
      '1,2': 1, '1,3': 2,
      '3,3': 3, '3,2': 1
    }
  },

  // --------------------------------------------------------------------------
  // NIVEL 5: "Red de Precisión"
  // Desafío final: múltiples bifurcaciones en T, componentes fijos y distractores.
  // --------------------------------------------------------------------------
  {
    id: 5,
    name: "Red de Precisión",
    description: "El circuito maestro. Coordina ambas ramas sin perder energía ni generar fallas.",
    pieces: [
      { r: 2, c: 0, type: 'battery', rot: 0, fixed: true },
      { r: 2, c: 4, type: 'lamp', rot: 0, fixed: true },
      // Rama (+)
      { r: 1, c: 0, type: 'corner', rot: 3, fixed: false },
      { r: 1, c: 1, type: 't-junction', rot: 0, fixed: false },
      { r: 0, c: 1, type: 'straight', rot: 1, fixed: true }, // Fijo superior
      { r: 1, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 1, c: 3, type: 't-junction', rot: 1, fixed: false },
      { r: 1, c: 4, type: 'corner', rot: 0, fixed: false },
      // Rama (-)
      { r: 3, c: 0, type: 'corner', rot: 2, fixed: false },
      { r: 3, c: 1, type: 't-junction', rot: 3, fixed: false },
      { r: 3, c: 2, type: 'straight', rot: 0, fixed: false },
      { r: 3, c: 3, type: 't-junction', rot: 1, fixed: false },
      { r: 3, c: 4, type: 'corner', rot: 1, fixed: false },
      // Elementos fijos
      { r: 2, c: 1, type: 'corner', rot: 2, fixed: true },
      { r: 2, c: 3, type: 'straight', rot: 1, fixed: true }
    ],
    solutionRotations: {
      '1,0': 1, '1,1': 2, '1,2': 1, '1,3': 2, '1,4': 2,
      '3,0': 0, '3,1': 0, '3,2': 1, '3,3': 0, '3,4': 3
    }
  }
];

// ============================================================================
// 3. SINTETIZADOR DE EFECTOS DE SONIDO (WEB AUDIO API PURA)
// ============================================================================

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /** Sonido de clic mecánico de relé */
  playRotate() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Zumbido de advertencia por cortocircuito */
  playShortCircuit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now); // Nota grave zumbante
    osc.frequency.setValueAtTime(105, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /** Acorde armónico de victoria */
  playWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde C mayor (Do, Mi, Sol, Do')
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + (idx * 0.08);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.45);
    });
  }
}

// ============================================================================
// 4. GENERADOR DE GRÁFICOS SVG INLINE PARA CADA PIEZA
// ============================================================================

/**
 * Retorna el marcado SVG para cada componente.
 * Se diseñan en un viewBox de 100x100 con estilos CSS reutilizables.
 */
function createPieceSVG(type) {
  switch (type) {
    case 'straight':
      // Cable recto de borde a borde (arriba 50,0 a abajo 50,100) con punto de soldadura
      return `
        <svg viewBox="0 0 100 100" class="piece-svg">
          <line x1="50" y1="0" x2="50" y2="100" class="wire-path" />
          <circle cx="50" cy="50" r="10" class="wire-pad" />
        </svg>
      `;

    case 'corner':
      // Cable en L (esquina): conecta Arriba (50,0) con Derecha (100,50)
      return `
        <svg viewBox="0 0 100 100" class="piece-svg">
          <path d="M 50 0 L 50 50 L 100 50" class="wire-path" />
          <circle cx="50" cy="50" r="10" class="wire-pad" />
        </svg>
      `;

    case 't-junction':
      // Bifurcación en T: conecta Izquierda (0,50), Derecha (100,50) y Arriba (50,0)
      return `
        <svg viewBox="0 0 100 100" class="piece-svg">
          <path d="M 0 50 L 100 50 M 50 50 L 50 0" class="wire-path" />
          <circle cx="50" cy="50" r="11" class="wire-pad" />
        </svg>
      `;

    case 'battery':
      // Batería: Polo (+) arriba con borne rojo y polo (−) abajo con borne azul
      return `
        <svg viewBox="0 0 100 100" class="piece-svg">
          <!-- Terminales externos hacia el borde -->
          <line x1="50" y1="0" x2="50" y2="24" stroke="#ef4444" stroke-width="12" stroke-linecap="round" />
          <line x1="50" y1="76" x2="50" y2="100" stroke="#3b82f6" stroke-width="12" stroke-linecap="round" />
          
          <!-- Cuerpo de la batería -->
          <rect x="24" y="24" width="52" height="52" rx="8" class="battery-body" />
          
          <!-- Capuchón positivo (+) -->
          <rect x="40" y="18" width="20" height="8" rx="2" class="terminal-pos" />
          <text x="50" y="39" class="terminal-text">+</text>
          
          <!-- Capuchón negativo (−) -->
          <rect x="38" y="74" width="24" height="6" rx="2" class="terminal-neg" />
          <text x="50" y="63" class="terminal-text">−</text>
        </svg>
      `;

    case 'lamp':
      // Lámpara: Conectores a los extremos (arriba y abajo), ampolla de vidrio y filamento
      return `
        <svg viewBox="0 0 100 100" class="piece-svg">
          <line x1="50" y1="0" x2="50" y2="26" class="wire-path" />
          <line x1="50" y1="74" x2="50" y2="100" class="wire-path" />
          
          <!-- Ampolla de la bombilla -->
          <circle cx="50" cy="50" r="24" class="lamp-glass" />
          <!-- Filamento interno -->
          <path d="M 43 62 L 43 48 Q 50 36 57 48 L 57 62" class="lamp-filament" />
          <!-- Casquillo de sujeción -->
          <rect x="42" y="70" width="16" height="6" rx="2" class="lamp-base" />
        </svg>
      `;

    case 'empty':
    default:
      return `<svg viewBox="0 0 100 100" class="piece-svg"></svg>`;
  }
}

// ============================================================================
// 5. MOTOR DE EVALUACIÓN DE CIRCUITOS (ALGORITMO DE GRAFOS)
// ============================================================================

/**
 * Evalúa el estado eléctrico completo de la cuadrícula:
 * 
 * ¿CÓMO FUNCIONA? (En palabras simples):
 * 1. Conexión local: Dos casillas vecinas están unidas si sus puertos coinciden.
 * 2. Detección de Cortocircuito: Usando BFS desde el polo (+) de la batería,
 *    recorremos todos los cables. Si podemos llegar al polo (−) SIN entrar
 *    por el filamento de la lámpara, la energía viaja sin resistencia: ¡CORTOCIRCUITO!
 * 3. Detección de Circuito Cerrado: Si no hay cortocircuito, verificamos qué cables
 *    alcanza el polo (+) y qué cables alcanza el polo (−). Si un terminal de la lámpara
 *    toca el (+) y el otro terminal toca el (−), el circuito se cierra y la lámpara se enciende.
 */
function analyzeCircuit(grid) {
  let battery = null;
  let lamp = null;

  // Localizar batería y lámpara en la cuadrícula
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = grid[r][c];
      if (!cell || cell.type === 'empty') continue;
      if (cell.type === 'battery') battery = { r, c, ...cell };
      if (cell.type === 'lamp') lamp = { r, c, ...cell };
    }
  }

  if (!battery || !lamp) {
    return { isShortCircuit: false, isClosedCircuit: false, posReachable: new Set(), negReachable: new Set() };
  }

  // Direcciones absolutas de los polos y terminales según su rotación actual
  const batPosDir = (0 + battery.rot) % 4; // Polo (+)
  const batNegDir = (2 + battery.rot) % 4; // Polo (−)
  const lampTermA = (0 + lamp.rot) % 4;    // Terminal A de la lámpara
  const lampTermB = (2 + lamp.rot) % 4;    // Terminal B de la lámpara

  // Comprueba si la casilla (r1, c1) se conecta con su vecina en la dirección 'dir'
  function areConnected(r1, c1, dir) {
    const d = DIRS[dir];
    const r2 = r1 + d.dr;
    const c2 = c1 + d.dc;
    if (r2 < 0 || r2 >= 5 || c2 < 0 || c2 >= 5) return false;

    const cell1 = grid[r1][c1];
    const cell2 = grid[r2][c2];
    if (!cell1 || !cell2 || cell1.type === 'empty' || cell2.type === 'empty') return false;

    const ports1 = getPorts(cell1.type, cell1.rot);
    const ports2 = getPorts(cell2.type, cell2.rot);

    // Ambas deben tener el puerto abierto de frente
    return ports1.includes(dir) && ports2.includes(d.opp);
  }

  // --------------------------------------------------------------------------
  // PASO 1: VERIFICAR CORTOCIRCUITO (BFS desde + hacia - sin cruzar la lámpara)
  // --------------------------------------------------------------------------
  let isShortCircuit = false;
  const shortCircuitCells = new Set();

  const pNeighborR = battery.r + DIRS[batPosDir].dr;
  const pNeighborC = battery.c + DIRS[batPosDir].dc;

  if (areConnected(battery.r, battery.c, batPosDir)) {
    const startKey = `${pNeighborR},${pNeighborC}`;
    const queue = [{ r: pNeighborR, c: pNeighborC, path: [`${battery.r},${battery.c}`, startKey] }];
    const visited = new Set([`${battery.r},${battery.c}`, startKey]);

    while (queue.length > 0) {
      const { r, c, path } = queue.shift();

      // ¿Esta casilla conecta directamente con el polo (-) de la batería?
      for (let dir = 0; dir < 4; dir++) {
        if (areConnected(r, c, dir)) {
          const nr = r + DIRS[dir].dr;
          const nc = c + DIRS[dir].dc;
          if (nr === battery.r && nc === battery.c && dir === DIRS[batNegDir].opp) {
            isShortCircuit = true;
            path.forEach(k => shortCircuitCells.add(k));
            shortCircuitCells.add(`${battery.r},${battery.c}`);
            break;
          }
        }
      }
      if (isShortCircuit) break;

      // Si la casilla es la lámpara, NO permitimos atravesarla (es una carga resistiva)
      const currentCell = grid[r][c];
      if (currentCell.type === 'lamp') continue;

      // Expandir a casillas vecinas conectadas
      for (let dir = 0; dir < 4; dir++) {
        if (areConnected(r, c, dir)) {
          const nr = r + DIRS[dir].dr;
          const nc = c + DIRS[dir].dc;
          const key = `${nr},${nc}`;
          if (!visited.has(key) && (nr !== battery.r || nc !== battery.c)) {
            visited.add(key);
            queue.push({ r: nr, c: nc, path: [...path, key] });
          }
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // PASO 2: CONJUNTOS DE ENERGIZACIÓN (+) Y (−)
  // --------------------------------------------------------------------------
  const posReachable = new Set();
  if (areConnected(battery.r, battery.c, batPosDir)) {
    const q = [{ r: pNeighborR, c: pNeighborC }];
    posReachable.add(`${pNeighborR},${pNeighborC}`);
    while (q.length > 0) {
      const curr = q.shift();
      const cell = grid[curr.r][curr.c];
      if (cell.type === 'lamp') continue; // Se detiene en la lámpara
      for (let dir = 0; dir < 4; dir++) {
        if (areConnected(curr.r, curr.c, dir)) {
          const nr = curr.r + DIRS[dir].dr;
          const nc = curr.c + DIRS[dir].dc;
          const key = `${nr},${nc}`;
          if (!posReachable.has(key) && (nr !== battery.r || nc !== battery.c)) {
            posReachable.add(key);
            q.push({ r: nr, c: nc });
          }
        }
      }
    }
  }

  const negReachable = new Set();
  const nNeighborR = battery.r + DIRS[batNegDir].dr;
  const nNeighborC = battery.c + DIRS[batNegDir].dc;
  if (areConnected(battery.r, battery.c, batNegDir)) {
    const q = [{ r: nNeighborR, c: nNeighborC }];
    negReachable.add(`${nNeighborR},${nNeighborC}`);
    while (q.length > 0) {
      const curr = q.shift();
      const cell = grid[curr.r][curr.c];
      if (cell.type === 'lamp') continue;
      for (let dir = 0; dir < 4; dir++) {
        if (areConnected(curr.r, curr.c, dir)) {
          const nr = curr.r + DIRS[dir].dr;
          const nc = curr.c + DIRS[dir].dc;
          const key = `${nr},${nc}`;
          if (!negReachable.has(key) && (nr !== battery.r || nc !== battery.c)) {
            negReachable.add(key);
            q.push({ r: nr, c: nc });
          }
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // PASO 3: VERIFICAR CIRCUITO CERRADO A TRAVÉS DE LA LÁMPARA
  // --------------------------------------------------------------------------
  let isClosedCircuit = false;

  const lampNeighborA = areConnected(lamp.r, lamp.c, lampTermA) 
    ? `${lamp.r + DIRS[lampTermA].dr},${lamp.c + DIRS[lampTermA].dc}` 
    : null;
  const lampNeighborB = areConnected(lamp.r, lamp.c, lampTermB) 
    ? `${lamp.r + DIRS[lampTermB].dr},${lamp.c + DIRS[lampTermB].dc}` 
    : null;

  if (!isShortCircuit && lampNeighborA && lampNeighborB) {
    const aInPos = posReachable.has(lampNeighborA);
    const aInNeg = negReachable.has(lampNeighborA);
    const bInPos = posReachable.has(lampNeighborB);
    const bInNeg = negReachable.has(lampNeighborB);

    // Un terminal debe recibir (+) y el otro terminal debe recibir (−)
    if ((aInPos && bInNeg) || (aInNeg && bInPos)) {
      isClosedCircuit = true;
    }
  }

  return {
    isShortCircuit,
    isClosedCircuit,
    shortCircuitCells,
    posReachable,
    negReachable,
    batteryKey: `${battery.r},${battery.c}`,
    lampKey: `${lamp.r},${lamp.c}`
  };
}

// ============================================================================
// 6. CONTROLADOR PRINCIPAL DEL JUEGO (ESTADO E INTERFAZ)
// ============================================================================

class CircuitoJuego {
  constructor() {
    this.currentLevelIndex = 0;
    this.grid = [];
    this.moves = 0;
    this.levelMoves = []; // Registro de movimientos por nivel para la pantalla final
    this.isLevelWon = false;
    this.sound = new SoundFX();

    // Elementos del DOM
    this.boardEl = document.getElementById('board');
    this.levelDisplayEl = document.getElementById('level-display');
    this.levelNameEl = document.getElementById('level-name');
    this.movesDisplayEl = document.getElementById('moves-display');
    this.alertBannerEl = document.getElementById('alert-banner');
    
    // Modales
    this.modalWinEl = document.getElementById('modal-level-win');
    this.modalGameWinEl = document.getElementById('modal-game-win');
    this.modalHelpEl = document.getElementById('modal-help');
    this.winMovesEl = document.getElementById('win-moves');
    this.summaryTableBodyEl = document.getElementById('summary-table-body');
    this.totalMovesSummaryEl = document.getElementById('total-moves-summary');

    // Botones
    this.btnResetEl = document.getElementById('btn-reset');
    this.btnNextLevelEl = document.getElementById('btn-next-level');
    this.btnReplayLevelEl = document.getElementById('btn-replay-level');
    this.btnRestartGameEl = document.getElementById('btn-restart-game');
    this.btnHelpEl = document.getElementById('btn-help');
    this.btnCloseHelpEl = document.getElementById('btn-close-help');
    this.btnSoundEl = document.getElementById('btn-sound');
    this.soundIconEl = document.getElementById('sound-icon');

    this.initEvents();
    this.loadLevel(0);
  }

  initEvents() {
    this.btnResetEl.addEventListener('click', () => this.resetLevel());
    this.btnNextLevelEl.addEventListener('click', () => this.nextLevel());
    this.btnReplayLevelEl.addEventListener('click', () => {
      this.hideModal(this.modalWinEl);
      this.resetLevel();
    });
    this.btnRestartGameEl.addEventListener('click', () => {
      this.hideModal(this.modalGameWinEl);
      this.levelMoves = [];
      this.loadLevel(0);
    });

    this.btnHelpEl.addEventListener('click', () => this.showModal(this.modalHelpEl));
    this.btnCloseHelpEl.addEventListener('click', () => this.hideModal(this.modalHelpEl));

    this.btnSoundEl.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.soundIconEl.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  /**
   * Carga e inicializa un nivel dado su índice (0 a 4).
   */
  loadLevel(index) {
    this.currentLevelIndex = index;
    const levelData = LEVELS_DATA[index];
    this.moves = 0;
    this.isLevelWon = false;

    this.levelDisplayEl.textContent = `${levelData.id} / ${LEVELS_DATA.length}`;
    this.levelNameEl.textContent = levelData.name;
    this.movesDisplayEl.textContent = '0';
    this.alertBannerEl.classList.add('hidden');
    this.hideModal(this.modalWinEl);
    this.hideModal(this.modalGameWinEl);

    // Inicializar matriz 5x5 con casillas vacías
    this.grid = [];
    for (let r = 0; r < 5; r++) {
      this.grid.push(new Array(5).fill(null).map(() => ({
        type: 'empty',
        rot: 0,
        fixed: false,
        totalDegrees: 0
      })));
    }

    // Colocar las piezas del nivel
    levelData.pieces.forEach(p => {
      this.grid[p.r][p.c] = {
        type: p.type,
        rot: p.rot,
        fixed: !!p.fixed,
        totalDegrees: p.rot * 90
      };
    });

    this.renderBoard();
    this.updateCircuitState(false);
  }

  /**
   * Renderiza el DOM del tablero 5x5.
   */
  renderBoard() {
    this.boardEl.innerHTML = '';

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cellData = this.grid[r][c];
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;

        if (cellData.type !== 'empty') {
          if (cellData.fixed) {
            cellEl.classList.add('fixed');
            const badge = document.createElement('span');
            badge.className = 'fixed-badge';
            badge.textContent = '🔒';
            badge.title = 'Pieza fija (no gira)';
            cellEl.appendChild(badge);
          } else {
            cellEl.classList.add('rotatable');
            cellEl.setAttribute('role', 'button');
            cellEl.setAttribute('tabindex', '0');
            cellEl.setAttribute('aria-label', `Pieza ${cellData.type} en fila ${r + 1}, columna ${c + 1}. Haz clic para girar.`);
            
            // Evento de clic para girar
            cellEl.addEventListener('click', () => this.handleCellClick(r, c));
            cellEl.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleCellClick(r, c);
              }
            });
          }

          // Contenedor giratorio con SVG inline
          const svgContainer = document.createElement('div');
          svgContainer.className = 'piece-svg-container';
          svgContainer.style.transform = `rotate(${cellData.totalDegrees}deg)`;
          svgContainer.innerHTML = createPieceSVG(cellData.type);
          cellEl.appendChild(svgContainer);
        }

        this.boardEl.appendChild(cellEl);
      }
    }
  }

  /**
   * Manejador al hacer clic sobre una casilla giratoria.
   */
  handleCellClick(r, c) {
    if (this.isLevelWon) return; // Bloquear interacción si el nivel ya fue ganado

    const cell = this.grid[r][c];
    if (!cell || cell.type === 'empty' || cell.fixed) return;

    // 1. Sonido de clic
    this.sound.playRotate();

    // 2. Incrementar rotación (90° horario)
    cell.rot = (cell.rot + 1) % 4;
    cell.totalDegrees += 90;

    // 3. Contar movimiento
    this.moves++;
    this.movesDisplayEl.textContent = this.moves;

    // 4. Animar visualmente el giro de la pieza
    const cellEl = this.getCellElement(r, c);
    if (cellEl) {
      const container = cellEl.querySelector('.piece-svg-container');
      if (container) {
        container.style.transform = `rotate(${cell.totalDegrees}deg)`;
      }
    }

    // 5. Re-evaluar circuito en tiempo real
    this.updateCircuitState(true);
  }

  /**
   * Obtiene el nodo HTML de la casilla (r, c).
   */
  getCellElement(r, c) {
    return this.boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  }

  /**
   * Ejecuta el análisis y actualiza clases visuales de energización, cortocircuito y victoria.
   */
  updateCircuitState(triggeredByUser = false) {
    const analysis = analyzeCircuit(this.grid);

    // Limpiar clases de estado previo en todas las casillas
    const allCells = this.boardEl.querySelectorAll('.cell');
    allCells.forEach(el => {
      el.classList.remove('energized-pos', 'energized-neg', 'circuit-active', 'short-circuit', 'lamp-on');
    });

    // 1. Caso: CORTOCIRCUITO
    if (analysis.isShortCircuit) {
      this.alertBannerEl.classList.remove('hidden');
      if (triggeredByUser) this.sound.playShortCircuit();

      // Iluminar en rojo parpadeante las casillas del cortocircuito
      analysis.shortCircuitCells.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const el = this.getCellElement(r, c);
        if (el) el.classList.add('short-circuit');
      });
      return;
    }

    // Si no hay cortocircuito, ocultar el banner de peligro
    this.alertBannerEl.classList.add('hidden');

    // 2. Caso: CIRCUITO CERRADO (VICTORIA)
    if (analysis.isClosedCircuit) {
      this.isLevelWon = true;

      // Iluminar todo el circuito activo con brillo dorado/esmeralda
      analysis.posReachable.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const el = this.getCellElement(r, c);
        if (el) el.classList.add('circuit-active');
      });
      analysis.negReachable.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const el = this.getCellElement(r, c);
        if (el) el.classList.add('circuit-active');
      });

      // Encender la bombilla
      if (analysis.lampKey) {
        const [lr, lc] = analysis.lampKey.split(',').map(Number);
        const lampEl = this.getCellElement(lr, lc);
        if (lampEl) lampEl.classList.add('lamp-on', 'circuit-active');
      }

      // Sonido de victoria y mostrar modal tras breve pausa
      this.sound.playWin();
      this.levelMoves[this.currentLevelIndex] = this.moves;

      setTimeout(() => {
        this.showLevelWinModal();
      }, 700);
      return;
    }

    // 3. Caso normal: Mostrar energización en tiempo real (cables conectados a + o −)
    analysis.posReachable.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const el = this.getCellElement(r, c);
      if (el) el.classList.add('energized-pos');
    });

    analysis.negReachable.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const el = this.getCellElement(r, c);
      if (el) el.classList.add('energized-neg');
    });
  }

  /**
   * Muestra el modal de felicitaciones al completar un nivel.
   */
  showLevelWinModal() {
    this.winMovesEl.textContent = this.moves;
    this.showModal(this.modalWinEl);
  }

  /**
   * Pasa al siguiente nivel o muestra la pantalla final si era el nivel 5.
   */
  nextLevel() {
    this.hideModal(this.modalWinEl);
    if (this.currentLevelIndex < LEVELS_DATA.length - 1) {
      this.loadLevel(this.currentLevelIndex + 1);
    } else {
      this.showGameWinModal();
    }
  }

  /**
   * Muestra la pantalla final de victoria con la tabla resumen de movimientos.
   */
  showGameWinModal() {
    this.summaryTableBodyEl.innerHTML = '';
    let totalMoves = 0;

    LEVELS_DATA.forEach((lvl, idx) => {
      const moves = this.levelMoves[idx] || 0;
      totalMoves += moves;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>Nivel ${lvl.id}</strong></td>
        <td>${lvl.name}</td>
        <td><span style="color:#38bdf8; font-weight:700;">${moves}</span> movs</td>
      `;
      this.summaryTableBodyEl.appendChild(tr);
    });

    this.totalMovesSummaryEl.textContent = `${totalMoves} movimientos`;
    this.showModal(this.modalGameWinEl);
  }

  /**
   * Reinicia el nivel actual al estado inicial y reinicia el contador de movimientos.
   */
  resetLevel() {
    this.loadLevel(this.currentLevelIndex);
  }

  showModal(modalEl) {
    modalEl.classList.remove('hidden');
  }

  hideModal(modalEl) {
    modalEl.classList.add('hidden');
  }

  /**
   * Función de ayuda para depuración o demostración:
   * Aplica la solución ganadora del nivel actual directamente.
   */
  resolverNivelActual() {
    const levelData = LEVELS_DATA[this.currentLevelIndex];
    if (!levelData.solutionRotations) return;

    Object.entries(levelData.solutionRotations).forEach(([key, targetRot]) => {
      const [r, c] = key.split(',').map(Number);
      const cell = this.grid[r][c];
      if (cell && !cell.fixed) {
        cell.rot = targetRot;
        cell.totalDegrees = targetRot * 90;
        const cellEl = this.getCellElement(r, c);
        if (cellEl) {
          const container = cellEl.querySelector('.piece-svg-container');
          if (container) container.style.transform = `rotate(${cell.totalDegrees}deg)`;
        }
      }
    });

    this.updateCircuitState(true);
  }
}

// ============================================================================
// 7. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  const juego = new CircuitoJuego();

  // Exponer para pruebas en la consola del navegador
  window.juegoCircuito = juego;
  window.resolverNivel = () => juego.resolverNivelActual();
  console.log("%c⚡ CIRCUITO CERRADO listo. Puedes usar resolverNivel() en la consola para ver la solución del nivel actual.", "color: #00f0ff; font-weight: bold;");
});
