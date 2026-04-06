/**
 * map.js — SVG rendering, pan, zoom, edge/node drawing
 */

const NS = 'http://www.w3.org/2000/svg';
const svgEl = document.getElementById('map-canvas');
const canvasWrap = document.getElementById('canvas-wrap');
let gRoot;

let NODES = [];
let NODE_MAP = {};
let transform = { x: 0, y: 0, scale: 1 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragTransformStart = { x: 0, y: 0 };

function mapInit(nodes) {
  NODES = nodes;
  rebuildNodeMap();
  initSVGDefs();
  renderMap();
  fitToView();
}

function mapGetNodes()   { return NODES; }
function mapGetNodeMap() { return NODE_MAP; }

function mapAddNode(node) {
  NODES.push(node);
  NODE_MAP[node.id] = node;
  const ng = document.getElementById('nodes');
  const eg = document.getElementById('edges');
  drawNode(node, ng, true);
  eg.innerHTML = '';
  drawEdges(eg);
}

function mapUpdateNode(id, changes) {
  const idx = NODES.findIndex(n => n.id === id);
  if (idx === -1) return;
  NODES[idx] = { ...NODES[idx], ...changes };
  NODE_MAP[id] = NODES[idx];
  renderMap();
  fitToView();
}

function mapRemoveNode(id) {
  NODES = NODES.filter(n => n.id !== id);
  delete NODE_MAP[id];
  renderMap();
  fitToView();
}

function mapRender()  { renderMap(); }
function mapFitView() { fitToView(); }

function mapZoom(factor) {
  const vpW = svgEl.clientWidth  || window.innerWidth;
  const vpH = svgEl.clientHeight || window.innerHeight;
  const cx = vpW / 2, cy = vpH / 2;
  transform.x = cx - (cx - transform.x) * factor;
  transform.y = cy - (cy - transform.y) * factor;
  transform.scale *= factor;
  applyTransform();
}

function mapNavigateTo(id) {
  const n = NODE_MAP[id];
  if (!n) return;
  const vpW = svgEl.clientWidth  || window.innerWidth;
  const vpH = svgEl.clientHeight || window.innerHeight;
  transform.x = vpW / 2 - n.x * transform.scale;
  transform.y = vpH / 2 - n.y * transform.scale;
  applyTransform();
}

function mapHighlightEdges(nodeId, on) {
  document.querySelectorAll('.edge').forEach(e => {
    const connected = e.getAttribute('data-from') === nodeId || e.getAttribute('data-to') === nodeId;
    e.style.strokeOpacity = connected && on ? '1' : (on ? '0.07' : '0.35');
    e.style.strokeWidth   = connected && on ? '3' : '';
  });
}

function mapResetEdges() {
  document.querySelectorAll('.edge').forEach(e => {
    e.style.strokeOpacity = '0.35';
    e.style.strokeWidth = '';
  });
}

function mapFilterCategory(cat) {
  document.querySelectorAll('.node-group').forEach(g => {
    const n = NODE_MAP[g.getAttribute('data-id')];
    if (!n) return;
    const show = !cat || n.category === cat || n.type === 'core';
    g.style.opacity = show ? '1' : '0.08';
    g.style.pointerEvents = show ? 'all' : 'none';
  });
  document.querySelectorAll('.edge').forEach(e => {
    const f = NODE_MAP[e.getAttribute('data-from')];
    const t = NODE_MAP[e.getAttribute('data-to')];
    const show = !cat
      || (f && (f.category === cat || f.type === 'core'))
      || (t && (t.category === cat || t.type === 'core'));
    e.style.opacity = show ? '1' : '0.04';
  });
}

function mapPositionForParent(parentId) {
  const parent = NODE_MAP[parentId];
  if (!parent) {
    const a = Math.random() * Math.PI * 2;
    return { x: 825 + Math.cos(a) * 300, y: 600 + Math.sin(a) * 200 };
  }
  const siblings = NODES.filter(n =>
    (n.connects || []).includes(parentId) || (parent.connects || []).includes(n.id)
  );
  const a = (siblings.length * 1.2) + Math.PI / 6;
  const dist = 200 + Math.random() * 80;
  return { x: parent.x + Math.cos(a) * dist, y: parent.y + Math.sin(a) * dist };
}

function rebuildNodeMap() {
  NODE_MAP = {};
  NODES.forEach(n => { NODE_MAP[n.id] = n; });
}

function svgEl2(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function initSVGDefs() {
  const defs = svgEl2('defs', {}, svgEl);

  const fGlow = svgEl2('filter', { id:'glow', x:'-30%', y:'-30%', width:'160%', height:'160%' }, defs);
  svgEl2('feGaussianBlur', { stdDeviation:'4', result:'coloredBlur' }, fGlow);
  const fM = svgEl2('feMerge', {}, fGlow);
  svgEl2('feMergeNode', { in:'coloredBlur' }, fM);
  svgEl2('feMergeNode', { in:'SourceGraphic' }, fM);

  const fGC = svgEl2('filter', { id:'glow-core', x:'-40%', y:'-40%', width:'180%', height:'180%' }, defs);
  svgEl2('feGaussianBlur', { stdDeviation:'8', result:'coloredBlur' }, fGC);
  const fMC = svgEl2('feMerge', {}, fGC);
  svgEl2('feMergeNode', { in:'coloredBlur' }, fMC);
  svgEl2('feMergeNode', { in:'SourceGraphic' }, fMC);

  const bg = svgEl2('radialGradient', { id:'bgGrad', cx:'50%', cy:'50%', r:'70%' }, defs);
  svgEl2('stop', { offset:'0%', 'stop-color':'#1e1e3f' }, bg);
  svgEl2('stop', { offset:'100%', 'stop-color':'#0d0d1a' }, bg);
  svgEl2('rect', { x:'-9000', y:'-9000', width:'20000', height:'20000', fill:'url(#bgGrad)' }, svgEl);

  const pat = svgEl2('pattern', { id:'dots', x:'0', y:'0', width:'40', height:'40', patternUnits:'userSpaceOnUse' }, defs);
  svgEl2('circle', { cx:'20', cy:'20', r:'1', fill:'rgba(255,255,255,0.05)' }, pat);
  svgEl2('rect', { x:'-9000', y:'-9000', width:'20000', height:'20000', fill:'url(#dots)' }, svgEl);

  const arrowColors = { pink:'#ff6b9d', green:'#4ecdc4', orange:'#ff9f43', purple:'#a29bfe', gray:'#666' };
  Object.entries(arrowColors).forEach(([id, fill]) => {
    const mk = svgEl2('marker', { id:`arrow-${id}`, markerWidth:'8', markerHeight:'8', refX:'6', refY:'3', orient:'auto' }, defs);
    svgEl2('path', { d:'M0,0 L0,6 L8,3 z', fill }, mk);
  });

  gRoot = svgEl2('g', { id:'root-group' }, svgEl);
}

function renderMap() {
  gRoot.innerHTML = '';
  const edgeGroup = svgEl2('g', { id:'edges' }, gRoot);
  const nodeGroup = svgEl2('g', { id:'nodes' }, gRoot);
  drawEdges(edgeGroup);
  NODES.forEach(n => drawNode(n, nodeGroup, false));
  applyTransform();
}

function getNodeDims(node) {
  const lines = node.label.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length));
  if (node.type === 'core')   return { w: Math.max(150, maxLen * 10 + 28), h: lines.length > 1 ? 80 : 58 };
  if (node.type === 'branch') return { w: Math.max(130, maxLen * 9  + 22), h: 58 };
  return { rx: Math.max(68, maxLen * 5.3 + 18), ry: lines.length > 1 ? 48 : 34 };
}

function catArrow(cat) {
  return ({ pink:'arrow-pink', green:'arrow-green', orange:'arrow-orange', purple:'arrow-purple' })[cat] || 'arrow-gray';
}

function drawEdges(eg) {
  const drawn = new Set();
  NODES.forEach(node => {
    (node.connects || []).forEach(tid => {
      const key = [node.id, tid].sort().join('--');
      if (drawn.has(key)) return;
      drawn.add(key);
      const target = NODE_MAP[tid];
      if (!target) return;
      const cat = node.type === 'core' ? node.category : target.type === 'core' ? target.category : node.category;
      const strokeColors = { pink:'#ff6b9d', green:'#4ecdc4', orange:'#ff9f43', purple:'#a29bfe' };
      const stroke = strokeColors[cat] || '#666';
      const mx = (node.x + target.x) / 2, my = (node.y + target.y) / 2;
      const dx = target.x - node.x, dy = target.y - node.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const cpx = mx + (-dy / len) * 40, cpy = my + (dx / len) * 40;
      svgEl2('path', {
        d: `M${node.x},${node.y} Q${cpx},${cpy} ${target.x},${target.y}`,
        stroke, 'stroke-opacity':'0.35',
        'stroke-width': (node.type === 'core' || target.type === 'core') ? '2.5' : '1.5',
        fill: 'none',
        'marker-end': `url(#${catArrow(cat)})`,
        class: 'edge',
        'data-from': node.id, 'data-to': tid,
        'stroke-dasharray': node.type === 'leaf' ? '5,4' : 'none'
      }, eg);
    });
  });
}

function drawNode(node, ng, animate) {
  const g = svgEl2('g', {
    class: `node-group${animate ? ' node-new' : ''}`,
    'data-id': node.id,
    transform: `translate(${node.x}, ${node.y})`
  }, ng);

  const nodeIsLocal = isLocalNode(node.id);

  if (node.type === 'core') {
    const { w, h } = getNodeDims(node);
    svgEl2('rect', { x:-w/2-8, y:-h/2-8, width:w+16, height:h+16, rx:10, fill:hexToRgba(node.color, 0.14), filter:'url(#glow-core)', class:'node-center-glow' }, g);
    svgEl2('rect', { x:-w/2, y:-h/2, width:w, height:h, rx:6, fill:hexToRgba(node.color, 0.15), stroke:node.color, 'stroke-width':'2.5', class:'node-body' }, g);
    drawLabel(g, node, 16, 14);
  } else if (node.type === 'branch') {
    const { w, h } = getNodeDims(node);
    svgEl2('rect', { x:-w/2, y:-h/2, width:w, height:h, rx:8, fill:hexToRgba(node.color, 0.17), stroke:node.color, 'stroke-width':'2', class:'node-body' }, g);
    drawLabel(g, node, 14, 13);
  } else {
    const { rx, ry } = getNodeDims(node);
    svgEl2('ellipse', { cx:3, cy:5, rx, ry, fill:hexToRgba(node.color, 0.08) }, g);
    svgEl2('ellipse', { cx:0, cy:0, rx, ry, fill:hexToRgba(node.color, 0.11), stroke:node.color, 'stroke-width':'1.8', class:'node-body' }, g);
    drawLabel(g, node, 13, 12);
  }

  if (nodeIsLocal) {
    svgEl2('circle', { cx:30, cy:-28, r:7, fill:'#ff6b9d', opacity:'0.9' }, g);
    const star = document.createElementNS(NS, 'text');
    Object.entries({ x:'30', y:'-28', 'text-anchor':'middle', 'dominant-baseline':'middle', fill:'white', 'font-size':'9' })
      .forEach(([k, v]) => star.setAttribute(k, v));
    star.textContent = '★';
    g.appendChild(star);
  }

  svgEl2('rect', { x:'-90', y:'-65', width:'180', height:'130', fill:'transparent', style:'cursor:pointer' }, g);

  g.addEventListener('click', e => {
    e.stopPropagation();
    svgEl.dispatchEvent(new CustomEvent('nodeclick', { detail: { id: node.id } }));
  });
  g.addEventListener('mouseenter', () => mapHighlightEdges(node.id, true));
  g.addEventListener('mouseleave', () => {
    svgEl.dispatchEvent(new CustomEvent('nodeleave', { detail: { id: node.id } }));
  });
}

function drawLabel(g, node, fs1, fs2) {
  const lines  = node.label.split('\n');
  const lineH  = 17;
  const startY = -(lines.length - 1) * lineH / 2;
  lines.forEach((line, i) => {
    const t = document.createElementNS(NS, 'text');
    Object.entries({
      x:'0', y: String(startY + i * lineH),
      'text-anchor':'middle', 'dominant-baseline':'middle',
      fill: node.color, 'font-family':'Caveat, cursive',
      'font-size': String(i === 0 ? fs1 : fs2), 'font-weight':'700'
    }).forEach(([k, v]) => t.setAttribute(k, v));
    t.textContent = line;
    g.appendChild(t);
  });
}

function applyTransform() {
  gRoot.setAttribute('transform', `translate(${transform.x},${transform.y}) scale(${transform.scale})`);
}

function fitToView() {
  if (NODES.length === 0) return;
  const vpW = svgEl.clientWidth  || window.innerWidth;
  const vpH = (svgEl.clientHeight || window.innerHeight) - 58;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  NODES.forEach(n => {
    minX = Math.min(minX, n.x - 110); minY = Math.min(minY, n.y - 80);
    maxX = Math.max(maxX, n.x + 110); maxY = Math.max(maxY, n.y + 80);
  });
  const cW = maxX - minX, cH = maxY - minY;
  const scale = Math.min((vpW * 0.9) / cW, (vpH * 0.9) / cH, 0.85);
  transform.scale = scale;
  transform.x = (vpW - cW * scale) / 2 - minX * scale;
  transform.y = (vpH - cH * scale) / 2 - minY * scale + 58;
  applyTransform();
}

canvasWrap.addEventListener('mousedown', e => {
  if (e.target.closest('.node-group')) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  dragTransformStart = { ...transform };
  canvasWrap.classList.add('dragging');
});
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  transform.x = dragTransformStart.x + (e.clientX - dragStart.x);
  transform.y = dragTransformStart.y + (e.clientY - dragStart.y);
  applyTransform();
});
window.addEventListener('mouseup', () => {
  isDragging = false;
  canvasWrap.classList.remove('dragging');
});
canvasWrap.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = canvasWrap.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  transform.x = mx - (mx - transform.x) * factor;
  transform.y = my - (my - transform.y) * factor;
  transform.scale *= factor;
  applyTransform();
}, { passive: false });
canvasWrap.addEventListener('touchstart', e => {
  if (e.touches.length === 1 && !e.target.closest('.node-group')) {
    isDragging = true;
    dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    dragTransformStart = { ...transform };
  }
}, { passive: true });
canvasWrap.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && isDragging) {
    transform.x = dragTransformStart.x + (e.touches[0].clientX - dragStart.x);
    transform.y = dragTransformStart.y + (e.touches[0].clientY - dragStart.y);
    applyTransform();
  }
}, { passive: true });
canvasWrap.addEventListener('touchend', () => { isDragging = false; });
