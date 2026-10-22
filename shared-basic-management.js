(function () {
  const items = [
    '运营商管理',
    '客户管理',
    '设备管理',
    '合同管理',
    { label: '量测管理', children: ['模拟量管理', '状态量管理', '控制参数管理', '电度参数管理'] },
    { label: '量测配置', children: ['资源类型', '量测类型', '数据类型', '设备类型', '电压等级类型', '行业管理'] }
  ];
  const activeSecondary = document.body.dataset.activeBasicSecondary || '';
  const routes = { 运营商管理: 'operator-management.html', 客户管理: 'customer-management.html' };

  document.querySelectorAll('.header-nav-item').forEach(item => {
    const label = Array.from(item.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!label || label.textContent.trim() !== '基础管理' || item.querySelector('.header-submenu')) return;

    item.classList.add('header-nav-dropdown', 'nav-dropdown');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-expanded', 'false');

    const submenu = document.createElement('div');
    submenu.className = 'header-submenu nav-submenu';
    items.forEach(entry => {
      const name = typeof entry === 'string' ? entry : entry.label;
      const option = document.createElement('div');
      option.className = 'header-submenu-item nav-subitem';
      option.setAttribute('role', 'menuitem');
      option.setAttribute('tabindex', '-1');
      option.textContent = name;
      if (name === activeSecondary) option.classList.add('active');
      if (routes[name]) {
        option.setAttribute('role', 'link');
        option.setAttribute('tabindex', '0');
        option.addEventListener('click', event => {
          event.stopPropagation();
          window.location.href = routes[name];
        });
        option.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          event.stopPropagation();
          window.location.href = routes[name];
        });
      }
      if (typeof entry !== 'string') {
        option.classList.add('has-submenu');
        option.setAttribute('aria-haspopup', 'true');
        option.setAttribute('aria-expanded', 'false');
        const nestedMenu = document.createElement('div');
        nestedMenu.className = 'header-submenu nav-submenu nested-submenu';
        entry.children.forEach(childName => {
          const child = document.createElement('div');
          child.className = 'header-submenu-item nav-subitem';
          child.setAttribute('role', 'menuitem');
          child.setAttribute('tabindex', '-1');
          child.textContent = childName;
          nestedMenu.appendChild(child);
        });
        option.appendChild(nestedMenu);
        option.addEventListener('mouseenter', () => option.setAttribute('aria-expanded', 'true'));
        option.addEventListener('mouseleave', () => option.setAttribute('aria-expanded', 'false'));
        option.addEventListener('focusin', () => option.setAttribute('aria-expanded', 'true'));
        option.addEventListener('focusout', event => {
          if (!option.contains(event.relatedTarget)) option.setAttribute('aria-expanded', 'false');
        });
      }
      submenu.appendChild(option);
    });
    item.appendChild(submenu);
    item.addEventListener('focusin', () => item.setAttribute('aria-expanded', 'true'));
    item.addEventListener('focusout', event => {
      if (!item.contains(event.relatedTarget)) item.setAttribute('aria-expanded', 'false');
    });
    item.addEventListener('mouseenter', () => item.setAttribute('aria-expanded', 'true'));
    item.addEventListener('mouseleave', () => item.setAttribute('aria-expanded', 'false'));
  });

  document.addEventListener('click', event => {
    if (event.target.closest('.header-submenu-item')) return;
    document.querySelectorAll('.header-nav-dropdown.open, .nav-dropdown.open').forEach(item => {
      item.classList.remove('open');
      item.setAttribute('aria-expanded', 'false');
    });
  });
})();

(function () {
  if (!document.body) return;

  const tooltipId = 'shared-table-tooltip';
  const tooltip = document.getElementById(tooltipId) || document.createElement('div');
  if (!tooltip.id) {
    tooltip.id = tooltipId;
    tooltip.className = 'table-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
  }

  let activeTarget = null;
  let activeCell = null;

  function isTableCell(cell) {
    return cell && cell.matches('td') && cell.closest('.table-card, .table-container');
  }

  function isExcludedCell(cell) {
    return cell.matches('.col-fixed-right, .col-fixed-ops, .empty-cell, .operator-empty, .customer-empty')
      || cell.querySelector('.action-link, .action-links, .action-separator, .checkbox, .status-switch, .link-group');
  }

  function getMeasureTarget(cell) {
    return cell.querySelector('.cell-text, .td-text-ellipsis') || cell;
  }

  function getCellText(cell, measureTarget) {
    const title = cell.getAttribute('title');
    const text = title || measureTarget.textContent || '';
    return text.trim();
  }

  function isTruncated(cell, measureTarget) {
    return [measureTarget, cell].some(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1);
  }

  function prepareCell(cell) {
    if (!isTableCell(cell) || isExcludedCell(cell)) return;
    const measureTarget = getMeasureTarget(cell);
    const text = getCellText(cell, measureTarget);
    if (!text) return;

    cell.dataset.tableTooltipText = text;
    cell.removeAttribute('title');
    measureTarget.removeAttribute('title');

    if (isTruncated(cell, measureTarget)) {
      const focusTarget = measureTarget;
      if (!focusTarget.hasAttribute('tabindex')) {
        focusTarget.setAttribute('tabindex', '0');
        focusTarget.dataset.tableTooltipTabindex = 'added';
      }
    } else if (measureTarget.dataset.tableTooltipTabindex === 'added') {
      measureTarget.removeAttribute('tabindex');
      delete measureTarget.dataset.tableTooltipTabindex;
    }
  }

  function refreshCells() {
    document.querySelectorAll('.table-card td, .table-container td').forEach(prepareCell);
  }

  function resolveTarget(cell) {
    if (!isTableCell(cell) || isExcludedCell(cell)) return null;
    const measureTarget = getMeasureTarget(cell);
    const text = cell.dataset.tableTooltipText || getCellText(cell, measureTarget);
    if (!text || !isTruncated(cell, measureTarget)) return null;
    return { cell, target: measureTarget, text };
  }

  function positionTooltip(target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const gap = 8;
    let left = targetRect.left;
    let top = targetRect.top - tooltipRect.height - gap;
    const below = top < 8;
    if (below) top = targetRect.bottom + gap;
    tooltip.classList.toggle('below', below);
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
    const arrowLeft = Math.max(14, Math.min(targetRect.left + targetRect.width / 2 - left - 4, tooltipRect.width - 14));
    tooltip.style.setProperty('--tooltip-arrow-left', `${arrowLeft}px`);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (!activeTarget) return;
    if (activeTarget.dataset.tableTooltipAria === '') activeTarget.removeAttribute('aria-describedby');
    else if (activeTarget.dataset.tableTooltipAria) activeTarget.setAttribute('aria-describedby', activeTarget.dataset.tableTooltipAria);
    delete activeTarget.dataset.tableTooltipAria;
    activeTarget = null;
    activeCell = null;
    tooltip.classList.remove('show');
    tooltip.hidden = true;
  }

  function showTooltip(info) {
    if (activeTarget !== info.target) hideTooltip();
    activeTarget = info.target;
    activeCell = info.cell;
    if (!Object.prototype.hasOwnProperty.call(activeTarget.dataset, 'tableTooltipAria')) {
      activeTarget.dataset.tableTooltipAria = activeTarget.getAttribute('aria-describedby') || '';
    }
    tooltip.textContent = info.text;
    tooltip.hidden = false;
    tooltip.classList.add('show');
    activeTarget.setAttribute('aria-describedby', tooltipId);
    positionTooltip(activeTarget);
  }

  function cellFromEvent(event) {
    return event.target instanceof Element ? event.target.closest('td') : null;
  }

  document.addEventListener('pointerover', event => {
    const cell = cellFromEvent(event);
    if (!cell || (event.relatedTarget instanceof Node && cell.contains(event.relatedTarget))) return;
    const info = resolveTarget(cell);
    if (info) showTooltip(info);
    else if (activeCell === cell) hideTooltip();
  });

  document.addEventListener('pointerout', event => {
    const cell = cellFromEvent(event);
    if (cell && activeCell === cell && !(event.relatedTarget instanceof Node && cell.contains(event.relatedTarget))) hideTooltip();
  });

  document.addEventListener('focusin', event => {
    const cell = cellFromEvent(event);
    const info = resolveTarget(cell);
    if (info) showTooltip(info);
  });

  document.addEventListener('focusout', event => {
    const cell = cellFromEvent(event);
    if (cell && activeCell === cell && !(event.relatedTarget instanceof Node && cell.contains(event.relatedTarget))) hideTooltip();
  });

  window.addEventListener('resize', () => {
    refreshCells();
    if (activeTarget) positionTooltip(activeTarget);
  });
  document.addEventListener('scroll', () => { if (activeTarget) positionTooltip(activeTarget); }, true);

  let refreshQueued = false;
  const queueRefresh = () => {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      refreshCells();
    });
  };
  new MutationObserver(queueRefresh).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'class', 'style'] });
  queueRefresh();
})();
