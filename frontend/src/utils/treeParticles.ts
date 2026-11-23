import * as THREE from 'three';

export interface TreeParticleData {
  count: number;
  /** Posição final de cada partícula na árvore (xyz) */
  positions: Float32Array;
  colors: Float32Array;
  /** x: fase aleatória, y: escala de tamanho, z: velocidade de cintilação, w: ordem de crescimento (0 = base, 1 = pontas) */
  seeds: Float32Array;
  /**
   * Grupo de destaque de cada partícula: 0 = nenhum (tronco, galho líder, poeira),
   * 1..N = galhos principais (da esquerda para a direita), N+1.. = raízes
   */
  groups: Float32Array;
  /** Ponto de ancoragem de cada galho principal, na borda externa da copa (um por galho, da esquerda para a direita) */
  branchAnchors: THREE.Vector3[];
  /** Pontos de ancoragem das raízes, abaixo do solo (da esquerda para a direita) */
  rootAnchors: THREE.Vector3[];
}

export interface TreeOptions {
  count: number;
  /** Quantidade de galhos principais saindo do tronco (padrão: 5) */
  mainBranches?: number;
  /** Quantidade de pontos de ancoragem nas raízes (padrão: 1) */
  rootAnchorCount?: number;
  /** Semente do gerador: a mesma semente sempre produz a mesma árvore */
  seed?: number;
}

/** Altura do solo: base do tronco, de onde partem as raízes e as ondas */
export const TREE_BASE_Y = -2.6;

/**
 * Faixa de altura em que a copa se abre na horizontal (ver `spreadCanopy`):
 * abaixo de FROM nada muda (raízes e base do tronco) e acima de TO a abertura é total
 */
export const CANOPY_SPREAD_FROM_Y = -1.2;
export const CANOPY_SPREAD_TO_Y = 1.5;

/** Abre a copa na horizontal pelo fator `spread` (1 = formato original); a mesma conta roda no shader */
export function spreadCanopy(point: THREE.Vector3, spread: number) {
  const s =
    1 + (spread - 1) * THREE.MathUtils.smoothstep(point.y, CANOPY_SPREAD_FROM_Y, CANOPY_SPREAD_TO_Y);
  point.x *= s;
  point.z *= s;
  return point;
}

const TRUNK_TOP_Y = 0.3;
const DUST_RATIO = 0.04;

type Kind = 'root' | 'trunk' | 'branch' | 'leaf';

interface Emitter {
  kind: Kind;
  weight: number;
  group: number;
  /** Escreve um ponto em `out` e devolve a ordem de crescimento dele */
  emit: (out: THREE.Vector3) => number;
}

interface GrowOptions {
  kind: Kind;
  leaves: boolean;
  /** Tendência vertical dos galhos filhos (positivo sobe, negativo desce) */
  bias: number;
  /** Arqueamento do galho, em fração do comprimento */
  lift: number;
  orderStep: number;
  /** Multiplicador da quantidade de folhas em cada tufo */
  leafDensity: number;
  /** Mínimo de galhos filhos por bifurcação (mais filhos = mais tufos de folhas) */
  minChildren: number;
  /** Grupo de destaque herdado por todos os galhos filhos */
  group: number;
}

// Azuis do logotipo (Manual de Identidade Visual). A árvore é toda azul: o
// amarelo da marca entra só como destaque no hover, aplicado no shader
const BLUE = new THREE.Color('#1f71b7');
const LIGHT_BLUE = new THREE.Color('#3b9cd6'); // azul claro do logotipo (amostrado da arte do manual)
const SPARKLE = new THREE.Color('#ffffff');

/** Faixa de azul de cada parte da árvore: 0 = BLUE, 1 = LIGHT_BLUE */
const SHADE: Record<Kind, [number, number]> = {
  root: [0, 0.6],
  trunk: [0.2, 1],
  branch: [0.3, 1],
  leaf: [0, 1],
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Base ortonormal (u, v) perpendicular a `dir` */
function perpendicularFrame(dir: THREE.Vector3, u: THREE.Vector3, v: THREE.Vector3) {
  u.crossVectors(dir, Math.abs(dir.y) > 0.9 ? X_AXIS : Y_AXIS).normalize();
  v.crossVectors(dir, u).normalize();
}

/**
 * Gera proceduralmente uma árvore em nuvem de partículas: tronco, galhos
 * recursivos com copa nas pontas e raízes abaixo do solo.
 */
export function generateTreeParticles({
  count,
  mainBranches = 5,
  rootAnchorCount = 1,
  seed = 2026,
}: TreeOptions): TreeParticleData {
  const rand = mulberry32(seed);
  const emitters: Emitter[] = [];

  const tangent = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();

  const addSegment = (
    curve: THREE.QuadraticBezierCurve3,
    r0: number,
    r1: number,
    order0: number,
    order1: number,
    kind: Kind,
    weight: number,
    group: number,
    flare = false
  ) => {
    emitters.push({
      kind,
      weight,
      group,
      emit: (out) => {
        const t = rand();
        curve.getPoint(t, out);
        curve.getTangent(t, tangent);
        perpendicularFrame(tangent, u, v);

        const radius = flare
          ? r1 + (r0 - r1) * Math.pow(1 - t, 2.4)
          : THREE.MathUtils.lerp(r0, r1, t);
        const r = radius * Math.sqrt(rand());
        const angle = rand() * Math.PI * 2;
        out.addScaledVector(u, Math.cos(angle) * r).addScaledVector(v, Math.sin(angle) * r);

        return THREE.MathUtils.lerp(order0, order1, t);
      },
    });
  };

  const addBlob = (
    center: THREE.Vector3,
    radius: number,
    order: number,
    weight: number,
    group: number
  ) => {
    emitters.push({
      kind: 'leaf',
      weight,
      group,
      emit: (out) => {
        const z = rand() * 2 - 1;
        const angle = rand() * Math.PI * 2;
        const s = Math.sqrt(1 - z * z);
        // Expoente > 1/3 concentra no centro e deixa a borda da copa difusa
        const dist = radius * Math.pow(rand(), 0.55);
        out.set(
          center.x + Math.cos(angle) * s * dist,
          center.y + z * dist * 0.65,
          center.z + Math.sin(angle) * s * dist
        );
        return order + rand() * 0.12;
      },
    });
  };

  const grow = (
    start: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
    order: number,
    opts: GrowOptions
  ) => {
    const end = start.clone().addScaledVector(dir, length);

    const bu = new THREE.Vector3();
    const bv = new THREE.Vector3();
    perpendicularFrame(dir, bu, bv);

    const bend = (rand() - 0.5) * 2 * length * 0.2;
    const bendAngle = rand() * Math.PI * 2;
    const control = start
      .clone()
      .lerp(end, 0.5)
      .addScaledVector(bu, Math.cos(bendAngle) * bend)
      .addScaledVector(bv, Math.sin(bendAngle) * bend);
    control.y += length * opts.lift;

    const endRadius = depth === 0 ? radius * 0.3 : radius * 0.66;
    const nextOrder = order + opts.orderStep;

    addSegment(
      new THREE.QuadraticBezierCurve3(start, control, end),
      radius,
      endRadius,
      order,
      nextOrder,
      opts.kind,
      length * (0.6 + radius * 9),
      opts.group
    );

    if (depth === 0) {
      if (opts.leaves) addBlob(end, 0.6 + length * 0.5, nextOrder, 4 * opts.leafDensity, opts.group);
      return;
    }
    if (opts.leaves && depth <= 2) {
      addBlob(control, 0.45 + length * 0.3, nextOrder, 1.8 * opts.leafDensity, opts.group);
    }

    const children = Math.max(opts.minChildren, depth >= 2 && rand() < 0.5 ? 3 : 2);
    const azimuthStart = rand() * Math.PI * 2;

    for (let c = 0; c < children; c++) {
      const tilt = 0.4 + rand() * 0.45;
      const azimuth = azimuthStart + (c / children) * Math.PI * 2 + (rand() - 0.5) * 0.8;

      const childDir = dir
        .clone()
        .multiplyScalar(Math.cos(tilt))
        .addScaledVector(bu, Math.cos(azimuth) * Math.sin(tilt))
        .addScaledVector(bv, Math.sin(azimuth) * Math.sin(tilt));
      childDir.y += opts.bias;
      childDir.normalize();

      grow(end, childDir, length * (0.68 + rand() * 0.14), endRadius, depth - 1, nextOrder, opts);
    }
  };

  // Tronco
  const trunkBase = new THREE.Vector3(0, TREE_BASE_Y, 0);
  const trunkTop = new THREE.Vector3(0.05, TRUNK_TOP_Y, 0);
  const trunkCurve = new THREE.QuadraticBezierCurve3(
    trunkBase,
    new THREE.Vector3(0.28, (TREE_BASE_Y + TRUNK_TOP_Y) / 2, 0.1),
    trunkTop
  );
  addSegment(trunkCurve, 0.95, 0.42, 0.05, 0.35, 'trunk', 60, 0, true);

  // Galhos principais abertos em leque da esquerda para a direita: os das pontas
  // saem quase na horizontal e os do meio sobem, para que cada um ocupe uma
  // região própria da tela (e os rótulos das seções não se sobreponham)
  const branchOpts: GrowOptions = {
    kind: 'branch',
    leaves: true,
    bias: 0.2,
    lift: 0.12,
    orderStep: 0.13,
    leafDensity: 1.1,
    minChildren: 2,
    group: 0,
  };
  const branchAnchors: THREE.Vector3[] = [];

  for (let i = 0; i < mainBranches; i++) {
    const fan = mainBranches > 1 ? i / (mainBranches - 1) : 0.5;
    const azimuth = Math.PI * (1 - fan) + (rand() - 0.5) * 0.12;
    const tilt = 0.3 + 1.0 * Math.pow(Math.abs(Math.cos(azimuth)), 2.2) + (rand() - 0.5) * 0.1;
    const depthSide = i % 2 === 0 ? 1 : -1; // alterna frente/fundo para dar volume

    const start = trunkCurve.getPoint(0.7 + rand() * 0.3);
    const dir = new THREE.Vector3(
      Math.sin(tilt) * Math.cos(azimuth),
      Math.cos(tilt),
      Math.sin(tilt) * Math.sin(azimuth) * depthSide * 0.8
    ).normalize();
    const length = 1.9 + rand() * 0.4;

    // Os galhos laterais ficam isolados, sem outros galhos sobrepostos atrás como
    // no centro da copa: recebem mais ramificações e tufos mais densos para compensar
    const sideness = Math.abs(Math.cos(azimuth));
    grow(start, dir, length, 0.36, 3, 0.35, {
      ...branchOpts,
      leafDensity: 1 + 0.4 * Math.pow(sideness, 1.5),
      minChildren: sideness > 0.75 ? 3 : 2,
      group: i + 1,
    });
    branchAnchors.push(start.clone().addScaledVector(dir, length * 2.4));
  }

  // Com número par de galhos o centro da copa ficaria vazio: um galho líder preenche
  if (mainBranches % 2 === 0) {
    grow(trunkTop.clone(), new THREE.Vector3(0.05, 1, 0.05).normalize(), 1.7, 0.36, 3, 0.35, branchOpts);
  }

  // Raízes
  const rootOpts: GrowOptions = {
    kind: 'root',
    leaves: false,
    bias: -0.15,
    lift: 0,
    orderStep: 0.12,
    leafDensity: 1,
    minChildren: 2,
    group: 0,
  };
  const rootCount = 7;

  for (let i = 0; i < rootCount; i++) {
    const azimuth = (i / rootCount) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    const dir = new THREE.Vector3(Math.cos(azimuth), -0.45, Math.sin(azimuth)).normalize();
    // Cada raiz pertence ao rótulo do seu lado (esquerda -> direita)
    const slot = Math.min(
      rootAnchorCount - 1,
      Math.floor(((Math.cos(azimuth) + 1) / 2) * rootAnchorCount)
    );
    grow(trunkBase.clone(), dir, 1.3 + rand() * 0.4, 0.24, 2, 0.05, {
      ...rootOpts,
      group: mainBranches + 1 + slot,
    });
  }

  // Distribuição das partículas entre os emissores, proporcional ao peso
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const groups = new Float32Array(count);

  const totalWeight = emitters.reduce((sum, e) => sum + e.weight, 0);
  const treeCount = Math.floor(count * (1 - DUST_RATIO));
  const point = new THREE.Vector3();
  const color = new THREE.Color();
  let index = 0;

  const write = (order: number, size: number, group: number) => {
    positions.set([point.x, point.y, point.z], index * 3);
    colors.set([color.r, color.g, color.b], index * 3);
    seeds.set([rand(), size, rand(), THREE.MathUtils.clamp(order, 0, 1)], index * 4);
    groups[index] = group;
    index++;
  };

  for (const emitter of emitters) {
    const share = Math.floor((treeCount * emitter.weight) / totalWeight);

    for (let i = 0; i < share; i++) {
      const order = emitter.emit(point);
      let size = 0.6 + rand() * 0.8;

      if (emitter.kind === 'leaf' && rand() < 0.05) {
        color.copy(SPARKLE);
        size = 1.8;
      } else {
        const [from, to] = SHADE[emitter.kind];
        color
          .copy(BLUE)
          .lerp(LIGHT_BLUE, THREE.MathUtils.lerp(from, to, rand()))
          .multiplyScalar(0.9 + rand() * 0.4);
      }
      write(order, size, emitter.group);
    }
  }

  // O restante vira poeira luminosa flutuando ao redor da árvore
  while (index < count) {
    point.set((rand() - 0.5) * 14, TREE_BASE_Y - 1.5 + rand() * 8.5, (rand() - 0.5) * 8);
    color.copy(LIGHT_BLUE).multiplyScalar(0.5 + rand() * 0.5);
    write(rand(), 0.5 + rand() * 0.6, 0);
  }

  // Âncoras das raízes distribuídas lado a lado sob o tronco
  const rootAnchors = Array.from(
    { length: rootAnchorCount },
    (_, i) => new THREE.Vector3((i - (rootAnchorCount - 1) / 2) * 1.8, TREE_BASE_Y - 1.7, 0)
  );

  return { count, positions, colors, seeds, groups, branchAnchors, rootAnchors };
}
