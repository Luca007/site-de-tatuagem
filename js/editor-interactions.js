export function createInteractionController({
  registry,
  selection,
  getLayoutState,
  isEditing,
  getEditingBlockId,
  closeBlockEditor,
  scheduleAutoSave,
  showToast,
  toNumber
}) {
  function canEdit() {
    return Boolean(isEditing());
  }

  function bindSelectionHandles(node) {
    node.addEventListener('pointerdown', handleBlockPointerDown);
  }

  function handleBlockPointerDown(event) {
    if (!canEdit() || (event.button && event.button !== 0)) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.block-delete')) return;
    const node = event.currentTarget;
    if (!(node instanceof HTMLElement)) return;
    const blockId = node.dataset.blockId;
    if (!blockId) return;
    const additive = isAdditiveSelectionEvent(event);
    if (!additive && selection.size > 1 && selection.has(blockId)) {
      return;
    }
    updateSelection(blockId, additive);
  }

  function isAdditiveSelectionEvent(event) {
    return Boolean(event.ctrlKey || event.metaKey);
  }

  function deleteBlock(blockId, options = {}) {
    if (!canEdit()) return;
    const { skipConfirm = false } = options;
    if (!skipConfirm) {
      const confirmed = window.confirm(
        'Tem certeza de que deseja remover este bloco? Esta ação não pode ser desfeita.'
      );
      if (!confirmed) return;
    }
    const layout = getLayoutState();
    if (!layout?.blocks?.length) return;
    const index = layout.blocks.findIndex((block) => block.id === blockId);
    if (index === -1) return;
    layout.blocks.splice(index, 1);
    removeBlockNode(blockId);
    if (getEditingBlockId() === blockId) {
      closeBlockEditor();
    }
    selection.delete(blockId);
    applySelectionStyles();
    scheduleAutoSave();
    showToast('Bloco removido do layout.', 'info');
  }

  function removeBlockNode(blockId) {
    const entry = registry.get(blockId);
    if (entry?.node?.parentElement) {
      entry.node.parentElement.removeChild(entry.node);
    }
    registry.delete(blockId);
  }

  function updateSelection(blockId, additive = false) {
    if (!canEdit() || !blockId) return;
    if (!additive) {
      selection.clear();
      selection.add(blockId);
    } else if (selection.has(blockId)) {
      selection.delete(blockId);
    } else {
      selection.add(blockId);
    }
    applySelectionStyles();
  }

  function applySelectionStyles() {
    registry.forEach(({ node }, id) => {
      const isSelected = canEdit() && selection.has(id);
      node.classList.toggle('is-selected', Boolean(isSelected));
    });
  }

  function clearSelection() {
    selection.clear();
    registry.forEach(({ node }) => node.classList.remove('is-selected'));
  }

  function pruneSelection() {
    if (!selection.size) return;
    const layout = getLayoutState();
    if (!layout?.blocks) return;
    const validIds = new Set(layout.blocks.map((block) => block.id));
    selection.forEach((id) => {
      if (!validIds.has(id)) {
        selection.delete(id);
      }
    });
  }

  function resolveDragNodes(node) {
    if (selection.size > 1 && selection.has(node.dataset.blockId || '')) {
      const nodes = getSelectedNodes();
      if (nodes.length) return nodes;
    }
    return [node];
  }

  function getSelectedNodes() {
    if (!selection.size) return [];
    const nodes = [];
    selection.forEach((id) => {
      const entry = registry.get(id);
      if (entry?.node) nodes.push(entry.node);
    });
    return nodes;
  }

  function createDragState(node) {
    if (!(node instanceof HTMLElement)) return null;
    ensureSelectionForDrag(node);
    const targets = resolveDragNodes(node);
    if (!targets.length) return null;
    const entries = targets.map((target) => ({
      node: target,
      startX: toNumber(target.style.left, target.offsetLeft || 0),
      startY: toNumber(target.style.top, target.offsetTop || 0)
    }));
    entries.forEach(({ node: target }) => target.classList.add('dragging'));
    return {
      entries,
      deltaX: 0,
      deltaY: 0
    };
  }

  function updateDragTransforms(state, dx, dy) {
    if (!state) return;
    state.deltaX += dx;
    state.deltaY += dy;
    state.entries.forEach(({ node }) => {
      node.style.transform = `translate(${state.deltaX}px, ${state.deltaY}px)`;
    });
  }

  function commitDragState(state) {
    if (!state) return;
    state.entries.forEach(({ node, startX, startY }) => {
      node.style.left = `${Math.round(startX + state.deltaX)}px`;
      node.style.top = `${Math.round(startY + state.deltaY)}px`;
      node.style.transform = 'translate(0, 0)';
      node.classList.remove('dragging');
    });
  }

  function ensureSelectionForDrag(node) {
    if (!canEdit()) return;
    const blockId = node.dataset.blockId;
    if (!blockId) return;
    if (!selection.size || !selection.has(blockId)) {
      updateSelection(blockId, false);
    }
  }

  function handleCanvasPointerDown(event) {
    if (!canEdit()) return;
    const target = event.target;
    if (target instanceof Element && target.closest('.block')) return;
    clearSelection();
  }

  return {
    bindSelectionHandles,
    deleteBlock,
    updateSelection,
    applySelectionStyles,
    clearSelection,
    pruneSelection,
    createDragState,
    updateDragTransforms,
    commitDragState,
    ensureSelectionForDrag,
    handleCanvasPointerDown
  };
}
