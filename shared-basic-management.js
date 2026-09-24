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
  const routes = { 运营商管理: 'operator-management.html' };

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
