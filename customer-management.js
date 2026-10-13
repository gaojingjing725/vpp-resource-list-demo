(() => {
  const $ = id => document.getElementById(id);
  document.querySelectorAll('i').forEach(icon => icon.setAttribute('aria-hidden', 'true'));
  const storageKey = 'vpp-customer-management-v1';
  const operatorNames = [
    '国网江苏综合能源服务有限公司', '华东电力运营有限公司', '南方电网综合能源有限公司',
    '浙江清洁能源运营有限公司', '安徽省综合能源服务有限公司', '山东能源数字运营有限公司',
    '苏州工业园区能源运营中心', '杭州城市能源管理有限公司', '南京江北新区能源服务中心',
    '无锡新吴区综合能源有限公司', '宁波北仑能源运营有限公司', '嘉兴秀洲智慧能源服务中心'
  ];
  const industries = ['制造业', '商业', '建筑业', '交通运输业', '信息技术服务业', '公共事业', '农业'];
  const voltages = ['0.4kV', '6kV', '10kV', '20kV', '35kV', '110kV', '220kV'];
  const columns = [
    ['用户名称', 'name'], ['用户户号', 'account'], ['所属运营商', 'operator'],
    ['所属电力客户名称', 'powerCustomer'], ['行业类型', 'industry'], ['资源数量（个）', 'resources'],
    ['聚合容量（kW）', 'capacity'], ['可调容量（kW）', 'adjustable'], ['电压等级', 'voltage'], ['更新时间', 'updated']
  ];
  const normalizeUpdated = value => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  const seeds = [
    ['苏州华能精密制造有限公司', '032010000128', 0, '苏州华能工业园', '制造业', 18, 2860, 1420, '10kV'],
    ['南京金陵商业广场有限公司', '032010000256', 0, '金陵商业广场', '商业', 12, 1680, 820, '10kV'],
    ['上海浦东数据中心有限公司', '031010000368', 1, '浦东数字产业园', '信息技术服务业', 24, 6240, 3280, '35kV'],
    ['广州南沙智慧物流有限公司', '044010000482', 2, '南沙物流园', '交通运输业', 9, 1240, 620, '10kV'],
    ['杭州钱塘新能源科技有限公司', '033010000516', 3, '钱塘新能源产业园', '制造业', 16, 2480, 1260, '20kV'],
    ['合肥高新电子科技有限公司', '034010000624', 4, '合肥高新科技园', '制造业', 14, 2160, 1080, '10kV'],
    ['济南泉城公共服务有限公司', '037010000735', 5, '泉城公共服务中心', '公共事业', 8, 960, 480, '10kV'],
    ['苏州园区智能装备有限公司', '032050000846', 6, '苏州智能装备产业园', '制造业', 22, 3860, 1940, '35kV'],
    ['杭州西湖文旅运营有限公司', '033010000952', 7, '西湖文旅服务中心', '商业', 6, 740, 360, '0.4kV'],
    ['南京江北绿色建筑有限公司', '032010001064', 8, '江北绿色建筑园', '建筑业', 11, 1560, 780, '10kV'],
    ['无锡新吴半导体有限公司', '032020001176', 9, '新吴半导体产业园', '制造业', 28, 8420, 4260, '110kV'],
    ['宁波北仑港口物流有限公司', '033020001288', 10, '北仑港口物流园', '交通运输业', 15, 2940, 1480, '35kV']
  ];
  let customers = seeds.map((row, index) => ({
    id: `customer-${index + 1}`, name: row[0], account: row[1], operator: operatorNames[row[2]],
    powerCustomer: row[3], industry: row[4], resources: row[5], capacity: row[6], adjustable: row[7],
    voltage: row[8], updated: `2026-09-${String(29 - index).padStart(2, '0')} 14:32:00`
  }));
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved) && saved.every(row => row && row.id && columns.every(([, key]) => key in row))) {
      customers = saved.map(row => ({ ...row, updated: normalizeUpdated(row.updated) }));
    }
  } catch (e) {}

  let currentPage = 1, pageSize = 10, sortDirection = '', editingId = null, activeModal = null, lastModalTrigger = null, toastTimer;
  let appliedFilters = { account: '', name: '', operator: '' };
  let pendingDeleteIds = [];
  const selectedIds = new Set();
  const selects = new Map();
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const newId = () => globalThis.crypto?.randomUUID?.() || `customer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = () => {
    const date = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  function showToast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3000);
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(customers)); return true; }
    catch (e) { return false; }
  }
  function feedback(message) { showToast(persist() ? message : `${message}，浏览器存储不可用，刷新后将不会保留`); }
  function filteredRows() {
    const rows = customers.filter(row => row.account.includes(appliedFilters.account) && row.name.includes(appliedFilters.name) && (!appliedFilters.operator || row.operator === appliedFilters.operator));
    if (sortDirection) rows.sort((a, b) => a.updated.localeCompare(b.updated) * (sortDirection === 'asc' ? 1 : -1));
    return rows;
  }
  function applyFilters() {
    appliedFilters = { account: $('accountSearch').value.trim(), name: $('customerSearch').value.trim(), operator: selects.get('operatorSelect').value };
    currentPage = 1;
    selectedIds.clear();
    closeSelects();
    renderTable();
  }
  function pageRows() { return filteredRows().slice((currentPage - 1) * pageSize, currentPage * pageSize); }
  function textCell(value, className = '') { return `<td class="${className}" title="${escapeHtml(value)}"><span class="cell-text">${escapeHtml(value)}</span></td>`; }
  function renderTable() {
    const rows = filteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    $('customerRows').innerHTML = visibleRows.length ? visibleRows.map(row => {
      const id = escapeHtml(row.id);
      return `<tr class="${selectedIds.has(row.id) ? 'selected' : ''}">
        <td class="col-fixed-left col-fixed-checkbox"><div class="checkbox ${selectedIds.has(row.id) ? 'checked' : ''}" role="checkbox" tabindex="0" aria-checked="${selectedIds.has(row.id)}" aria-label="选择 ${escapeHtml(row.name)}" data-select-id="${id}"></div></td>
        ${textCell(row.name, 'col-fixed-name col-last-left-fixed')}${textCell(row.account)}${textCell(row.operator)}${textCell(row.powerCustomer)}${textCell(row.industry)}
        ${textCell(row.resources.toLocaleString('zh-CN'), 'num')}${textCell(row.capacity.toLocaleString('zh-CN'), 'num')}${textCell(row.adjustable.toLocaleString('zh-CN'), 'num')}
        ${textCell(row.voltage)}${textCell(row.updated)}<td class="col-fixed-right col-first-right-fixed"><button class="action-link" type="button" data-edit-id="${id}">编辑</button></td></tr>`;
    }).join('') : '<tr><td class="customer-empty" colspan="12">暂无匹配的客户数据</td></tr>';
    $('totalRecords').textContent = `共 ${rows.length} 条记录`;
    $('jumpInput').value = currentPage;
    updateSelection(visibleRows);
    renderPages(totalPages);
  }
  function updateSelection(rows = pageRows()) {
    const all = rows.length > 0 && rows.every(row => selectedIds.has(row.id));
    const some = rows.some(row => selectedIds.has(row.id));
    $('headerCheckbox').classList.toggle('checked', all);
    $('headerCheckbox').classList.toggle('indeterminate', !all && some);
    $('headerCheckbox').setAttribute('aria-checked', all ? 'true' : some ? 'mixed' : 'false');
    $('deleteButton').disabled = !selectedIds.size;
  }
  function toggleRow(id) {
    selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
    const checkbox = Array.from($('customerRows').querySelectorAll('[data-select-id]')).find(item => item.dataset.selectId === id);
    checkbox.classList.toggle('checked', selectedIds.has(id));
    checkbox.setAttribute('aria-checked', String(selectedIds.has(id)));
    checkbox.closest('tr').classList.toggle('selected', selectedIds.has(id));
    updateSelection();
  }
  function toggleAll() {
    const rows = pageRows();
    const all = rows.length > 0 && rows.every(row => selectedIds.has(row.id));
    rows.forEach(row => all ? selectedIds.delete(row.id) : selectedIds.add(row.id));
    renderTable();
  }
  function renderPages(total) {
    let markup = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" type="button" data-page="${currentPage - 1}" aria-label="上一页" ${currentPage === 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;
    let ellipsis = false;
    for (let page = 1; page <= total; page++) {
      if (total > 7 && page > 2 && page < total - 1 && Math.abs(page - currentPage) > 1) {
        if (!ellipsis) markup += '<span class="page-ellipsis">...</span>';
        ellipsis = true;
        continue;
      }
      ellipsis = false;
      markup += `<button class="page-btn ${page === currentPage ? 'active' : ''}" type="button" data-page="${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`;
    }
    $('pageNumbers').innerHTML = markup + `<button class="page-btn ${currentPage === total ? 'disabled' : ''}" type="button" data-page="${currentPage + 1}" aria-label="下一页" ${currentPage === total ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;
  }
  function goToPage(page) {
    currentPage = Math.max(1, Math.min(Math.ceil(filteredRows().length / pageSize) || 1, page));
    renderTable();
  }
  function toggleSort() {
    sortDirection = sortDirection === '' ? 'asc' : sortDirection === 'asc' ? 'desc' : '';
    $('updatedSort').classList.toggle('asc', sortDirection === 'asc');
    $('updatedSort').classList.toggle('desc', sortDirection === 'desc');
    $('updatedSort').setAttribute('aria-sort', sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none');
    $('updatedSort').querySelector('i').className = `fa-solid fa-sort${sortDirection ? (sortDirection === 'asc' ? '-up' : '-down') : ''} sort-icon`;
    currentPage = 1;
    renderTable();
  }

  function closeSelects(except) {
    document.querySelectorAll('.select-wrap.open, .page-size-select.open').forEach(wrap => {
      if (wrap === except) return;
      wrap.classList.remove('open');
      wrap.querySelector('[role="combobox"]').setAttribute('aria-expanded', 'false');
    });
  }
  function setSelect(id, value) {
    const control = selects.get(id);
    control.value = value;
    control.trigger.querySelector('span').textContent = value || control.placeholder;
    control.trigger.classList.toggle('placeholder', !value && id !== 'operatorSelect');
    if (value) clearFieldError(control.trigger);
    control.panel.querySelectorAll('[role="option"]').forEach(option => {
      const selected = option.dataset.value === value;
      option.classList.toggle('active', selected);
      option.setAttribute('aria-selected', String(selected));
    });
  }
  function bindSelect(id, values, placeholder, includeAll = false) {
    const wrap = $(id), trigger = wrap.querySelector('[role="combobox"]'), panel = wrap.querySelector('[role="listbox"]');
    const options = includeAll ? ['', ...values] : values;
    panel.innerHTML = options.map(value => `<div class="select-option" role="option" tabindex="-1" data-value="${escapeHtml(value)}" title="${escapeHtml(value || placeholder)}"><span class="cell-text">${escapeHtml(value || placeholder)}</span></div>`).join('');
    selects.set(id, { value: '', placeholder, wrap, trigger, panel });
    setSelect(id, '');
    function openPanel() {
      closeSelects(wrap);
      wrap.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      if (wrap.closest('.customer-form')) {
        const rect = trigger.getBoundingClientRect();
        const height = Math.min(240, panel.scrollHeight);
        const below = innerHeight - rect.bottom - 16;
        const above = rect.top - 16;
        const flip = below < height && above > below;
        panel.style.width = rect.width + 'px';
        panel.style.left = rect.left + 'px';
        panel.style.maxHeight = Math.max(38, Math.min(240, flip ? above : below)) + 'px';
        panel.style.top = (flip ? rect.top - Math.min(height, above) - 4 : rect.bottom + 4) + 'px';
      }
    }
    trigger.addEventListener('click', () => {
      if (wrap.classList.contains('open')) closeSelects();
      else openPanel();
    });
    trigger.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openPanel();
        (panel.querySelector('.active') || panel.firstElementChild)?.focus();
      }
    });
    function choose(option) {
      setSelect(id, option.dataset.value);
      closeSelects();
      trigger.focus();
    }
    panel.addEventListener('click', event => { const option = event.target.closest('[role="option"]'); if (option) choose(option); });
    panel.addEventListener('keydown', event => {
      const list = Array.from(panel.children), index = list.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
        list[next].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (index >= 0) choose(list[index]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeSelects();
        trigger.focus();
      }
    });
    wrap.addEventListener('focusout', event => { if (!wrap.contains(event.relatedTarget)) { wrap.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); } });
  }

  function openModal(id, focusId) {
    closeSelects();
    closeAvatar();
    lastModalTrigger = document.activeElement;
    activeModal = $(id);
    activeModal.hidden = false;
    $('customerForm').scrollTop = 0;
    document.querySelector('.header').inert = true;
    document.querySelector('.customer-page').inert = true;
    $(focusId).focus();
  }
  function closeModal() {
    if (!activeModal) return;
    closeSelects();
    activeModal.hidden = true;
    activeModal = null;
    document.querySelector('.header').inert = false;
    document.querySelector('.customer-page').inert = false;
    if (lastModalTrigger?.isConnected) lastModalTrigger.focus();
    lastModalTrigger = null;
  }
  function openCustomer(id) {
    editingId = id || null;
    const row = customers.find(item => item.id === id);
    $('customerModalTitle').textContent = row ? '编辑客户' : '新增客户';
    $('formName').value = row?.name || '';
    $('formAccount').value = row?.account || '';
    $('formPower').value = row?.powerCustomer === '-' ? '' : row?.powerCustomer || '';
    setSelect('formOperatorSelect', row?.operator || '');
    setSelect('formIndustrySelect', row?.industry === '-' ? '' : row?.industry || '');
    setSelect('formVoltageSelect', row?.voltage === '-' ? '' : row?.voltage || '');
    document.querySelectorAll('.field-error').forEach(element => { element.textContent = ''; });
    $('customerForm').querySelectorAll('[aria-invalid]').forEach(element => element.removeAttribute('aria-invalid'));
    openModal('customerModalMask', 'formName');
  }
  function saveCustomer(event) {
    event.preventDefault();
    const name = $('formName').value.trim(), account = $('formAccount').value.trim(), operator = selects.get('formOperatorSelect').value;
    const duplicate = customers.some(row => row.id !== editingId && row.account === account);
    const validations = [
      [$('formName'), $('formNameError'), !name ? '请输入用户名称' : ''],
      [$('formAccount'), $('formAccountError'), !account ? '请输入用户户号' : duplicate ? '该用户户号已存在' : ''],
      [selects.get('formOperatorSelect').trigger, $('formOperatorError'), !operator ? '请选择所属运营商' : '']
    ];
    validations.forEach(([input, error, message]) => { error.textContent = message; input.setAttribute('aria-invalid', String(Boolean(message))); });
    const invalid = validations.find(([, , message]) => message);
    if (invalid) { invalid[0].focus(); return; }
    const payload = { name, account, operator, powerCustomer: $('formPower').value.trim() || '-', industry: selects.get('formIndustrySelect').value || '-', voltage: selects.get('formVoltageSelect').value || '-', updated: now() };
    const editing = Boolean(editingId);
    if (editing) Object.assign(customers.find(row => row.id === editingId), payload);
    else customers.unshift({ id: newId(), resources: 0, capacity: 0, adjustable: 0, ...payload });
    closeModal();
    currentPage = 1;
    renderTable();
    feedback(editing ? '客户信息已更新' : '客户已新增');
  }
  function clearFieldError(input) {
    input.removeAttribute('aria-invalid');
    const error = input.closest('.customer-field')?.querySelector('.field-error');
    if (error) error.textContent = '';
  }
  function deleteSelected() {
    if (!selectedIds.size) return;
    pendingDeleteIds = [...selectedIds];
    $('deleteMessage').textContent = `将删除已选择的 ${pendingDeleteIds.length} 个客户。`;
    openModal('deleteModalMask', 'confirmDeleteButton');
  }
  function confirmDelete() {
    const ids = new Set(pendingDeleteIds);
    customers = customers.filter(row => !ids.has(row.id));
    selectedIds.clear();
    closeModal();
    renderTable();
    feedback('已删除选中的客户');
  }

  function writeWorkbook(rows, filename) {
    if (!globalThis.XLSX) { showToast('文件组件未加载，请刷新后重试'); return; }
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = columns.map(([label]) => ({ wch: label.includes('名称') || label === '所属运营商' ? 32 : 22 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '客户管理');
    XLSX.writeFile(workbook, filename);
  }
  function exportCustomers() {
    const rows = filteredRows();
    writeWorkbook([columns.map(([label]) => label), ...rows.map(row => columns.map(([, key]) => row[key]))], '客户管理.xlsx');
  }
  function downloadTemplate() { writeWorkbook([columns.map(([label]) => label)], '客户导入模板.xlsx'); }
  async function importCustomers(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) { showToast('请选择 Excel 或 CSV 文件'); return; }
    if (file.size > 10 * 1024 * 1024) { showToast('导入文件不能超过 10MB'); return; }
    if (!globalThis.XLSX) { showToast('文件组件未加载，请刷新后重试'); return; }
    $('importButton').disabled = true;
    try {
      const csv = /\.csv$/i.test(file.name);
      const source = csv ? await file.text() : await file.arrayBuffer();
      const workbook = XLSX.read(source, { type: csv ? 'string' : 'array', raw: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet || !sheet['!ref']) throw new Error('文件中没有客户数据');
      if (XLSX.utils.decode_range(sheet['!ref']).e.r > 5000) throw new Error('每次最多导入 5000 行数据');
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
      const headers = grid.shift().map(value => String(value).replace(/^\uFEFF/, '').trim());
      const positions = columns.map(([label]) => headers.indexOf(label));
      if (positions.slice(0, 3).some(index => index < 0)) throw new Error('表头不匹配，请使用客户导入模板');
      const accounts = new Set(customers.map(row => row.account));
      const additions = [];
      for (const [index, values] of grid.entries()) {
        if (values.every(value => String(value).trim() === '')) continue;
        const line = index + 2;
        const row = Object.fromEntries(columns.map(([, key], column) => [key, String(values[positions[column]] ?? '').trim()]));
        if (!row.name || !row.account || !row.operator) throw new Error(`第 ${line} 行：用户名称、用户户号和所属运营商必填`);
        if (row.name.length > 100 || row.account.length > 40 || row.powerCustomer.length > 100) throw new Error(`第 ${line} 行：名称或户号长度超出限制`);
        if (accounts.has(row.account)) throw new Error(`第 ${line} 行：用户户号 ${row.account} 已存在`);
        if (!operatorNames.includes(row.operator)) throw new Error(`第 ${line} 行：所属运营商不存在`);
        if (row.industry && row.industry !== '-' && !industries.includes(row.industry)) throw new Error(`第 ${line} 行：行业类型不匹配`);
        if (row.voltage && row.voltage !== '-' && !voltages.includes(row.voltage)) throw new Error(`第 ${line} 行：电压等级不匹配`);
        for (const key of ['resources', 'capacity', 'adjustable']) {
          const number = Number(row[key].replaceAll(',', ''));
          if (!Number.isFinite(number) || number < 0 || (key === 'resources' && !Number.isInteger(number))) throw new Error(`第 ${line} 行：资源数量或容量格式有误`);
          row[key] = number;
        }
        if (row.adjustable > row.capacity) throw new Error(`第 ${line} 行：可调容量不能大于聚合容量`);
        row.updated = normalizeUpdated(row.updated);
        if (row.updated && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.updated)) throw new Error(`第 ${line} 行：更新时间格式应为 YYYY-MM-DD HH:mm:ss`);
        accounts.add(row.account);
        additions.push({ ...row, id: newId(), powerCustomer: row.powerCustomer || '-', industry: row.industry || '-', voltage: row.voltage || '-', updated: row.updated || now() });
      }
      if (!additions.length) throw new Error('文件中没有客户数据');
      // Validate the whole file before modifying the local list.
      customers.unshift(...additions);
      currentPage = 1;
      selectedIds.clear();
      renderTable();
      feedback(`已导入 ${additions.length} 个客户`);
    } catch (error) { showToast(error.message || '导入失败，请检查文件格式'); }
    finally { $('importButton').disabled = false; }
  }

  function closeAvatar() { $('avatarBtn').classList.remove('open'); $('avatarPanel').classList.remove('show'); }
  window.toggleAvatar = event => { event.stopPropagation(); closeSelects(); $('avatarBtn').classList.toggle('open'); $('avatarPanel').classList.toggle('show'); };
  window.toggleTheme = () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('vpp-theme', next); } catch (e) {}
    $('themeToggle').querySelector('i').className = `fa-solid fa-${next === 'light' ? 'moon' : 'sun'}`;
  };
  window.toggleNavLayout = () => {
    const next = document.documentElement.dataset.navLayout === 'side' ? 'top' : 'side';
    document.documentElement.dataset.navLayout = next;
    try { localStorage.setItem('vpp-nav-layout', next); } catch (e) {}
  };
  $('themeToggle').querySelector('i').className = `fa-solid fa-${document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun'}`;

  bindSelect('operatorSelect', operatorNames, '全部运营商', true);
  bindSelect('formOperatorSelect', operatorNames, '请选择所属运营商');
  bindSelect('formIndustrySelect', industries, '请选择行业类型');
  bindSelect('formVoltageSelect', voltages, '请选择电压等级');
  $('filterRow').addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
  $('resetButton').addEventListener('click', () => { $('accountSearch').value = ''; $('customerSearch').value = ''; setSelect('operatorSelect', ''); applyFilters(); });
  $('filterToggle').addEventListener('click', () => {
    const collapsed = $('filterCard').classList.toggle('is-collapsed');
    $('filterToggle').setAttribute('aria-expanded', String(!collapsed));
    $('filterToggle').querySelector('span').textContent = collapsed ? '展开' : '收起';
    $('filterToggle').querySelector('i').className = `fa-solid fa-chevron-${collapsed ? 'down' : 'up'}`;
    closeSelects();
  });
  $('addButton').addEventListener('click', () => openCustomer());
  $('deleteButton').addEventListener('click', deleteSelected);
  $('confirmDeleteButton').addEventListener('click', confirmDelete);
  $('exportButton').addEventListener('click', exportCustomers);
  $('templateButton').addEventListener('click', downloadTemplate);
  $('importButton').addEventListener('click', () => $('importInput').click());
  $('importInput').addEventListener('change', importCustomers);
  $('customerForm').addEventListener('submit', saveCustomer);
  $('customerForm').addEventListener('input', event => clearFieldError(event.target));
  document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
  $('customerRows').addEventListener('click', event => {
    const checkbox = event.target.closest('[data-select-id]'), edit = event.target.closest('[data-edit-id]');
    if (checkbox) toggleRow(checkbox.dataset.selectId);
    if (edit) openCustomer(edit.dataset.editId);
  });
  $('customerRows').addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-select-id]')) { event.preventDefault(); toggleRow(event.target.dataset.selectId); }
  });
  $('headerCheckbox').addEventListener('click', toggleAll);
  $('headerCheckbox').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleAll(); } });
  $('updatedSort').addEventListener('click', toggleSort);
  $('updatedSort').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleSort(); } });
  $('pageNumbers').addEventListener('click', event => { const button = event.target.closest('[data-page]'); if (button && !button.disabled) goToPage(Number(button.dataset.page)); });
  $('jumpInput').addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const value = Number(event.target.value);
    if (Number.isInteger(value) && value > 0) goToPage(value);
    else { event.target.value = currentPage; showToast('请输入有效页码'); }
  });
  const pageSizeTrigger = $('pageSizeSelect').querySelector('.page-size-trigger');
  pageSizeTrigger.addEventListener('click', () => { const open = !$('pageSizeSelect').classList.contains('open'); closeSelects(); $('pageSizeSelect').classList.toggle('open', open); pageSizeTrigger.setAttribute('aria-expanded', String(open)); });
  pageSizeTrigger.addEventListener('keydown', event => {
    if (['ArrowDown', 'Enter', ' '].includes(event.key)) { event.preventDefault(); closeSelects(); $('pageSizeSelect').classList.add('open'); pageSizeTrigger.setAttribute('aria-expanded', 'true'); $('pageSizePanel').querySelector('.active').focus(); }
  });
  function changePageSize(option) {
    pageSize = Number(option.dataset.size);
    currentPage = 1;
    $('pageSizeValue').textContent = `${pageSize}条`;
    $('pageSizePanel').querySelectorAll('[data-size]').forEach(item => { const active = item === option; item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active)); });
    closeSelects();
    pageSizeTrigger.focus();
    renderTable();
  }
  $('pageSizePanel').addEventListener('click', event => { const option = event.target.closest('[data-size]'); if (option) changePageSize(option); });
  $('pageSizePanel').addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); changePageSize(event.target); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); (event.target.nextElementSibling || event.target.previousElementSibling).focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.select-wrap, .page-size-select')) closeSelects(); if (!event.target.closest('#avatarBtn')) closeAvatar(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const open = document.querySelector('.select-wrap.open, .page-size-select.open');
      if (open) { closeSelects(); open.querySelector('[role="combobox"]').focus(); }
      else if (activeModal) closeModal();
      else closeAvatar();
    }
    if (event.key === 'Tab' && activeModal) {
      const focusable = Array.from(activeModal.querySelectorAll('button, input, [tabindex="0"]')).filter(element => !element.disabled && element.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $('customerForm').addEventListener('scroll', () => closeSelects(), { passive: true });
  window.addEventListener('resize', () => closeSelects());
  renderTable();
})();
