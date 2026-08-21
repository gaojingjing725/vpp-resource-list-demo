(function () {
  function updateShadows(wrap) {
    const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    wrap.classList.toggle('no-left-shadow', max === 0 || wrap.scrollLeft <= 1);
    wrap.classList.toggle('no-right-shadow', max === 0 || wrap.scrollLeft >= max - 1);
  }
  function bind(wrap) {
    if (wrap.dataset.sharedShadowBound) return;
    wrap.dataset.sharedShadowBound = 'true';
    wrap.addEventListener('scroll', () => updateShadows(wrap), { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(() => updateShadows(wrap)).observe(wrap);
    updateShadows(wrap);
  }
  function init() { document.querySelectorAll('.table-wrap,.table-scroll').forEach(bind); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  window.addEventListener('resize', init);
})();
