// Synapsis: Knowledge Graph & Neural Nexus
// Synapsis: Knowledge Graph & Neural Nexus for Artificial Intelligence

const CATEGORY_META = {
  foundation: { name: 'Axiomas & Fundamentos', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)', border: '#a78bfa', shape: 'diamond' },
  ml_core: { name: 'M1: Conceitos Base', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', border: '#60a5fa', shape: 'dot' },
  preprocessing: { name: 'M1: Pré-processamento', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', border: '#34d399', shape: 'box' },
  metrics: { name: 'M1: Métricas & Avaliação', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', border: '#fbbf24', shape: 'dot' },
  unsupervised: { name: 'M2: Não Supervisionada', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.2)', border: '#2dd4bf', shape: 'dot' },
  non_connectionist: { name: 'M3: Não Conexionistas', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)', border: '#f472b6', shape: 'dot' },
  connectionist: { name: 'M4: Conexionistas (Redes)', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.2)', border: '#818cf8', shape: 'dot' },
  rule_based: { name: 'M5: Baseados em Regras', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)', border: '#facc15', shape: 'box' },
  complementary: { name: 'M6: Aspetos Complementares', color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)', border: '#fb923c', shape: 'dot' }
};

let network = null;
let nodesDataSet = null;
let edgesDataSet = null;
let activeConceptId = null;
let breadcrumbHistory = [];
let currentVisualMode = 'radial'; // 'radial' (Axiom dots) | 'cards' (boxes) | 'organic' (physics)
let currentDomain = 'academic_ml'; // 'all' | 'academic_ml' | 'foundations' | 'masters_ai'
let activeCategoryFilter = 'all';

// Map quick lookup
const conceptMap = new Map();
CONCEPTS_DATA.forEach(c => conceptMap.set(c.id, c));

// Compute reverse dependencies (dependents) and degree
CONCEPTS_DATA.forEach(c => {
  c.dependents = [];
});
CONCEPTS_DATA.forEach(c => {
  (c.dependencies || []).forEach(depId => {
    const parent = conceptMap.get(depId);
    if (parent) {
      parent.dependents.push(c.id);
    }
  });
});
CONCEPTS_DATA.forEach(c => {
  c.degree = (c.dependencies ? c.dependencies.length : 0) + (c.dependents ? c.dependents.length : 0);
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initNetwork();
  setupCanvasResizeObserver();
  initDomainSelector();
  initVisualModeSelector();
  initCategoryFilter();
  initSearch();
  initTabs();
  initCanvasControls();
  initAiExportButton();
  initLegendModal();
  initDeepLinking();

  // Initial domain and concept from URL hash or default
  const hash = window.location.hash.replace('#', '');
  if (hash && conceptMap.has(hash)) {
    const c = conceptMap.get(hash);
    applyDomainFilter(c.domain || 'academic_ml');
    selectConcept(hash);
  } else {
    applyDomainFilter('academic_ml');
    selectConcept('decision_trees_id3');
  }
});

// Setup dynamic ResizeObserver to guarantee 100% accurate mouse events
function setupCanvasResizeObserver() {
  const container = document.getElementById('network-canvas');
  if (!container || !window.ResizeObserver) return;

  const ro = new ResizeObserver(() => {
    if (network) {
      network.setSize('100%', '100%');
      network.redraw();
    }
  });
  ro.observe(container);

  window.addEventListener('resize', () => {
    if (network) {
      network.setSize('100%', '100%');
      network.redraw();
    }
  });
}

function initNetwork() {
  const container = document.getElementById('network-canvas');

  const nodes = buildNodesData(currentVisualMode);
  const edges = buildEdgesData(currentVisualMode);

  nodesDataSet = new vis.DataSet(nodes);
  edgesDataSet = new vis.DataSet(edges);

  const data = { nodes: nodesDataSet, edges: edgesDataSet };
  const options = getNetworkOptions(currentVisualMode);

  network = new vis.Network(container, data, options);

  // Setup robust mouse interaction: distinct drag vs click & smooth custom zoom
  setupMouseAndZoomHandling(container);

  // Draw Celestial Orbit Rings in Radial Mode
  network.on('beforeDrawing', ctx => {
    if (currentVisualMode === 'radial') {
      drawAxiomCelestialOrbits(ctx);
    }
  });

  // Double click event to focus & zoom in
  network.on('doubleClick', params => {
    if (params.nodes && params.nodes.length > 0) {
      const scale = network.getScale();
      network.focus(params.nodes[0], {
        scale: Math.min(2.5, scale * 1.4),
        animation: { duration: 350, easingFunction: 'easeInOutQuad' }
      });
    }
  });

  // Hover feedback
  network.on('hoverNode', () => {
    container.style.cursor = 'pointer';
  });
  network.on('blurNode', () => {
    container.style.cursor = 'grab';
  });

  // Stabilized event
  network.on('stabilizationIterationsDone', () => {
    network.setOptions({ physics: { enabled: currentVisualMode === 'organic' } });
  });
}

// Robust Mouse & Zoom Handling: Strictly separates moving/panning from clicking,
// and provides silky-smooth cursor-centered zooming
function setupMouseAndZoomHandling(container) {
  let isCanvasDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragTotalDist = 0;
  let lastDragEndTime = 0;

  network.on('dragStart', params => {
    isCanvasDragging = false;
    dragTotalDist = 0;
    container.style.cursor = 'grabbing';
    if (params.event && params.event.srcEvent) {
      dragStartX = params.event.srcEvent.clientX;
      dragStartY = params.event.srcEvent.clientY;
    }
  });

  network.on('dragging', params => {
    if (params.event && params.event.srcEvent) {
      const dx = params.event.srcEvent.clientX - dragStartX;
      const dy = params.event.srcEvent.clientY - dragStartY;
      dragTotalDist = Math.hypot(dx, dy);
      if (dragTotalDist > 5) {
        isCanvasDragging = true;
      }
    } else {
      isCanvasDragging = true;
    }
  });

  network.on('dragEnd', params => {
    container.style.cursor = 'grab';
    if (params.event && params.event.srcEvent) {
      const dx = params.event.srcEvent.clientX - dragStartX;
      const dy = params.event.srcEvent.clientY - dragStartY;
      if (Math.hypot(dx, dy) > 5) {
        isCanvasDragging = true;
      }
    }
    lastDragEndTime = Date.now();
    setTimeout(() => {
      isCanvasDragging = false;
      dragTotalDist = 0;
    }, 120);
  });

  // Click event: strictly ignored if the user dragged or panned
  network.on('click', params => {
    if (isCanvasDragging || dragTotalDist > 5 || (Date.now() - lastDragEndTime < 120)) {
      return; // Discard: this was a pan/move gesture, not an intentional click!
    }
    if (params.nodes && params.nodes.length > 0) {
      selectConcept(params.nodes[0]);
    }
  });

  // Cursor-Anchored Smooth Zoom (Wheel)
  container.addEventListener('wheel', e => {
    e.preventDefault();
    e.stopPropagation();

    if (!network) return;

    const rect = container.getBoundingClientRect();
    const mouseDOM = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Canvas world point under mouse before scaling
    const canvasWorldPos = network.DOMtoCanvas(mouseDOM);

    // Normalize delta across browsers, operating systems and touchpads
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 20; // Line mode
    else if (e.deltaMode === 2) delta *= 400; // Page mode

    // Dampened delta
    const clampedDelta = Math.max(-90, Math.min(90, delta));
    const zoomFactor = Math.exp(-clampedDelta * 0.0017);

    const currentScale = network.getScale();
    let targetScale = currentScale * zoomFactor;

    // Clamp zoom scale between 0.15 and 3.2
    targetScale = Math.max(0.15, Math.min(3.2, targetScale));

    // Anchor-pinned moveTo
    network.moveTo({
      position: canvasWorldPos,
      offset: {
        x: (rect.width / 2) - mouseDOM.x,
        y: (rect.height / 2) - mouseDOM.y
      },
      scale: targetScale
    });
  }, { passive: false });

  // Right-Click & Middle-Click Free Panning Anywhere
  let isAuxPanning = false;
  let auxPanStart = { x: 0, y: 0 };
  let auxPanCenter = { x: 0, y: 0 };

  container.addEventListener('mousedown', e => {
    if (e.button === 1 || e.button === 2) { // Middle or Right button
      isAuxPanning = true;
      auxPanStart = { x: e.clientX, y: e.clientY };
      auxPanCenter = network.getViewPosition();
      container.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', e => {
    if (isAuxPanning && network) {
      const dx = e.clientX - auxPanStart.x;
      const dy = e.clientY - auxPanStart.y;
      const scale = network.getScale();
      network.moveTo({
        position: {
          x: auxPanCenter.x - (dx / scale),
          y: auxPanCenter.y - (dy / scale)
        }
      });
    }
  });

  window.addEventListener('mouseup', e => {
    if (isAuxPanning) {
      isAuxPanning = false;
      container.style.cursor = 'grab';
    }
  });

  // Suppress context menu on canvas so right-click drag is frictionless
  container.addEventListener('contextmenu', e => {
    e.preventDefault();
  });
}

// Build node styling based on the selected Axiom visual mode
function buildNodesData(visualMode) {
  // Center coordinates for radial mode
  const centerX = 0;
  const centerY = 0;

  // Group nodes by level for radial orbits
  const levelGroups = {};
  CONCEPTS_DATA.forEach(c => {
    const lvl = c.level || 0;
    if (!levelGroups[lvl]) levelGroups[lvl] = [];
    levelGroups[lvl].push(c);
  });

  return CONCEPTS_DATA.map(c => {
    const meta = CATEGORY_META[c.category] || { color: '#3b82f6', border: '#60a5fa', shape: 'dot' };
    const degree = c.degree || 1;

    let shape = 'dot';
    let size = Math.max(12, Math.min(28, 10 + degree * 2.2));
    let x = undefined;
    let y = undefined;

    if (visualMode === 'radial') {
      shape = 'dot';
      // Compute radial orbit based on level (Concentric celestial rings)
      const lvl = c.level !== undefined ? c.level : 0;
      const group = levelGroups[lvl] || [c];
      const count = group.length;

      // Ensure minimum distance of 95px between adjacent nodes on the same ring
      const minRadiusForSpacing = (count * 95) / (2 * Math.PI);
      const baseRadius = 140 + lvl * 180;
      const radius = Math.max(baseRadius, minRadiusForSpacing);

      const indexInGroup = group.indexOf(c);
      // Stagger angular offset by level to create dynamic galaxy feel
      const angleOffset = (lvl * 0.45);
      const angle = (indexInGroup / Math.max(1, count)) * 2 * Math.PI + angleOffset;
      x = Math.round(centerX + Math.cos(angle) * radius);
      y = Math.round(centerY + Math.sin(angle) * radius);
    } else if (visualMode === 'cards') {
      shape = 'box';
      size = 20;
    } else {
      // Organic mode
      shape = meta.shape || 'dot';
      size = Math.max(14, Math.min(30, 12 + degree * 2.5));
    }

    return {
      id: c.id,
      label: c.label,
      level: c.level,
      category: c.category,
      domain: c.domain || 'academic_ml',
      shape: shape,
      size: size,
      x: x,
      y: y,
      margin: visualMode === 'cards' ? 10 : 8,
      color: {
        background: '#111827',
        border: meta.color,
        highlight: {
          background: '#1e3a8a',
          border: '#60a5fa'
        },
        hover: {
          background: '#1f2937',
          border: meta.border
        }
      },
      font: {
        color: '#f3f4f6',
        size: visualMode === 'cards' ? 12.5 : 12,
        face: 'Inter, sans-serif',
        background: visualMode === 'radial' ? 'rgba(10, 14, 23, 0.85)' : undefined,
        strokeWidth: visualMode === 'radial' ? 0 : 2,
        strokeColor: '#0a0e17'
      },
      borderWidth: 2.2,
      shadow: {
        enabled: true,
        color: meta.color,
        size: 8,
        x: 0,
        y: 2
      }
    };
  });
}

function buildEdgesData(visualMode) {
  const edges = [];
  CONCEPTS_DATA.forEach(c => {
    (c.dependencies || []).forEach(depId => {
      edges.push({
        from: depId,
        to: c.id,
        arrows: {
          to: { enabled: true, scaleFactor: 0.75 }
        },
        color: {
          color: 'rgba(255, 255, 255, 0.22)',
          highlight: '#60a5fa',
          hover: '#93c5fd'
        },
        width: 1.5,
        smooth: visualMode === 'radial' ? {
          type: 'curvedCW',
          roundness: 0.15
        } : {
          type: 'cubicBezier',
          forceDirection: 'horizontal',
          roundness: 0.5
        }
      });
    });
  });
  return edges;
}

function getNetworkOptions(visualMode) {
  if (visualMode === 'cards') {
    return {
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'LR',
          sortMethod: 'directed',
          levelSeparation: 260,
          nodeSpacing: 110,
          treeSpacing: 180
        }
      },
      physics: false,
      interaction: {
        dragNodes: false, // In cards hierarchy, dragging anywhere pans the view smoothly
        dragView: true,
        zoomView: false, // Handled by silky smooth cursor-anchored zoom
        hover: true,
        hoverConnectedEdges: true
      }
    };
  } else if (visualMode === 'radial') {
    // Axiom Orbital mode: fixed coordinates or subtle radial physics
    return {
      layout: {
        hierarchical: { enabled: false },
        improvedLayout: true
      },
      physics: false, // Static orbital placement computed mathematically
      interaction: {
        dragNodes: false, // In radial orbital mode, dragging anywhere pans the view smoothly
        dragView: true,
        zoomView: false, // Handled by silky smooth cursor-anchored zoom
        hover: true,
        hoverConnectedEdges: true
      }
    };
  } else {
    // Organic Force-directed
    return {
      layout: { hierarchical: { enabled: false } },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -40,
          centralGravity: 0.008,
          springLength: 90,
          springConstant: 0.06,
          damping: 0.5
        },
        stabilization: { iterations: 120 }
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: false, // Handled by silky smooth cursor-anchored zoom
        hover: true,
        hoverConnectedEdges: true
      }
    };
  }
}

// Visual Mode Switcher (Radial Axiom vs Cards vs Organic)
function initVisualModeSelector() {
  const container = document.getElementById('view-modes-bar');
  if (!container) return;

  container.addEventListener('click', e => {
    const btn = e.target.closest('.view-mode-btn');
    if (!btn) return;

    const mode = btn.dataset.mode;
    if (mode === currentVisualMode) return;

    currentVisualMode = mode;
    document.querySelectorAll('.view-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    // Rebuild graph layout
    const newNodes = buildNodesData(currentVisualMode);
    const newEdges = buildEdgesData(currentVisualMode);

    nodesDataSet.clear();
    nodesDataSet.add(newNodes);

    edgesDataSet.clear();
    edgesDataSet.add(newEdges);

    network.setOptions(getNetworkOptions(currentVisualMode));
    applyDomainFilter(currentDomain);

    if (activeConceptId) {
      selectConcept(activeConceptId);
    } else {
      network.fit({ animation: { duration: 500 } });
    }
  });
}

// Draw Celestial Orbit Rings in Radial Mode
function drawAxiomCelestialOrbits(ctx) {
  const levelRadii = {
    0: 160,
    1: 340,
    2: 520,
    3: 700,
    4: 880,
    5: 1060,
    6: 1240
  };

  const ringLabels = {
    0: 'NÍVEL 0 • FUNDAMENTOS MATEMÁTICOS & AXIOMAS',
    1: 'NÍVEL 1 • ESPAÇOS MÉTRICOS, ESTATÍSTICA & PRÉ-PROCESSAMENTO',
    2: 'NÍVEL 2 • MODELOS INDUTIVOS & ALGORITMOS NUCLEARES',
    3: 'NÍVEL 3 • OTIMIZAÇÃO CONVEXA, HIPERPLANOS & MÉTRICAS',
    4: 'NÍVEL 4 • ENSEMBLES & REDES NEURONAIS PROFUNDAS',
    5: 'NÍVEL 5 • PARADIGMAS INTEGRADOS & MODELOS GENERATIVOS'
  };

  ctx.save();
  for (let lvl = 0; lvl <= 5; lvl++) {
    const r = levelRadii[lvl] || (160 + lvl * 180);
    const label = ringLabels[lvl];

    // Orbital celestial ring
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([8, 10]);
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.16)';
    ctx.stroke();

    // Subtle label on northern zenith of each orbit
    ctx.setLineDash([]);
    ctx.font = '600 10px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(147, 197, 253, 0.42)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`✦ ${label} ✦`, 0, -r - 5);
  }
  ctx.restore();
}

// Domain Switcher
function initDomainSelector() {
  const select = document.getElementById('domain-select');
  if (!select) return;

  select.addEventListener('change', e => {
    applyDomainFilter(e.target.value);
  });
}

function applyDomainFilter(domain) {
  currentDomain = domain;
  activeCategoryFilter = 'all';

  // Synchronize select control if call originated from deep link or button
  const select = document.getElementById('domain-select');
  if (select && select.value !== domain) {
    select.value = domain;
  }

  initCategoryFilter();

  const updates = [];
  CONCEPTS_DATA.forEach(c => {
    const inDomain = (domain === 'all' || c.domain === domain || (c.domains && c.domains.includes(domain)));
    updates.push({
      id: c.id,
      hidden: !inDomain
    });
  });
  nodesDataSet.update(updates);

  // Default selection in this domain if current concept is hidden
  const currentConcept = conceptMap.get(activeConceptId);
  const currentIsVisible = currentConcept && (domain === 'all' || currentConcept.domain === domain || (currentConcept.domains && currentConcept.domains.includes(domain)));

  if (!currentIsVisible) {
    if (domain === 'masters_ai') {
      selectConcept('transformers_self_attention');
    } else if (domain === 'foundations') {
      selectConcept('prob_theory');
    } else {
      selectConcept('decision_trees_id3');
    }
  }

  setTimeout(() => {
    network.fit({ animation: { duration: 400 } });
  }, 100);
}

// Category filter chips
function initCategoryFilter() {
  const container = document.getElementById('category-filter-bar');
  if (!container) return;

  const relevantCats = new Set();
  CONCEPTS_DATA.forEach(c => {
    const inDomain = (currentDomain === 'all' || c.domain === currentDomain || (c.domains && c.domains.includes(currentDomain)));
    if (inDomain) {
      relevantCats.add(c.category);
    }
  });

  const categories = [
    { id: 'all', name: 'Todos os Conceitos' },
    ...Array.from(relevantCats).map(k => ({ id: k, name: CATEGORY_META[k] ? CATEGORY_META[k].name : k }))
  ];

  container.innerHTML = categories.map(cat => `
    <button class="filter-chip ${cat.id === activeCategoryFilter ? 'active' : ''}" data-cat="${cat.id}">
      ${cat.name}
    </button>
  `).join('');

  container.onclick = e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const catId = chip.dataset.cat;
    applyCategoryFilter(catId);
  };
}

function applyCategoryFilter(catId) {
  activeCategoryFilter = catId;
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === catId);
  });

  const updates = [];
  CONCEPTS_DATA.forEach(c => {
    const inDomain = (currentDomain === 'all' || c.domain === currentDomain || (c.domains && c.domains.includes(currentDomain)));
    const visible = inDomain && (catId === 'all' || c.category === catId);
    updates.push({
      id: c.id,
      hidden: !visible
    });
  });
  nodesDataSet.update(updates);

  if (catId !== 'all') {
    const firstInCat = CONCEPTS_DATA.find(c => {
      const inDomain = (currentDomain === 'all' || c.domain === currentDomain || (c.domains && c.domains.includes(currentDomain)));
      return inDomain && c.category === catId;
    });
    if (firstInCat) selectConcept(firstInCat.id);
  }
}

// Smart Search with Accent Folding & Dropdown Autocomplete
function initSearch() {
  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-results-dropdown');
  if (!input) return;

  const normalize = (str) => {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };

  input.addEventListener('input', e => {
    const rawQuery = e.target.value;
    const query = normalize(rawQuery);

    if (!query) {
      if (dropdown) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
      }
      applyCategoryFilter(activeCategoryFilter);
      return;
    }

    const matches = [];
    const updates = [];

    CONCEPTS_DATA.forEach(c => {
      const inDomain = (currentDomain === 'all' || c.domain === currentDomain || (c.domains && c.domains.includes(currentDomain)));
      const matchLabel = normalize(c.label).includes(query);
      const matchId = normalize(c.id).includes(query);
      const matchSummary = normalize(c.summary).includes(query);
      const matchDef = normalize(c.definition).includes(query);
      const matchFormula = normalize(c.formula).includes(query);
      const matchCode = normalize(c.code).includes(query);
      const matchModule = normalize(c.course_module).includes(query);
      const matchRefs = normalize(c.references).includes(query);

      const isMatch = inDomain && (matchLabel || matchId || matchSummary || matchDef || matchFormula || matchCode || matchModule || matchRefs);

      if (isMatch) {
        matches.push(c);
      }
      updates.push({ id: c.id, hidden: !isMatch });
    });

    nodesDataSet.update(updates);

    if (dropdown) {
      if (matches.length > 0) {
        dropdown.innerHTML = matches.slice(0, 8).map(m => {
          const meta = CATEGORY_META[m.category] || { name: 'Geral', color: '#3b82f6' };
          return `
            <div class="search-result-item" data-id="${m.id}">
              <div class="search-result-title">${m.label}</div>
              <div class="search-result-badge" style="color:${meta.color}; border: 1px solid ${meta.color}40;">
                ${m.course_module || meta.name}
              </div>
            </div>
          `;
        }).join('');
        dropdown.classList.add('active');
      } else {
        dropdown.innerHTML = `<div class="search-empty-state">Nenhum conceito encontrado para "${rawQuery}".</div>`;
        dropdown.classList.add('active');
      }
    }

    if (matches.length > 0 && !activeConceptId) {
      selectConcept(matches[0].id);
    }
  });

  if (dropdown) {
    dropdown.addEventListener('click', e => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      const id = item.dataset.id;
      selectConcept(id);
      dropdown.classList.remove('active');
      input.value = '';
      applyCategoryFilter(activeCategoryFilter);
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.search-controls')) {
        dropdown.classList.remove('active');
      }
    });
  }
}

// Concept selection & Inspector update
function selectConcept(conceptId) {
  const concept = conceptMap.get(conceptId);
  if (!concept) return;

  activeConceptId = conceptId;
  window.location.hash = conceptId;

  // Breadcrumbs history
  if (breadcrumbHistory[breadcrumbHistory.length - 1] !== conceptId) {
    breadcrumbHistory.push(conceptId);
    if (breadcrumbHistory.length > 6) breadcrumbHistory.shift();
  }
  renderBreadcrumbs();

  // Highlight graph pathways
  highlightNetworkPath(concept);

  // Render Inspector drawer
  renderInspector(concept);

  // Smooth focus on the node while preserving user's current zoom level
  const currentScale = network ? network.getScale() : 1.0;
  network.focus(conceptId, {
    scale: currentScale,
    animation: { duration: 300, easingFunction: 'easeInOutQuad' }
  });
}

function highlightNetworkPath(concept) {
  const ancestorIds = getAncestors(concept.id);
  const dependentIds = new Set(concept.dependents || []);

  const nodeUpdates = [];
  CONCEPTS_DATA.forEach(c => {
    const meta = CATEGORY_META[c.category] || { color: '#3b82f6', border: '#60a5fa' };
    const isMain = c.id === concept.id;
    const isAncestor = ancestorIds.has(c.id);
    const isDependent = dependentIds.has(c.id);

    if (isMain) {
      nodeUpdates.push({
        id: c.id,
        borderWidth: 4,
        color: {
          background: '#1e3a8a',
          border: '#60a5fa'
        },
        shadow: { size: 20, color: '#3b82f6' }
      });
    } else if (isAncestor) {
      nodeUpdates.push({
        id: c.id,
        borderWidth: 3,
        color: {
          background: '#1e1b4b',
          border: '#a78bfa'
        },
        shadow: { size: 12, color: '#8b5cf6' }
      });
    } else if (isDependent) {
      nodeUpdates.push({
        id: c.id,
        borderWidth: 3,
        color: {
          background: '#064e3b',
          border: '#34d399'
        },
        shadow: { size: 12, color: '#10b981' }
      });
    } else {
      nodeUpdates.push({
        id: c.id,
        borderWidth: 1.8,
        color: {
          background: '#111827',
          border: meta.color
        },
        shadow: { size: 4, color: 'rgba(0,0,0,0.4)' }
      });
    }
  });

  nodesDataSet.update(nodeUpdates);
}

// Recursive Ancestors
function getAncestors(id, visited = new Set()) {
  const c = conceptMap.get(id);
  if (!c) return visited;

  (c.dependencies || []).forEach(depId => {
    if (!visited.has(depId)) {
      visited.add(depId);
      getAncestors(depId, visited);
    }
  });
  return visited;
}

function computeLineageSteps(id) {
  const chain = [];
  const current = conceptMap.get(id);
  if (!current) return chain;

  function traverse(node, depth = 0) {
    chain.push({ node, depth });
    if (node.dependencies && node.dependencies.length > 0) {
      node.dependencies.forEach(depId => {
        const dep = conceptMap.get(depId);
        if (dep && !chain.some(item => item.node.id === dep.id)) {
          traverse(dep, depth + 1);
        }
      });
    }
  }

  traverse(current);
  return chain;
}

function renderBreadcrumbs() {
  const bar = document.getElementById('breadcrumbs-bar');
  if (!bar) return;

  bar.innerHTML = breadcrumbHistory.map((id, idx) => {
    const c = conceptMap.get(id);
    const label = c ? c.label : id;
    const isLast = idx === breadcrumbHistory.length - 1;
    return `
      <span class="breadcrumb-item ${isLast ? 'active' : ''}" onclick="selectConcept('${id}')" style="${isLast ? 'font-weight:700; color:#60a5fa;' : ''}">
        ${label}
      </span>
      ${!isLast ? '<span class="breadcrumb-sep">/</span>' : ''}
    `;
  }).join('');
}

function renderInspector(concept) {
  const panel = document.getElementById('inspector-panel');
  if (!panel) return;

  panel.classList.remove('collapsed');

  const meta = CATEGORY_META[concept.category] || { name: 'Geral', color: '#3b82f6' };

  document.getElementById('concept-badge').textContent = meta.name;
  document.getElementById('concept-badge').style.backgroundColor = meta.bg;
  document.getElementById('concept-badge').style.color = meta.border;
  document.getElementById('concept-badge').style.borderColor = meta.color;

  document.getElementById('concept-title').textContent = concept.label;

  document.getElementById('concept-summary').textContent = concept.summary || '';
  document.getElementById('concept-def-text').textContent = concept.definition || '';

  // KaTeX formula
  const mathCard = document.getElementById('concept-formula');
  if (concept.formula) {
    mathCard.innerHTML = `<div id="katex-target">$$${concept.formula}$$</div>`;
    mathCard.style.display = 'block';
    if (window.katex) {
      try {
        katex.render(concept.formula, document.getElementById('katex-target'), { displayMode: true, throwOnError: false });
      } catch (e) {
        document.getElementById('katex-target').textContent = concept.formula;
      }
    }
  } else {
    mathCard.style.display = 'none';
  }

  document.getElementById('concept-example').textContent = concept.example || 'Nenhum exemplo prático adicional.';

  // Prerequisites chips
  const depsContainer = document.getElementById('prereq-chips');
  if (concept.dependencies && concept.dependencies.length > 0) {
    depsContainer.innerHTML = concept.dependencies.map(depId => {
      const dep = conceptMap.get(depId);
      if (!dep) return '';
      const depMeta = CATEGORY_META[dep.category] || { color: '#3b82f6' };
      return `
        <div class="chip" onclick="selectConcept('${dep.id}')" title="${dep.summary}">
          <span class="chip-dot" style="background:${depMeta.color}"></span>
          <span>${dep.label}</span>
        </div>
      `;
    }).join('');
  } else {
    depsContainer.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">Axioma Fundamental / Base primitiva sem pré-requisitos</span>';
  }

  // Dependents chips
  const dependentsContainer = document.getElementById('dependents-chips');
  if (concept.dependents && concept.dependents.length > 0) {
    dependentsContainer.innerHTML = concept.dependents.map(depId => {
      const dep = conceptMap.get(depId);
      if (!dep) return '';
      const depMeta = CATEGORY_META[dep.category] || { color: '#3b82f6' };
      return `
        <div class="chip" onclick="selectConcept('${dep.id}')" title="${dep.summary}">
          <span class="chip-dot" style="background:${depMeta.color}"></span>
          <span>${dep.label}</span>
        </div>
      `;
    }).join('');
  } else {
    dependentsContainer.innerHTML = '<span style="font-size:12px; color:var(--text-muted);">Conceito terminal / Aplicação de topo</span>';
  }

  // Lineage list
  const lineageList = document.getElementById('lineage-list');
  const lineageSteps = computeLineageSteps(concept.id);
  lineageList.innerHTML = lineageSteps.map((step, idx) => {
    const stepMeta = CATEGORY_META[step.node.category] || { name: 'Geral', color: '#3b82f6' };
    const isCurrent = step.node.id === concept.id;
    return `
      <div class="lineage-step">
        <div class="lineage-index" style="${isCurrent ? 'background:#3b82f6; color:#fff;' : ''}">${idx + 1}</div>
        <div class="lineage-info" onclick="selectConcept('${step.node.id}')" style="${isCurrent ? 'border-color:#3b82f6;' : ''}">
          <div class="lineage-name">${step.node.label} ${isCurrent ? '⭐ (Atual)' : ''}</div>
          <div class="lineage-type" style="color:${stepMeta.color};">${stepMeta.name} • Nível ${step.node.level}</div>
        </div>
      </div>
    `;
  }).join('');

  // Code
  document.getElementById('concept-code').textContent = concept.code || '# Nenhum código scikit-learn associado.';

  // References
  document.getElementById('concept-refs').textContent = concept.references || 'Sem referência documental explícita.';

  // Render Interactive Simulator
  renderSimulator(concept);

  // Render Study Roadmap & Mastery Tracker
  renderRoadmap(concept);
}

// ============================================================================
// Verified Mathematical Simulators & Playgrounds (Synapsis 3.0)
// ============================================================================

function renderSimulator(concept) {
  const container = document.getElementById('interactive-simulator-container');
  if (!container) return;

  // Explicit configuration only: no fragile substring heuristics!
  const simConfig = concept.simulator;
  const simType = simConfig ? simConfig.type : null;

  switch (simType) {
    case 'entropy_gain':
      renderEntropyGainSimulator(container, concept);
      break;
    case 'knn_spatial':
      renderKnnSpatialSimulator(container, concept);
      break;
    case 'confusion_matrix':
      renderConfusionMatrixSimulator(container, concept);
      break;
    case 'neural_activations':
      renderNeuralActivationsSimulator(container, concept);
      break;
    case 'bayesian_inference':
      renderBayesianInferenceSimulator(container, concept);
      break;
    case 'gradient_descent':
      renderGradientDescentSimulator(container, concept);
      break;
    case 'svm_margin':
      renderSvmMarginSimulator(container, concept);
      break;
    default:
      renderTheoreticalConceptFallback(container, concept);
      break;
  }
}



// 1. Simulator: Shannon Entropy, Information Gain (ID3), Gain Ratio (C4.5) & Gini (CART)
function renderEntropyGainSimulator(container, concept) {
  container.innerHTML = `
    <div class="sim-card">
      <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:8px;">
        📊 Critérios de Divisão Indutiva: ID3 (Entropia), C4.5 (Gain Ratio) e CART (Gini)
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Proporção da Classe Positiva no Nó Pai: P(C₁) = p</span>
          <span id="shannon-p-val" style="font-weight:700; color:#3b82f6;">0.50</span>
        </div>
        <input type="range" class="sim-slider" id="shannon-slider-p" min="0.05" max="0.95" step="0.01" value="0.50">
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Ponderação do Ramo Esquerdo (w_L = |D_L| / |D|):</span>
          <span id="shannon-wl-val" style="font-weight:700; color:#10b981;">0.50</span>
        </div>
        <input type="range" class="sim-slider" id="shannon-slider-wl" min="0.10" max="0.90" step="0.05" value="0.50">
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Pureza do Ramo Esquerdo: P(C₁ | Esquerda) = p_L [Intervalo Válido]</span>
          <span id="shannon-pl-val" style="font-weight:700; color:#a78bfa;">0.80</span>
        </div>
        <input type="range" class="sim-slider" id="shannon-slider-pl" min="0.01" max="0.99" step="0.01" value="0.80">
      </div>

      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Entropia Pai H(D)</div>
          <div class="sim-result-value" id="shannon-h-val">1.000 bits</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Ganho ID3 (ΔH)</div>
          <div class="sim-result-value" id="shannon-ig-val" style="color:#10b981;">0.278 bits</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Gain Ratio C4.5</div>
          <div class="sim-result-value" id="shannon-gr-val" style="color:#38bdf8;">0.278</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Redução Gini CART</div>
          <div class="sim-result-value" id="shannon-dgini-val" style="color:#f59e0b;">0.180</div>
        </div>
      </div>
      <div class="sim-status-bar" id="shannon-status">
        Cálculo em conformidade estrita com a equação de conservação: w_L*p_L + (1-w_L)*p_R = p.
      </div>
    </div>
  `;

  const sliderP = document.getElementById('shannon-slider-p');
  const sliderWl = document.getElementById('shannon-slider-wl');
  const sliderPl = document.getElementById('shannon-slider-pl');

  const calc = () => {
    const p = parseFloat(sliderP.value);
    const wL = parseFloat(sliderWl.value);

    // Exact mathematical feasibility interval:
    // 0 <= pR <= 1  <===>  (p - (1 - wL))/wL <= pL <= p/wL
    const pLMin = Math.max(0.001, (p - (1 - wL)) / wL);
    const pLMax = Math.min(0.999, p / wL);

    sliderPl.min = pLMin.toFixed(3);
    sliderPl.max = pLMax.toFixed(3);

    let pL = parseFloat(sliderPl.value);
    if (pL < pLMin) pL = pLMin;
    if (pL > pLMax) pL = pLMax;
    sliderPl.value = pL;

    document.getElementById('shannon-p-val').textContent = p.toFixed(2);
    document.getElementById('shannon-wl-val').textContent = wL.toFixed(2);
    document.getElementById('shannon-pl-val').textContent = `${pL.toFixed(2)} (válido: [${pLMin.toFixed(2)}, ${pLMax.toFixed(2)}])`;

    // Exact right-branch class proportion
    const pR = (p - wL * pL) / (1 - wL);

    // 1. Shannon Entropies (ID3)
    const hD = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
    const hDL = -(pL * Math.log2(pL) + (1 - pL) * Math.log2(1 - pL));
    const hDR = -(pR * Math.log2(pR) + (1 - pR) * Math.log2(1 - pR));
    const hSplit = wL * hDL + (1 - wL) * hDR;
    const ig = Math.max(0, hD - hSplit);

    // 2. C4.5 Split Info & Gain Ratio
    const splitInfo = -(wL * Math.log2(wL) + (1 - wL) * Math.log2(1 - wL));
    const gainRatio = splitInfo > 0.0001 ? (ig / splitInfo) : 0;

    // 3. CART Gini Impurity Reduction
    const giniD = 2 * p * (1 - p);
    const giniDL = 2 * pL * (1 - pL);
    const giniDR = 2 * pR * (1 - pR);
    const giniSplit = wL * giniDL + (1 - wL) * giniDR;
    const deltaGini = Math.max(0, giniD - giniSplit);

    document.getElementById('shannon-h-val').textContent = hD.toFixed(3) + ' bits';
    document.getElementById('shannon-ig-val').textContent = ig.toFixed(3) + ' bits';
    document.getElementById('shannon-gr-val').textContent = gainRatio.toFixed(3);
    document.getElementById('shannon-dgini-val').textContent = deltaGini.toFixed(3);

    const statusEl = document.getElementById('shannon-status');
    statusEl.innerHTML = `Conservação Exata: P(C₁|Dir) = ${pR.toFixed(2)} (Ramo Direito). Ganho ID3 = <strong>${ig.toFixed(3)} bits</strong> | Redução Gini CART = <strong>${deltaGini.toFixed(3)}</strong>.`;
  };

  sliderP.addEventListener('input', calc);
  sliderWl.addEventListener('input', calc);
  sliderPl.addEventListener('input', calc);
  calc();
}

// 2. Simulator: Distance Metrics in Metric Spaces (k-NN, Lp Norms)
function renderKnnSpatialSimulator(container, concept) {
  container.innerHTML = `
    <div class="sim-card">
      <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:8px;">
        📐 Métricas de Distância em Espaços Normados L_p (Minkowski)
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Distância em X (Δx = |x_q - x_i|):</span>
          <span id="knn-dx-val" style="font-weight:700; color:#3b82f6;">3.0</span>
        </div>
        <input type="range" class="sim-slider" id="knn-slider-dx" min="0" max="10" step="0.2" value="3.0">
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Distância em Y (Δy = |y_q - y_i|):</span>
          <span id="knn-dy-val" style="font-weight:700; color:#3b82f6;">4.0</span>
        </div>
        <input type="range" class="sim-slider" id="knn-slider-dy" min="0" max="10" step="0.2" value="4.0">
      </div>

      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Manhattan (L₁)</div>
          <div class="sim-result-value" id="knn-l1-val" style="color:#10b981;">7.00</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Euclidiana (L₂)</div>
          <div class="sim-result-value" id="knn-l2-val" style="color:#60a5fa;">5.00</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Chebyshev (L_∞)</div>
          <div class="sim-result-value" id="knn-linf-val" style="color:#f59e0b;">4.00</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Ordem Topológica</div>
          <div class="sim-result-value" id="knn-order-val" style="color:#a78bfa; font-size:11px;">L_∞ ≤ L₂ ≤ L₁</div>
        </div>
      </div>
      <div class="sim-status-bar" id="knn-status">
        Demonstração do Teorema das Normas: L_∞(x) ≤ L₂(x) ≤ L₁(x). Em alta dimensionalidade (d >> 1), a razão entre a distância mínima e máxima colapsa para 1 (Maldição da Dimensionalidade).
      </div>
    </div>
  `;

  const calc = () => {
    const dx = parseFloat(document.getElementById('knn-slider-dx').value);
    const dy = parseFloat(document.getElementById('knn-slider-dy').value);
    document.getElementById('knn-dx-val').textContent = dx.toFixed(1);
    document.getElementById('knn-dy-val').textContent = dy.toFixed(1);

    const l1 = dx + dy;
    const l2 = Math.hypot(dx, dy);
    const linf = Math.max(dx, dy);

    document.getElementById('knn-l1-val').textContent = l1.toFixed(2);
    document.getElementById('knn-l2-val').textContent = l2.toFixed(2);
    document.getElementById('knn-linf-val').textContent = linf.toFixed(2);
  };

  document.getElementById('knn-slider-dx').addEventListener('input', calc);
  document.getElementById('knn-slider-dy').addEventListener('input', calc);
  calc();
}

// 3. Simulator: Confusion Matrix & Evaluation Metrics
function renderConfusionMatrixSimulator(container, concept) {
  container.innerHTML = `
    <div class="sim-card">
      <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:8px;">
        🎯 Matriz de Confusão & Métricas Diagnósticas Derivadas
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px;">
        <div class="sim-slider-group">
          <div class="sim-slider-label"><span>Verdadeiros Positivos (TP)</span><span id="cm-tp-val" style="color:#10b981; font-weight:700;">50</span></div>
          <input type="range" class="sim-slider" id="cm-slider-tp" min="1" max="100" step="1" value="50">
        </div>
        <div class="sim-slider-group">
          <div class="sim-slider-label"><span>Falsos Positivos (FP)</span><span id="cm-fp-val" style="color:#ef4444; font-weight:700;">10</span></div>
          <input type="range" class="sim-slider" id="cm-slider-fp" min="0" max="100" step="1" value="10">
        </div>
        <div class="sim-slider-group">
          <div class="sim-slider-label"><span>Falsos Negativos (FN)</span><span id="cm-fn-val" style="color:#ef4444; font-weight:700;">5</span></div>
          <input type="range" class="sim-slider" id="cm-slider-fn" min="0" max="100" step="1" value="5">
        </div>
        <div class="sim-slider-group">
          <div class="sim-slider-label"><span>Verdadeiros Negativos (TN)</span><span id="cm-tn-val" style="color:#10b981; font-weight:700;">35</span></div>
          <input type="range" class="sim-slider" id="cm-slider-tn" min="1" max="100" step="1" value="35">
        </div>
      </div>

      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Precision (PPV)</div>
          <div class="sim-result-value" id="cm-prec-val" style="color:#3b82f6;">83.3%</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Recall (Sensibilidade)</div>
          <div class="sim-result-value" id="cm-rec-val" style="color:#10b981;">90.9%</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Specificity (TNR)</div>
          <div class="sim-result-value" id="cm-spec-val" style="color:#f59e0b;">77.8%</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">F1-Score Harmónico</div>
          <div class="sim-result-value" id="cm-f1-val" style="color:#a78bfa;">0.870</div>
        </div>
      </div>
      <div class="sim-status-bar" id="cm-status">
        Total de Amostras N = 100. Acurácia = 85.0%, Balanced Accuracy = 84.3%.
      </div>
    </div>
  `;

  const calc = () => {
    const tp = parseInt(document.getElementById('cm-slider-tp').value, 10);
    const fp = parseInt(document.getElementById('cm-slider-fp').value, 10);
    const fn = parseInt(document.getElementById('cm-slider-fn').value, 10);
    const tn = parseInt(document.getElementById('cm-slider-tn').value, 10);

    document.getElementById('cm-tp-val').textContent = tp;
    document.getElementById('cm-fp-val').textContent = fp;
    document.getElementById('cm-fn-val').textContent = fn;
    document.getElementById('cm-tn-val').textContent = tn;

    const total = tp + fp + fn + tn;
    const prec = (tp + fp) > 0 ? (tp / (tp + fp)) : 0;
    const rec = (tp + fn) > 0 ? (tp / (tp + fn)) : 0;
    const spec = (tn + fp) > 0 ? (tn / (tn + fp)) : 0;
    const f1 = (prec + rec) > 0 ? (2 * prec * rec / (prec + rec)) : 0;
    const acc = (tp + tn) / total;
    const balAcc = (rec + spec) / 2;

    document.getElementById('cm-prec-val').textContent = (prec * 100).toFixed(1) + '%';
    document.getElementById('cm-rec-val').textContent = (rec * 100).toFixed(1) + '%';
    document.getElementById('cm-spec-val').textContent = (spec * 100).toFixed(1) + '%';
    document.getElementById('cm-f1-val').textContent = f1.toFixed(3);

    document.getElementById('cm-status').textContent = 
      `Total de Amostras N = ${total} | Acurácia Geral = ${(acc * 100).toFixed(1)}% | Balanced Accuracy = ${(balAcc * 100).toFixed(1)}%`;
  };

  ['tp', 'fp', 'fn', 'tn'].forEach(key => {
    document.getElementById(`cm-slider-${key}`).addEventListener('input', calc);
  });
  calc();
}

// 4. Simulator: Neural Activation Functions & Vanishing Gradient (Sigmoid, ReLU, Tanh)
function renderNeuralActivationsSimulator(container, concept) {
  container.innerHTML = `
    <div class="sim-card">
      <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:8px;">
        ⚡ Funções de Ativação Neurais & Gradientes Analíticos
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Potencial de Ativação Linear (z = wᵀx + b):</span>
          <span id="act-z-val" style="font-weight:700; color:#3b82f6;">0.00</span>
        </div>
        <input type="range" class="sim-slider" id="act-slider-z" min="-6.0" max="6.0" step="0.1" value="0.00">
      </div>

      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Sigmóide σ(z) | σ'(z)</div>
          <div class="sim-result-value" id="act-sig-val" style="color:#38bdf8;">0.500 | 0.250</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Tanh(z) | Tanh'(z)</div>
          <div class="sim-result-value" id="act-tanh-val" style="color:#10b981;">0.000 | 1.000</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">ReLU(z) | ReLU'(z)</div>
          <div class="sim-result-value" id="act-relu-val" style="color:#f59e0b;">0.000 | 0.000</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">LeakyReLU (α=0.01)</div>
          <div class="sim-result-value" id="act-lrelu-val" style="color:#a78bfa;">0.000 | 0.010</div>
        </div>
      </div>
      <div class="sim-status-bar" id="act-status">
        Em z = 0, a sigmóide tem gradiente máximo (0.25). Para |z| > 4, σ'(z) converge assintoticamente para 0 (Vanishing Gradient).
      </div>
    </div>
  `;

  const calc = () => {
    const z = parseFloat(document.getElementById('act-slider-z').value);
    document.getElementById('act-z-val').textContent = (z > 0 ? '+' : '') + z.toFixed(2);

    // Sigmoid
    const sig = 1 / (1 + Math.exp(-z));
    const dSig = sig * (1 - sig);

    // Tanh
    const tanh = Math.tanh(z);
    const dTanh = 1 - tanh * tanh;

    // ReLU
    const relu = Math.max(0, z);
    const dRelu = z > 0 ? 1 : 0;

    // LeakyReLU
    const lrelu = z > 0 ? z : 0.01 * z;
    const dLrelu = z > 0 ? 1 : 0.01;

    document.getElementById('act-sig-val').textContent = `${sig.toFixed(3)} | ${dSig.toFixed(3)}`;
    document.getElementById('act-tanh-val').textContent = `${tanh.toFixed(3)} | ${dTanh.toFixed(3)}`;
    document.getElementById('act-relu-val').textContent = `${relu.toFixed(2)} | ${dRelu.toFixed(1)}`;
    document.getElementById('act-lrelu-val').textContent = `${lrelu.toFixed(2)} | ${dLrelu.toFixed(2)}`;

    const statusEl = document.getElementById('act-status');
    if (Math.abs(z) > 4) {
      statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">⚠️ ZONA DE SATURAÇÃO!</span> σ'(z) = ${dSig.toFixed(4)}. O gradiente é quase nulo e bloqueia a retropropagação (Vanishing Gradient). A ReLU evita este problema com derivada constante = 1 para z > 0.`;
    } else {
      statusEl.innerHTML = `Região linear/ativa. Gradiente ativo na sigmóide (σ' = ${dSig.toFixed(3)}) e no Tanh (Tanh' = ${dTanh.toFixed(3)}).`;
    }
  };

  document.getElementById('act-slider-z').addEventListener('input', calc);
  calc();
}

// 5. Simulator: Bayesian Inference & Base Rate Fallacy
function renderBayesianInferenceSimulator(container, concept) {
  container.innerHTML = `
    <div class="sim-card">
      <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:8px;">
        🎲 Teorema de Bayes: Priori, Verossimilhança & Falácia da Taxa Base
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Probabilidade a Priori P(H) (Prevalência):</span>
          <span id="bayes-prior-val" style="font-weight:700; color:#3b82f6;">1.0%</span>
        </div>
        <input type="range" class="sim-slider" id="bayes-slider-prior" min="0.1" max="20.0" step="0.1" value="1.0">
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Sensibilidade / Verossimilhança P(E | H):</span>
          <span id="bayes-sens-val" style="font-weight:700; color:#10b981;">95.0%</span>
        </div>
        <input type="range" class="sim-slider" id="bayes-slider-sens" min="50" max="100" step="1" value="95">
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Taxa de Falsos Positivos P(E | ¬H):</span>
          <span id="bayes-fp-val" style="font-weight:700; color:#ef4444;">5.0%</span>
        </div>
        <input type="range" class="sim-slider" id="bayes-slider-fp" min="0.5" max="20.0" step="0.5" value="5.0">
      </div>

      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Posterior P(H | E)</div>
          <div class="sim-result-value" id="bayes-post-val" style="color:#10b981; font-weight:800;">16.1%</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Evidência Total P(E)</div>
          <div class="sim-result-value" id="bayes-ev-val" style="color:#60a5fa;">5.9%</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Fator de Bayes</div>
          <div class="sim-result-value" id="bayes-bf-val" style="color:#f59e0b;">19.0x</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Probabilidade ¬H | E</div>
          <div class="sim-result-value" id="bayes-neg-val" style="color:#ef4444;">83.9%</div>
        </div>
      </div>
      <div class="sim-status-bar" id="bayes-status">
        Falácia da Taxa Base: Apesar do teste ter 95% de precisão, um resultado positivo tem apenas 16.1% de chance de ser real, pois a prevalência a priori (1.0%) é muito baixa!
      </div>
    </div>
  `;

  const calc = () => {
    const prior = parseFloat(document.getElementById('bayes-slider-prior').value) / 100;
    const sens = parseFloat(document.getElementById('bayes-slider-sens').value) / 100;
    const fp = parseFloat(document.getElementById('bayes-slider-fp').value) / 100;

    document.getElementById('bayes-prior-val').textContent = (prior * 100).toFixed(1) + '%';
    document.getElementById('bayes-sens-val').textContent = (sens * 100).toFixed(1) + '%';
    document.getElementById('bayes-fp-val').textContent = (fp * 100).toFixed(1) + '%';

    // P(E) = P(E|H)*P(H) + P(E|~H)*P(~H)
    const pE = sens * prior + fp * (1 - prior);
    const post = pE > 0 ? (sens * prior) / pE : 0;
    const bf = fp > 0 ? (sens / fp) : 999;

    document.getElementById('bayes-post-val').textContent = (post * 100).toFixed(1) + '%';
    document.getElementById('bayes-ev-val').textContent = (pE * 100).toFixed(1) + '%';
    document.getElementById('bayes-bf-val').textContent = bf.toFixed(1) + 'x';
    document.getElementById('bayes-neg-val').textContent = ((1 - post) * 100).toFixed(1) + '%';

    const statusEl = document.getElementById('bayes-status');
    statusEl.innerHTML = `<strong>Falácia da Taxa Base:</strong> Um teste com sensibilidade de ${(sens*100).toFixed(0)}% gera um resultado positivo com apenas <strong>${(post * 100).toFixed(1)}% de probabilidade real</strong> de Hipótese H ser verdadeira, demonstrando a importância crucial do Prior Bayesiano!`;
  };

  ['prior', 'sens', 'fp'].forEach(k => {
    document.getElementById(`bayes-slider-${k}`).addEventListener('input', calc);
  });
  calc();
}

// 6. Simulator: Gradient Descent Dynamics & Step-Size Stability
function renderGradientDescentSimulator(container, concept) {
  container.innerHTML = `
    <div class="sim-card">
      <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:8px;">
        📉 Otimização Convexa & Dinâmica da Descida de Gradiente
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Ponto de Partida (w₀):</span>
          <span id="gd-w0-val" style="font-weight:700; color:#3b82f6;">3.0</span>
        </div>
        <input type="range" class="sim-slider" id="gd-slider-w0" min="-5.0" max="5.0" step="0.5" value="3.0">
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Taxa de Aprendizagem (η) [Limiar Lipschitz = 1.0]:</span>
          <span id="gd-eta-val" style="font-weight:700; color:#10b981;">0.25</span>
        </div>
        <input type="range" class="sim-slider" id="gd-slider-eta" min="0.05" max="1.25" step="0.05" value="0.25">
      </div>

      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Valor Após 5 Passos (w₅)</div>
          <div class="sim-result-value" id="gd-w5-val" style="color:#10b981;">0.09</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Fator de Contração (1 - 2η)</div>
          <div class="sim-result-value" id="gd-factor-val" style="color:#38bdf8;">0.50</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Perda Residual f(w₅)</div>
          <div class="sim-result-value" id="gd-loss-val" style="color:#f59e0b;">0.009</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Regime Dinâmico</div>
          <div class="sim-result-value" id="gd-regime-val" style="color:#10b981; font-size:11px;">Monótono</div>
        </div>
      </div>
      <div class="sim-status-bar" id="gd-status">
        Objetivo f(w) = w², ∇f(w) = 2w (Constante Lipschitz L = 2). Convergência garantida para η < 1.0 (2/L).
      </div>
    </div>
  `;

  const calc = () => {
    const w0 = parseFloat(document.getElementById('gd-slider-w0').value);
    const eta = parseFloat(document.getElementById('gd-slider-eta').value);

    document.getElementById('gd-w0-val').textContent = w0.toFixed(1);
    document.getElementById('gd-eta-val').textContent = eta.toFixed(2);

    const factor = 1 - 2 * eta;
    let w = w0;
    const history = [w];
    for (let i = 0; i < 5; i++) {
      w = w - eta * (2 * w);
      history.push(w);
    }
    const loss = w * w;

    document.getElementById('gd-w5-val').textContent = Math.abs(w) > 99 ? 'Infinito' : w.toFixed(3);
    document.getElementById('gd-factor-val').textContent = factor.toFixed(2);
    document.getElementById('gd-loss-val').textContent = Math.abs(loss) > 999 ? 'Overflow' : loss.toFixed(4);

    const regimeEl = document.getElementById('gd-regime-val');
    const statusEl = document.getElementById('gd-status');

    if (eta > 1.0) {
      regimeEl.textContent = 'Divergência 💥';
      regimeEl.style.color = '#ef4444';
      statusEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">DIVERGÊNCIA CATASTRÓFICA!</span> η = ${eta.toFixed(2)} excede o limite estrito de estabilidade 2/L = 1.0. Os passos explodem (|w_t| → ∞).`;
    } else if (eta === 1.0) {
      regimeEl.textContent = 'Ciclo Limite ⚠️';
      regimeEl.style.color = '#f59e0b';
      statusEl.textContent = 'Oscilação perpétua invariante: o algoritmo salta infinitamente entre +w₀ e -w₀ sem convergir.';
    } else if (eta > 0.5) {
      regimeEl.textContent = 'Oscilação Amortecida';
      regimeEl.style.color = '#f59e0b';
      statusEl.textContent = 'Convergência oscilatória: o passo cruza o mínimo global mas contrai a cada iteração.';
    } else {
      regimeEl.textContent = 'Monótono Estável ✅';
      regimeEl.style.color = '#10b981';
      statusEl.textContent = 'Convergência monótona e estável em direção ao ótimo global w* = 0.';
    }
  };

  document.getElementById('gd-slider-w0').addEventListener('input', calc);
  document.getElementById('gd-slider-eta').addEventListener('input', calc);
  calc();
}

// 7. Simulator: SVM Maximum Margin & Regularization C
function renderSvmMarginSimulator(container, concept) {
  container.innerHTML = `
    <div class="sim-card">
      <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:8px;">
        🛡️ Hiperplano de Margem Máxima & Regularização C
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Largura da Margem Geométrica (γ = 2 / ||w||):</span>
          <span id="svm-gamma-val" style="font-weight:700; color:#3b82f6;">1.00</span>
        </div>
        <input type="range" class="sim-slider" id="svm-slider-gamma" min="0.2" max="3.0" step="0.1" value="1.0">
      </div>
      <div class="sim-slider-group">
        <div class="sim-slider-label">
          <span>Constante de Penalidade de Violações (C):</span>
          <span id="svm-c-val" style="font-weight:700; color:#10b981;">1.0</span>
        </div>
        <input type="range" class="sim-slider" id="svm-slider-c" min="0.1" max="10.0" step="0.5" value="1.0">
      </div>

      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Norma dos Pesos ||w||</div>
          <div class="sim-result-value" id="svm-w-val" style="color:#38bdf8;">2.000</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Regularizador 1/2||w||²</div>
          <div class="sim-result-value" id="svm-reg-val" style="color:#a78bfa;">2.000</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Sensibilidade a Outliers</div>
          <div class="sim-result-value" id="svm-sens-val" style="color:#f59e0b;">Moderada</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Tipo de Margem</div>
          <div class="sim-result-value" id="svm-type-val" style="color:#10b981; font-size:11px;">Soft Margin</div>
        </div>
      </div>
      <div class="sim-status-bar" id="svm-status">
        Trade-off clássico: Maximizar a margem geométrica 2/||w|| reduz a Dimensão VC e o sobreajuste; o termo C pondera a tolerância a violações de suporte slack ξ.
      </div>
    </div>
  `;

  const calc = () => {
    const gamma = parseFloat(document.getElementById('svm-slider-gamma').value);
    const c = parseFloat(document.getElementById('svm-slider-c').value);

    document.getElementById('svm-gamma-val').textContent = gamma.toFixed(2);
    document.getElementById('svm-c-val').textContent = c.toFixed(1);

    const normW = 2 / gamma;
    const regTerm = 0.5 * normW * normW;

    document.getElementById('svm-w-val').textContent = normW.toFixed(3);
    document.getElementById('svm-reg-val').textContent = regTerm.toFixed(3);

    const sensEl = document.getElementById('svm-sens-val');
    const typeEl = document.getElementById('svm-type-val');
    if (c >= 5.0) {
      sensEl.textContent = 'Muito Alta (Rígida)';
      sensEl.style.color = '#ef4444';
      typeEl.textContent = 'Quase Hard Margin';
    } else if (c <= 0.5) {
      sensEl.textContent = 'Muito Baixa (Tolerante)';
      sensEl.style.color = '#10b981';
      typeEl.textContent = 'Soft Margin Ampla';
    } else {
      sensEl.textContent = 'Moderada';
      sensEl.style.color = '#f59e0b';
      typeEl.textContent = 'Soft Margin Equilibrada';
    }
  };

  document.getElementById('svm-slider-gamma').addEventListener('input', calc);
  document.getElementById('svm-slider-c').addEventListener('input', calc);
  calc();
}

// 8. Fallback for Formal/Theoretical Concepts
function renderTheoreticalConceptFallback(container, concept) {
  const depsCount = (concept.dependencies || []).length;
  const depsLabels = (concept.dependencies || []).map(id => conceptMap.get(id)?.label || id).slice(0, 3).join(', ');
  
  container.innerHTML = `
    <div class="sim-card" style="border-left: 3px solid #8b5cf6;">
      <div style="font-weight:600; font-size:13px; color:#a78bfa; margin-bottom:8px;">
        🔬 Princípio Axiomático & Estrutural
      </div>
      <p style="font-size:12px; color:#cbd5e1; line-height:1.6; margin-bottom:12px;">
        Este nó representa uma fundação matemática, algoritmo terminal ou axioma primitivo da árvore formal. A sua validação computacional pode ser executada diretamente através do script Python na aba <strong>"Código"</strong> ou analisada na aba <strong>"Trilha"</strong>.
      </p>
      <div class="sim-results-grid">
        <div class="sim-result-box">
          <div class="sim-result-title">Grau de Pré-requisitos</div>
          <div class="sim-result-value" style="color:#60a5fa;">${depsCount} direto(s)</div>
        </div>
        <div class="sim-result-box">
          <div class="sim-result-title">Nível Topológico DAG</div>
          <div class="sim-result-value" style="color:#10b981;">Nível ${concept.level}</div>
        </div>
      </div>
      <div class="sim-status-bar" style="margin-top:10px;">
        ${depsCount > 0 ? `Fundamentado em: <em>${depsLabels}${depsCount > 3 ? '...' : ''}</em>.` : 'Axioma primitivo sem pré-requisitos anteriores (Raiz do Grafo).'}
      </div>
    </div>
  `;
}

// ============================================================================
// Step-by-Step Study Roadmap & Mastery Tracker (Kahn's Topological Sort)
// ============================================================================

function renderRoadmap(concept) {
  const container = document.getElementById('study-roadmap-steps');
  if (!container) return;

  // Retrieve strictly verified Kahn topological sequence from axioms to current node
  const chainIds = concept.ancestral_chain || [concept.id];
  const lineage = chainIds.map(id => conceptMap.get(id)).filter(Boolean);

  // Load mastered state from localStorage
  const masteredKey = 'synapsis_mastered_nodes';
  let masteredSet = new Set();
  try {
    const saved = localStorage.getItem(masteredKey);
    if (saved) masteredSet = new Set(JSON.parse(saved));
  } catch (e) {}

  const totalSteps = lineage.length;
  let masteredCount = 0;
  lineage.forEach(node => {
    if (masteredSet.has(node.id)) masteredCount++;
  });

  const percentage = totalSteps > 0 ? Math.round((masteredCount / totalSteps) * 100) : 0;
  const pctEl = document.getElementById('mastery-percentage');
  const barEl = document.getElementById('mastery-bar-fill');
  if (pctEl) pctEl.textContent = `${percentage}% (${masteredCount}/${totalSteps})`;
  if (barEl) barEl.style.width = `${percentage}%`;

  container.innerHTML = lineage.map((node, idx) => {
    const isCurrent = node.id === concept.id;
    const isMastered = masteredSet.has(node.id);
    const meta = CATEGORY_META[node.category] || { name: 'Geral', color: '#3b82f6' };

    return `
      <div class="roadmap-step-card ${isCurrent ? 'active-step' : ''} ${isMastered ? 'completed' : ''}" data-id="${node.id}">
        <input type="checkbox" class="roadmap-checkbox" data-id="${node.id}" ${isMastered ? 'checked' : ''} onclick="event.stopPropagation();">
        <div class="roadmap-step-info" onclick="selectConcept('${node.id}')">
          <div class="roadmap-step-title">
            Passo ${idx + 1}: ${node.label} ${isCurrent ? '⭐' : ''}
          </div>
          <div class="roadmap-step-meta" style="color:${meta.color};">
            ${meta.name} • Nível Topológico ${node.level}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach individual checkbox listeners
  container.querySelectorAll('.roadmap-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        masteredSet.add(id);
      } else {
        masteredSet.delete(id);
      }
      try {
        localStorage.setItem(masteredKey, JSON.stringify(Array.from(masteredSet)));
      } catch (err) {}
      renderRoadmap(concept);
    });
  });

  // Attach roadmap action buttons
  const btnMarkAll = document.getElementById('btn-mark-all-roadmap');
  const btnReset = document.getElementById('btn-reset-roadmap');
  const btnExport = document.getElementById('btn-export-roadmap');

  if (btnMarkAll) {
    btnMarkAll.onclick = () => {
      chainIds.forEach(id => masteredSet.add(id));
      try {
        localStorage.setItem(masteredKey, JSON.stringify(Array.from(masteredSet)));
      } catch (err) {}
      renderRoadmap(concept);
      showToast('✅ Todos os pré-requisitos desta trilha foram marcados!');
    };
  }

  if (btnReset) {
    btnReset.onclick = () => {
      chainIds.forEach(id => masteredSet.delete(id));
      try {
        localStorage.setItem(masteredKey, JSON.stringify(Array.from(masteredSet)));
      } catch (err) {}
      renderRoadmap(concept);
      showToast('🔄 Marcações desta trilha reiniciadas.');
    };
  }

  if (btnExport) {
    btnExport.onclick = () => {
      const exportData = {
        app: "Synapsis 3.0",
        target_concept: { id: concept.id, label: concept.label },
        exported_at: new Date().toISOString(),
        mastered_nodes_total: masteredSet.size,
        current_roadmap: {
          total_steps: chainIds.length,
          completed_steps: chainIds.filter(id => masteredSet.has(id)).length,
          percentage: percentage,
          nodes: chainIds.map(id => ({
            id,
            label: conceptMap.get(id)?.label || id,
            mastered: masteredSet.has(id)
          }))
        }
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synapsis_progresso_${concept.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('💾 Progresso de estudo exportado com sucesso!');
    };
  }
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = 'tab-' + btn.dataset.tab;
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  });

  document.getElementById('close-inspector-btn')?.addEventListener('click', () => {
    document.getElementById('inspector-panel').classList.add('collapsed');
  });
}

function initCanvasControls() {
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    const scale = network.getScale();
    network.moveTo({ scale: scale * 1.3, animation: { duration: 200 } });
  });

  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    const scale = network.getScale();
    network.moveTo({ scale: scale * 0.75, animation: { duration: 200 } });
  });

  document.getElementById('btn-fit-view')?.addEventListener('click', () => {
    network.fit({ animation: { duration: 350 } });
  });

  document.getElementById('btn-trace-foundations')?.addEventListener('click', () => {
    if (!activeConceptId) return;
    const tabLineageBtn = document.querySelector('.tab-btn[data-tab="lineage"]');
    if (tabLineageBtn) tabLineageBtn.click();
    document.getElementById('inspector-panel').classList.remove('collapsed');
  });

  document.getElementById('btn-toggle-inspector')?.addEventListener('click', () => {
    const panel = document.getElementById('inspector-panel');
    if (panel) {
      panel.classList.toggle('collapsed');
      if (network) {
        setTimeout(() => network.redraw(), 100);
      }
    }
  });

  document.getElementById('btn-open-legend')?.addEventListener('click', () => {
    const modal = document.getElementById('legend-modal');
    if (modal) modal.classList.add('open');
  });

  // Header controls initialized
}

function initLegendModal() {
  const modal = document.getElementById('legend-modal');
  const btnOpen = document.getElementById('btn-open-legend');
  const btnClose = document.getElementById('close-legend-btn');
  if (!modal) return;

  const openModal = () => {
    modal.classList.add('active');
    modal.classList.add('open');
    btnClose?.focus();
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.classList.remove('open');
    btnOpen?.focus();
  };

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (modal.classList.contains('active') || modal.classList.contains('open'))) {
      closeModal();
    }
  });
}

function initDeepLinking() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && conceptMap.has(hash) && hash !== activeConceptId) {
      const c = conceptMap.get(hash);
      if (currentDomain !== 'all' && currentDomain !== c.domain) {
        applyDomainFilter(c.domain || 'academic_ml');
      }
      selectConcept(hash);
    }
  });
}

// 1-Click AI Export & Socratic Prompts Feature
function initAiExportButton() {
  const btn = document.getElementById('btn-copy-for-ai');
  const btnSocratic = document.getElementById('btn-copy-socratic');

  if (btn) {
    btn.addEventListener('click', () => {
      if (!activeConceptId) return;
      const c = conceptMap.get(activeConceptId);
      if (!c) return;

      const chain = (c.ancestral_chain || [c.id]).map(id => conceptMap.get(id)?.label || id);
      const dependents = (c.dependents || []).map(id => conceptMap.get(id)?.label || id);
      const codeLang = c.code_language || 'python';

      const promptText = `### Contexto Extraído do Synapsis (Estudo Autónomo de IA & Machine Learning)\n` +
        `**Conceito**: ${c.label} (ID: \`${c.id}\`, Nível Topológico: ${c.level}, Domínio: ${c.domain})\n` +
        `**Resumo**: ${c.summary}\n` +
        `**Definição Formal**: ${c.definition}\n` +
        (c.formula ? `**Fórmula Matemática**: $${c.formula}$\n` : '') +
        (c.references ? `**Referências / Bibliografia**: ${c.references}\n` : '') +
        `**Trilha de Estudo (Ordenação Topológica Kahn)**: ${chain.join(' -> ')}\n` +
        `**Conceitos Derivados (Que dependem deste)**: ${dependents.join(', ') || 'Nenhum (Nó Terminal)'}\n` +
        (c.code ? `\n**Implementação (${codeLang})**:\n\`\`\`${codeLang}\n${c.code}\n\`\`\`\n` : '') +
        `\n---\n*Pergunta ao Assistente*: Ajuda-me a dominar este conceito explicando a sua intuição matemática e algorítmica profunda e apresentando um problema prático resolvido passo a passo.`;

      navigator.clipboard.writeText(promptText).then(() => {
        showToast('📋 Contexto completo copiado! Cola no ChatGPT, Claude ou Gemini.');
      }).catch(() => {
        showToast('Erro ao copiar. Permissão negada.');
      });
    });
  }

  if (btnSocratic) {
    btnSocratic.addEventListener('click', () => {
      if (!activeConceptId) return;
      const c = conceptMap.get(activeConceptId);
      if (!c) return;

      const depsLabels = (c.dependencies || []).map(id => {
        const dep = conceptMap.get(id);
        return dep ? dep.label : id;
      }).join(', ') || 'Axiomas Fundamentais';

      const socraticPrompt = `Olá! Estou a aprofundar os meus estudos em Inteligência Artificial e Machine Learning de forma autónoma e independente.\n\n` +
        `Quero que assumas a postura de um Tutor Especialista em IA e Aprendizagem Computacional e me guies socraticamente para dominar este conceito:\n` +
        `🎯 CONCEITO ALVO: "${c.label}"\n` +
        `📐 PRÉ-REQUISITOS RELEVANTES: ${depsLabels}\n` +
        `📖 DEFINIÇÃO BASE: ${c.definition}\n` +
        (c.formula ? `🔢 FORMULAÇÃO MATEMÁTICA: $${c.formula}$\n\n` : '\n') +
        `Instruções para a tutoria socrática:\n` +
        `1. Faz-me UMA pergunta analítica de cada vez para testar a minha intuição matemática profunda e limites do algoritmo.\n` +
        `2. Não me dês a resposta direta: se eu errar ou a resposta for incompleta, faz-me contra-perguntas que me façam ver a falha.\n` +
        `3. Inclui cenários práticos de fronteira (ex: dados ruidosos, alta dimensionalidade, classes desbalanceadas ou complexidade assintótica).\n\n` +
        `Por favor, apresenta a tua primeira pergunta conceptual!`;

      navigator.clipboard.writeText(socraticPrompt).then(() => {
        showToast('🧠 Prompt Socrático copiado! Cole no ChatGPT, Claude ou Gemini.');
      }).catch(() => {
        showToast('Erro ao copiar. Permissão negada.');
      });
    });
  }
}

function showToast(message) {
  let toast = document.getElementById('synapsis-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'synapsis-toast';
    toast.className = 'synapsis-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
