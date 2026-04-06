/**
 * app.js — entry point
 */
window.addEventListener('DOMContentLoaded', async () => {
  const nodes = await loadData();
  bindUI();
  mapInit(nodes);
  updateNodeCount();
  window.addEventListener('resize', mapFitView);
});
