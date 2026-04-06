/**
 * ui.js — panels, modal, search, toast, filters, export/import
 */

function showToast(msg, duration = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

function updateNodeCount() {
  const localCount = getLocalNodes().length;
  const el = document.getElementById('node-count');
  if (el) el.textContent = `${mapGetNodes().length} dziwek${localCount > 0 ? ` (${localCount} twoich)` : ''}`;
}

let _selectedNodeId = null;

function openPanel(id) {
  const node = mapGetNodeMap()[id];
  if (!node) return;
  _selectedNodeId = id;
  mapHighlightEdges(id, true);
  document.querySelectorAll('.node-group.selected').forEach(g => g.classList.remove('selected'));
  document.querySelector(`[data-id="${id}"]`)?.classList.add('selected');

  const nodeIsLocal = isLocalNode(id);
  document.getElementById('panel-tag').textContent = node.tag || '';
  document.getElementById('panel-tag').style.color = node.color;
  document.getElementById('panel-title').innerHTML =
    node.label.replace('\n', ' ') +
    (nodeIsLocal ? '<span class="local-badge">★ Twoja</span>' : '');
  document.getElementById('panel-title').style.color = node.color;
  document.getElementById('panel-desc').textContent = node.desc || '';

  const allNodes = mapGetNodes();
  const nodeMap  = mapGetNodeMap();
  const conns = [
    ...(node.connects || []),
    ...allNodes.filter(n => (n.connects || []).includes(id)).map(n => n.id)
  ].filter((v, i, a) => a.indexOf(v) === i);

  const connsSection = document.getElementById('panel-connections');
  const chips = document.getElementById('conn-chips');
  chips.innerHTML = '';
  if (conns.length > 0) {
    connsSection.style.display = 'block';
    conns.forEach(cid => {
      const cn = nodeMap[cid];
      if (!cn) return;
      const chip = document.createElement('button');
      chip.className = 'conn-chip';
      chip.textContent = cn.label.replace('\n', ' ');
      chip.style.cssText = `border-color:${cn.color};color:${cn.color}`;
      chip.addEventListener('click', () => { mapNavigateTo(cid); openPanel(cid); });
      chips.appendChild(chip);
    });
  } else {
    connsSection.style.display = 'none';
  }

  const actions = document.getElementById('panel-actions');
  actions.innerHTML = '';
  if (nodeIsLocal) {
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = '✏️ Edytuj';
    editBtn.addEventListener('click', () => openModal(id));
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = '🗑 Usuń';
    delBtn.addEventListener('click', () => deleteNode(id));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
  }

  document.getElementById('detail-panel').classList.add('visible');
  document.getElementById('detail-panel').setAttribute('aria-hidden', 'false');
}

function closePanel() {
  document.getElementById('detail-panel').classList.remove('visible');
  document.getElementById('detail-panel').setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.node-group.selected').forEach(g => g.classList.remove('selected'));
  mapResetEdges();
  _selectedNodeId = null;
}

let _editingId = null;
let _selectedColor = '#ff6b9d';
const CAT_COLORS = { pink:'#ff6b9d', green:'#4ecdc4', orange:'#ff9f43', purple:'#a29bfe' };
const CAT_TAGS   = { pink:'🌸 Klasyczne', green:'🟢 Charakterologiczne', orange:'🟠 Z Pracy', purple:'💜 Hybrydowe' };

function openModal(editId = null) {
  _editingId = editId;
  const node = editId ? mapGetNodeMap()[editId] : null;
  document.getElementById('modal-title').textContent = editId ? '✏️ Edytuj dziwkę' : '+ Dodaj dziwkę';
  document.getElementById('f-name').value = node ? node.label.replace('\n', ' ') : '';
  document.getElementById('f-desc').value = node ? (node.desc || '') : '';

  const cat = node ? node.category : 'pink';
  document.querySelectorAll('#cat-radio .radio-card').forEach(card => {
    const isThis = card.getAttribute('data-cat') === cat;
    card.classList.toggle('checked', isThis);
    card.querySelector('input').checked = isThis;
    card.style.borderColor = isThis ? (CAT_COLORS[card.getAttribute('data-cat')] || '#666') : 'transparent';
  });

  _selectedColor = node ? node.color : '#ff6b9d';
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('selected', s.getAttribute('data-color') === _selectedColor);
  });

  populateParentSelect(node ? (node.connects?.[0] || '') : '');
  document.getElementById('node-modal').classList.add('open');
  setTimeout(() => document.getElementById('f-name').focus(), 150);
}

function closeModal() {
  document.getElementById('node-modal').classList.remove('open');
}

function populateParentSelect(selectedId = '') {
  const sel = document.getElementById('f-parent');
  sel.innerHTML = '<option value="">— brak połączenia —</option>';
  mapGetNodes().forEach(n => {
    if (n.id === _editingId) return;
    const opt = document.createElement('option');
    opt.value = n.id;
    opt.textContent = n.label.replace('\n', ' ');
    if (n.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function saveNode() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('⚠️ Podaj nazwę dziwki!'); return; }
  const cat      = document.querySelector('#cat-radio input[type=radio]:checked')?.value || 'pink';
  const parentId = document.getElementById('f-parent').value;
  const desc     = document.getElementById('f-desc').value.trim();

  if (_editingId) {
    const local = getLocalNodes();
    const idx = local.findIndex(n => n.id === _editingId);
    if (idx === -1) { showToast('⚠️ Nie można edytować wbudowanego węzła'); closeModal(); return; }
    const updated = { ...local[idx], label: name.toUpperCase(), desc, category: cat, color: _selectedColor, tag: CAT_TAGS[cat], connects: parentId ? [parentId] : (local[idx].connects || []) };
    local[idx] = updated;
    saveLocalNodes(local);
    mapUpdateNode(_editingId, updated);
    closePanel();
    showToast('✅ Dziwka zaktualizowana!');
  } else {
    const id  = 'dziwka-' + Date.now();
    const pos = mapPositionForParent(parentId);
    const node = { id, label: name.toUpperCase(), x: pos.x, y: pos.y, color: _selectedColor, type: 'leaf', category: cat, shape: 'bubble', desc, tag: CAT_TAGS[cat], connects: parentId ? [parentId] : [] };
    const local = getLocalNodes();
    local.push(node);
    saveLocalNodes(local);
    mapAddNode(node);
    showToast('✅ Nowa dziwka dodana na mapę!');
    setTimeout(() => { mapNavigateTo(id); openPanel(id); }, 300);
  }

  closeModal();
  updateNodeCount();
}

function deleteNode(id) {
  const node = mapGetNodeMap()[id];
  if (!confirm(`Usunąć węzeł "${node?.label.replace('\n', ' ')}"?`)) return;
  saveLocalNodes(getLocalNodes().filter(n => n.id !== id));
  mapRemoveNode(id);
  closePanel();
  updateNodeCount();
  showToast('🗑 Dziwka usunięta');
}

function toggleSearch() {
  const box = document.getElementById('search-box');
  const btn = document.getElementById('search-toggle-btn');
  const isOpen = box.classList.toggle('visible');
  btn.classList.toggle('active', isOpen);
  box.setAttribute('aria-hidden', String(!isOpen));
  if (isOpen) setTimeout(() => document.getElementById('search-input').focus(), 100);
}

function doSearch(query) {
  const results = document.getElementById('search-results');
  if (!query.trim()) { results.innerHTML = ''; return; }
  const q = query.toLowerCase();
  const matches = mapGetNodes()
    .filter(n => n.label.toLowerCase().includes(q) || (n.desc || '').toLowerCase().includes(q))
    .slice(0, 6);
  results.innerHTML = '';
  matches.forEach(node => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.setAttribute('role', 'option');
    item.innerHTML = `<div class="sri-name" style="color:${node.color}">${node.label.replace('\n', ' ')}${isLocalNode(node.id) ? '<span class="local-badge">★</span>' : ''}</div><div class="sri-cat">${node.tag || ''}</div>`;
    item.addEventListener('click', () => {
      mapNavigateTo(node.id);
      openPanel(node.id);
      toggleSearch();
      document.getElementById('search-input').value = '';
      results.innerHTML = '';
    });
    results.appendChild(item);
  });
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(mapGetNodes(), null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'data.json' });
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('💾 Plik data.json pobrany! Wgraj go do repozytorium GitHub.');
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error('Nie jest tablicą');
      const existingIds = new Set(mapGetNodes().map(n => n.id));
      const toAdd = imported.filter(n => !existingIds.has(n.id));
      saveLocalNodes([...getLocalNodes(), ...toAdd]);
      toAdd.forEach(n => mapAddNode(n));
      updateNodeCount();
      showToast(`✅ Zaimportowano ${toAdd.length} nowych węzłów`);
    } catch (err) {
      showToast('❌ Błąd importu: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function bindUI() {
  document.getElementById('intro-start-btn').addEventListener('click', () => {
    const overlay = document.getElementById('intro-overlay');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(() => overlay.remove(), 500);
  });

  document.getElementById('search-toggle-btn').addEventListener('click', toggleSearch);
  document.getElementById('add-node-btn').addEventListener('click', () => openModal());
  document.getElementById('reset-view-btn').addEventListener('click', mapFitView);
  document.getElementById('search-input').addEventListener('input', e => doSearch(e.target.value));
  document.getElementById('zoom-in-btn').addEventListener('click',  () => mapZoom(1.25));
  document.getElementById('zoom-out-btn').addEventListener('click', () => mapZoom(0.8));
  document.getElementById('fit-btn').addEventListener('click', mapFitView);
  document.getElementById('close-panel-btn').addEventListener('click', closePanel);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-save-btn').addEventListener('click', saveNode);

  document.getElementById('cat-radio').addEventListener('click', e => {
    const card = e.target.closest('.radio-card');
    if (!card) return;
    const cat = card.getAttribute('data-cat');
    document.querySelectorAll('#cat-radio .radio-card').forEach(c => {
      const isThis = c === card;
      c.classList.toggle('checked', isThis);
      c.querySelector('input').checked = isThis;
      c.style.borderColor = isThis ? (CAT_COLORS[c.getAttribute('data-cat')] || '#666') : 'transparent';
    });
    const sw = document.querySelector(`.color-swatch[data-color="${CAT_COLORS[cat]}"]`);
    if (sw) selectSwatch(sw);
  });

  document.getElementById('color-picker').addEventListener('click', e => {
    const sw = e.target.closest('.color-swatch');
    if (sw) selectSwatch(sw);
  });

  document.querySelectorAll('.legend-item').forEach(btn => {
    btn.addEventListener('click', () => mapFilterCategory(btn.getAttribute('data-filter')));
  });

  document.getElementById('export-btn').addEventListener('click', exportJSON);
  document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', importJSON);
  document.getElementById('map-canvas').addEventListener('click', () => closePanel());

  const svg = document.getElementById('map-canvas');
  svg.addEventListener('nodeclick', e => openPanel(e.detail.id));
  svg.addEventListener('nodeleave', e => {
    if (_selectedNodeId !== e.detail.id) mapHighlightEdges(e.detail.id, false);
  });

  window.addEventListener('keydown', e => {
    if (document.querySelector('.modal-overlay.open')) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNode();
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'f' || e.key === 'F') toggleSearch();
    if (e.key === 'n' || e.key === 'N') openModal();
    if (e.key === 'Escape') {
      closePanel();
      const box = document.getElementById('search-box');
      if (box.classList.contains('visible')) toggleSearch();
    }
  });
}

function selectSwatch(el) {
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  _selectedColor = el.getAttribute('data-color');
}
