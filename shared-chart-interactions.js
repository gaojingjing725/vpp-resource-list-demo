function positionSharedChartTooltip(event, viewport, tooltip) {
  const rect = viewport.getBoundingClientRect();
  const gap = 12;
  const maxLeft = rect.width - tooltip.offsetWidth - 8;
  const maxTop = rect.height - tooltip.offsetHeight - 8;
  let left = event.clientX - rect.left + gap;
  let top = event.clientY - rect.top - tooltip.offsetHeight - gap;
  if (left > maxLeft) left = event.clientX - rect.left - tooltip.offsetWidth - gap;
  if (top < 8) top = event.clientY - rect.top + gap;
  tooltip.style.left = Math.max(8, Math.min(left, maxLeft)) + 'px';
  tooltip.style.top = Math.max(8, Math.min(top, maxTop)) + 'px';
}

function bindSharedChartTooltip({ host, labels, lines, seriesNames, x, top, bottom, height, plotHeight, width }) {
  const viewport = host.querySelector('.chart-viewport');
  const tooltip = host.querySelector('.chart-tooltip');
  const svg = host.querySelector('svg');
  const namespace = 'http://www.w3.org/2000/svg';
  const hoverLayer = document.createElementNS(namespace, 'g');
  hoverLayer.setAttribute('class', 'chart-hover-layer');

  const show = (event, index) => {
    const rows = lines.map((line, seriesIndex) => '<div class="chart-tooltip-row"><span class="chart-tooltip-name"><i class="chart-tooltip-dot" style="background:' + line.color + '"></i>' + seriesNames[seriesIndex] + '</span><span class="chart-tooltip-value">' + line.data[index] + ' kW</span></div>').join('');
    tooltip.innerHTML = '<div class="chart-tooltip-time">' + labels[index] + '</div>' + rows;
    tooltip.classList.add('show');
    positionSharedChartTooltip(event, viewport, tooltip);
  };

  labels.forEach((label, index) => {
    const center = x(index);
    const left = index === 0 ? 0 : (x(index - 1) + center) / 2;
    const right = index === labels.length - 1 ? width : (center + x(index + 1)) / 2;
    const line = document.createElementNS(namespace, 'line');
    const band = document.createElementNS(namespace, 'rect');
    line.setAttribute('class', 'chart-hover-line');
    line.setAttribute('x1', center); line.setAttribute('x2', center);
    line.setAttribute('y1', top); line.setAttribute('y2', height - bottom);
    band.setAttribute('class', 'chart-hover-band');
    band.setAttribute('x', left); band.setAttribute('y', top);
    band.setAttribute('width', right - left); band.setAttribute('height', plotHeight);
    band.addEventListener('pointerenter', event => { line.classList.add('active'); show(event, index); });
    band.addEventListener('pointermove', event => positionSharedChartTooltip(event, viewport, tooltip));
    band.addEventListener('pointerleave', () => { line.classList.remove('active'); tooltip.classList.remove('show'); });
    hoverLayer.append(line, band);
  });
  svg.appendChild(hoverLayer);
  host.querySelectorAll('.point').forEach(point => { point.style.pointerEvents = 'none'; });
}
