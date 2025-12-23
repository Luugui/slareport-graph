/*
** Copyright (C) 2001-2025 Zabbix SIA
**
** This program is free software: you can redistribute it and/or modify it under the terms of
** the GNU Affero General Public License as published by the Free Software Foundation, version 3.
**
** This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
** without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
** See the GNU Affero General Public License for more details.
**
** You should have received a copy of the GNU Affero General Public License along with this program.
** If not, see <https://www.gnu.org/licenses/>.
**/


class CWidgetSlaReportGraph extends CWidget {

	// Constantes para tipos de gráfico (devem corresponder ao PHP)
	static GRAPH_TYPE_LINE = 0;
	static GRAPH_TYPE_BAR = 1;
	static GRAPH_TYPE_AREA = 2;

	onInitialize() {
		this._graph_data = [];
		this._slo = 0;
		this._graph_type = CWidgetSlaReportGraph.GRAPH_TYPE_LINE;
		this._threshold_warning = 95;
		this._threshold_critical = 90;
		this._has_contents = false;
	}

	onActivate() {
		if (this._has_contents) {
			this._renderGraph();
		}
	}

	onDeactivate() {
		// Cleanup if needed
	}

	onResize() {
		if (this._has_contents) {
			this._renderGraph();
		}
	}

	processUpdateResponse(response) {
		super.processUpdateResponse(response);

		// Os dados são passados via setVar no PHP e chegam no response
		if (response.graph_data !== undefined && response.graph_data.length > 0) {
			this._graph_data = response.graph_data;
			this._slo = response.slo || 0;
			this._graph_type = response.graph_type !== undefined ? parseInt(response.graph_type) : CWidgetSlaReportGraph.GRAPH_TYPE_LINE;
			this._threshold_warning = response.threshold_warning !== undefined ? parseInt(response.threshold_warning) : 95;
			this._threshold_critical = response.threshold_critical !== undefined ? parseInt(response.threshold_critical) : 90;
			this._has_contents = true;
			this._renderGraph();
		}
		else {
			this._has_contents = false;
			this._graph_data = [];
		}
	}

	_renderGraph() {
		const container = this._body.querySelector('.sla-trend-graph-container');

		if (!container) {
			return;
		}

		if (!this._graph_data || this._graph_data.length === 0) {
			container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">' +
				t('No trend data available') + '</div>';
			return;
		}

		// Limpar container
		container.innerHTML = '';

		// Dimensões do gráfico
		const width = container.offsetWidth || 400;
		const height = container.offsetHeight || 200;
		const padding = {top: 25, right: 40, bottom: 40, left: 55};
		const graphWidth = width - padding.left - padding.right;
		const graphHeight = height - padding.top - padding.bottom;

		// Criar SVG
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

		// Calcular escalas
		const values = this._graph_data.map(d => d.value);
		const minValue = Math.min(...values, this._slo, this._threshold_critical) - 5;
		const maxValue = Math.max(...values, 100);
		const minTime = Math.min(...this._graph_data.map(d => d.clock));
		const maxTime = Math.max(...this._graph_data.map(d => d.clock));

		const scaleX = (time) => padding.left + ((time - minTime) / (maxTime - minTime || 1)) * graphWidth;
		const scaleY = (value) => padding.top + graphHeight - ((value - minValue) / (maxValue - minValue || 1)) * graphHeight;

		// Desenhar zonas de alerta (thresholds)
		this._drawAlertZones(svg, padding, graphWidth, graphHeight, scaleY, minValue, maxValue);

		// Desenhar grid horizontal
		this._drawGrid(svg, padding, width, graphHeight, scaleY, minValue, maxValue);

		// Desenhar linhas de threshold
		this._drawThresholdLines(svg, padding, width, scaleY, minValue, maxValue);

		// Desenhar linha do SLO
		this._drawSloLine(svg, padding, width, scaleY, minValue, maxValue);

		// Desenhar o gráfico baseado no tipo selecionado
		switch (this._graph_type) {
			case CWidgetSlaReportGraph.GRAPH_TYPE_BAR:
				this._drawBarChart(svg, padding, graphWidth, graphHeight, scaleX, scaleY, minTime, maxTime);
				break;
			case CWidgetSlaReportGraph.GRAPH_TYPE_AREA:
				this._drawAreaChart(svg, padding, graphWidth, graphHeight, scaleX, scaleY);
				break;
			case CWidgetSlaReportGraph.GRAPH_TYPE_LINE:
			default:
				this._drawLineChart(svg, padding, graphWidth, graphHeight, scaleX, scaleY);
				break;
		}

		// Desenhar eixos
		this._drawAxes(svg, padding, width, graphWidth, graphHeight);

		// Labels do eixo X (datas)
		this._drawXLabels(svg, padding, graphHeight, scaleX);

		// Título do gráfico
		this._drawTitle(svg, width);

		// Legenda
		this._drawLegend(svg, width, padding);

		container.appendChild(svg);
	}

	_drawAlertZones(svg, padding, graphWidth, graphHeight, scaleY, minValue, maxValue) {
		// Zona verde (acima do warning threshold)
		if (this._threshold_warning < maxValue && this._threshold_warning > minValue) {
			const greenZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			greenZone.setAttribute('x', padding.left);
			greenZone.setAttribute('y', padding.top);
			greenZone.setAttribute('width', graphWidth);
			greenZone.setAttribute('height', scaleY(this._threshold_warning) - padding.top);
			greenZone.setAttribute('fill', 'rgba(76, 175, 80, 0.1)');
			svg.appendChild(greenZone);
		}

		// Zona amarela (entre warning e critical)
		if (this._threshold_warning > this._threshold_critical) {
			const warningTop = Math.max(scaleY(this._threshold_warning), padding.top);
			const criticalBottom = Math.min(scaleY(this._threshold_critical), padding.top + graphHeight);
			
			if (criticalBottom > warningTop) {
				const yellowZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
				yellowZone.setAttribute('x', padding.left);
				yellowZone.setAttribute('y', warningTop);
				yellowZone.setAttribute('width', graphWidth);
				yellowZone.setAttribute('height', criticalBottom - warningTop);
				yellowZone.setAttribute('fill', 'rgba(255, 193, 7, 0.1)');
				svg.appendChild(yellowZone);
			}
		}

		// Zona vermelha (abaixo do critical threshold)
		if (this._threshold_critical > minValue) {
			const criticalTop = Math.max(scaleY(this._threshold_critical), padding.top);
			const redZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			redZone.setAttribute('x', padding.left);
			redZone.setAttribute('y', criticalTop);
			redZone.setAttribute('width', graphWidth);
			redZone.setAttribute('height', padding.top + graphHeight - criticalTop);
			redZone.setAttribute('fill', 'rgba(244, 67, 54, 0.1)');
			svg.appendChild(redZone);
		}
	}

	_drawGrid(svg, padding, width, graphHeight, scaleY, minValue, maxValue) {
		for (let i = 0; i <= 4; i++) {
			const y = padding.top + (graphHeight / 4) * i;
			const value = maxValue - ((maxValue - minValue) / 4) * i;

			const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', padding.left);
			line.setAttribute('y1', y);
			line.setAttribute('x2', width - padding.right);
			line.setAttribute('y2', y);
			line.setAttribute('stroke', '#e0e0e0');
			line.setAttribute('stroke-width', '1');
			svg.appendChild(line);

			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', padding.left - 5);
			text.setAttribute('y', y + 4);
			text.setAttribute('text-anchor', 'end');
			text.setAttribute('font-size', '10');
			text.setAttribute('fill', '#666');
			text.textContent = value.toFixed(1) + '%';
			svg.appendChild(text);
		}
	}

	_drawThresholdLines(svg, padding, width, scaleY, minValue, maxValue) {
		// Linha de warning threshold
		if (this._threshold_warning > minValue && this._threshold_warning < maxValue) {
			const warningY = scaleY(this._threshold_warning);

			const warningLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			warningLine.setAttribute('x1', padding.left);
			warningLine.setAttribute('y1', warningY);
			warningLine.setAttribute('x2', width - padding.right);
			warningLine.setAttribute('y2', warningY);
			warningLine.setAttribute('stroke', '#ffc107');
			warningLine.setAttribute('stroke-width', '1');
			warningLine.setAttribute('stroke-dasharray', '3,3');
			svg.appendChild(warningLine);
		}

		// Linha de critical threshold
		if (this._threshold_critical > minValue && this._threshold_critical < maxValue) {
			const criticalY = scaleY(this._threshold_critical);

			const criticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			criticalLine.setAttribute('x1', padding.left);
			criticalLine.setAttribute('y1', criticalY);
			criticalLine.setAttribute('x2', width - padding.right);
			criticalLine.setAttribute('y2', criticalY);
			criticalLine.setAttribute('stroke', '#f44336');
			criticalLine.setAttribute('stroke-width', '1');
			criticalLine.setAttribute('stroke-dasharray', '3,3');
			svg.appendChild(criticalLine);
		}
	}

	_drawSloLine(svg, padding, width, scaleY, minValue, maxValue) {
		if (this._slo > minValue && this._slo < maxValue) {
			const sloY = scaleY(this._slo);

			const sloLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			sloLine.setAttribute('x1', padding.left);
			sloLine.setAttribute('y1', sloY);
			sloLine.setAttribute('x2', width - padding.right);
			sloLine.setAttribute('y2', sloY);
			sloLine.setAttribute('stroke', '#9c27b0');
			sloLine.setAttribute('stroke-width', '2');
			sloLine.setAttribute('stroke-dasharray', '5,5');
			svg.appendChild(sloLine);

			const sloText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			sloText.setAttribute('x', width - padding.right + 3);
			sloText.setAttribute('y', sloY + 4);
			sloText.setAttribute('font-size', '9');
			sloText.setAttribute('fill', '#9c27b0');
			sloText.textContent = 'SLO';
			svg.appendChild(sloText);
		}
	}

	_drawLineChart(svg, padding, graphWidth, graphHeight, scaleX, scaleY) {
		// Desenhar linha do gráfico
		if (this._graph_data.length > 1) {
			let pathD = '';

			for (let i = 0; i < this._graph_data.length; i++) {
				const x = scaleX(this._graph_data[i].clock);
				const y = scaleY(this._graph_data[i].value);

				if (i === 0) {
					pathD += `M ${x} ${y}`;
				} else {
					pathD += ` L ${x} ${y}`;
				}
			}

			const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('d', pathD);
			path.setAttribute('stroke', '#1976d2');
			path.setAttribute('stroke-width', '2');
			path.setAttribute('fill', 'none');
			svg.appendChild(path);
		}

		// Desenhar pontos
		this._drawDataPoints(svg, scaleX, scaleY);
	}

	_drawAreaChart(svg, padding, graphWidth, graphHeight, scaleX, scaleY) {
		if (this._graph_data.length > 1) {
			// Área preenchida
			let areaPathD = `M ${scaleX(this._graph_data[0].clock)} ${padding.top + graphHeight}`;

			for (let i = 0; i < this._graph_data.length; i++) {
				const x = scaleX(this._graph_data[i].clock);
				const y = scaleY(this._graph_data[i].value);
				areaPathD += ` L ${x} ${y}`;
			}

			areaPathD += ` L ${scaleX(this._graph_data[this._graph_data.length - 1].clock)} ${padding.top + graphHeight} Z`;

			const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			areaPath.setAttribute('d', areaPathD);
			areaPath.setAttribute('fill', 'rgba(25, 118, 210, 0.3)');
			svg.appendChild(areaPath);

			// Linha de contorno
			let linePathD = '';
			for (let i = 0; i < this._graph_data.length; i++) {
				const x = scaleX(this._graph_data[i].clock);
				const y = scaleY(this._graph_data[i].value);

				if (i === 0) {
					linePathD += `M ${x} ${y}`;
				} else {
					linePathD += ` L ${x} ${y}`;
				}
			}

			const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			linePath.setAttribute('d', linePathD);
			linePath.setAttribute('stroke', '#1976d2');
			linePath.setAttribute('stroke-width', '2');
			linePath.setAttribute('fill', 'none');
			svg.appendChild(linePath);
		}

		// Desenhar pontos
		this._drawDataPoints(svg, scaleX, scaleY);
	}

	_drawBarChart(svg, padding, graphWidth, graphHeight, scaleX, scaleY, minTime, maxTime) {
		const barWidth = Math.max(10, (graphWidth / this._graph_data.length) - 4);
		const baseY = padding.top + graphHeight;

		for (let i = 0; i < this._graph_data.length; i++) {
			const x = scaleX(this._graph_data[i].clock) - barWidth / 2;
			const y = scaleY(this._graph_data[i].value);
			const barHeight = baseY - y;

			// Determinar cor baseada nos thresholds
			let fillColor;
			if (this._graph_data[i].value >= this._threshold_warning) {
				fillColor = '#4caf50'; // Verde
			} else if (this._graph_data[i].value >= this._threshold_critical) {
				fillColor = '#ffc107'; // Amarelo
			} else {
				fillColor = '#f44336'; // Vermelho
			}

			const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			rect.setAttribute('x', x);
			rect.setAttribute('y', y);
			rect.setAttribute('width', barWidth);
			rect.setAttribute('height', barHeight);
			rect.setAttribute('fill', fillColor);
			rect.setAttribute('stroke', '#fff');
			rect.setAttribute('stroke-width', '1');
			rect.setAttribute('rx', '2');

			// Tooltip
			const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
			const date = new Date(this._graph_data[i].clock * 1000);
			title.textContent = `${date.toLocaleDateString()}: ${this._graph_data[i].value.toFixed(2)}%`;
			rect.appendChild(title);

			svg.appendChild(rect);
		}
	}

	_drawDataPoints(svg, scaleX, scaleY) {
		for (let i = 0; i < this._graph_data.length; i++) {
			const x = scaleX(this._graph_data[i].clock);
			const y = scaleY(this._graph_data[i].value);

			// Determinar cor baseada nos thresholds
			let fillColor;
			if (this._graph_data[i].value >= this._threshold_warning) {
				fillColor = '#4caf50'; // Verde
			} else if (this._graph_data[i].value >= this._threshold_critical) {
				fillColor = '#ffc107'; // Amarelo
			} else {
				fillColor = '#f44336'; // Vermelho
			}

			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', x);
			circle.setAttribute('cy', y);
			circle.setAttribute('r', '5');
			circle.setAttribute('fill', fillColor);
			circle.setAttribute('stroke', '#fff');
			circle.setAttribute('stroke-width', '2');

			// Tooltip
			const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
			const date = new Date(this._graph_data[i].clock * 1000);
			let status = '';
			if (this._graph_data[i].value >= this._threshold_warning) {
				status = ' ✓';
			} else if (this._graph_data[i].value >= this._threshold_critical) {
				status = ' ⚠';
			} else {
				status = ' ✗';
			}
			title.textContent = `${date.toLocaleDateString()}: ${this._graph_data[i].value.toFixed(2)}%${status}`;
			circle.appendChild(title);

			svg.appendChild(circle);
		}
	}

	_drawAxes(svg, padding, width, graphWidth, graphHeight) {
		// Eixo X
		const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		xAxis.setAttribute('x1', padding.left);
		xAxis.setAttribute('y1', padding.top + graphHeight);
		xAxis.setAttribute('x2', width - padding.right);
		xAxis.setAttribute('y2', padding.top + graphHeight);
		xAxis.setAttribute('stroke', '#333');
		xAxis.setAttribute('stroke-width', '1');
		svg.appendChild(xAxis);

		// Eixo Y
		const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		yAxis.setAttribute('x1', padding.left);
		yAxis.setAttribute('y1', padding.top);
		yAxis.setAttribute('x2', padding.left);
		yAxis.setAttribute('y2', padding.top + graphHeight);
		yAxis.setAttribute('stroke', '#333');
		yAxis.setAttribute('stroke-width', '1');
		svg.appendChild(yAxis);
	}

	_drawXLabels(svg, padding, graphHeight, scaleX) {
		const numLabels = Math.min(this._graph_data.length, 6);
		const step = Math.max(1, Math.floor(this._graph_data.length / numLabels));

		for (let i = 0; i < this._graph_data.length; i += step) {
			const x = scaleX(this._graph_data[i].clock);
			const date = new Date(this._graph_data[i].clock * 1000);

			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', x);
			text.setAttribute('y', padding.top + graphHeight + 15);
			text.setAttribute('text-anchor', 'middle');
			text.setAttribute('font-size', '9');
			text.setAttribute('fill', '#666');
			text.textContent = date.toLocaleDateString('pt-BR', {month: 'short', day: 'numeric'});
			svg.appendChild(text);
		}
	}

	_drawTitle(svg, width) {
		const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		title.setAttribute('x', width / 2);
		title.setAttribute('y', 14);
		title.setAttribute('text-anchor', 'middle');
		title.setAttribute('font-size', '12');
		title.setAttribute('font-weight', 'bold');
		title.setAttribute('fill', '#333');
		title.textContent = t('SLI Trend');
		svg.appendChild(title);
	}

	_drawLegend(svg, width, padding) {
		const legendY = padding.top - 8;
		const legendItems = [
			{color: '#4caf50', label: t('OK')},
			{color: '#ffc107', label: t('Warning')},
			{color: '#f44336', label: t('Critical')},
			{color: '#9c27b0', label: 'SLO'}
		];

		let legendX = width - padding.right - 10;

		for (let i = legendItems.length - 1; i >= 0; i--) {
			const item = legendItems[i];
			
			const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			text.setAttribute('x', legendX);
			text.setAttribute('y', legendY);
			text.setAttribute('text-anchor', 'end');
			text.setAttribute('font-size', '9');
			text.setAttribute('fill', '#666');
			text.textContent = item.label;
			svg.appendChild(text);

			legendX -= text.textContent.length * 5 + 5;

			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', legendX);
			circle.setAttribute('cy', legendY - 3);
			circle.setAttribute('r', '4');
			circle.setAttribute('fill', item.color);
			svg.appendChild(circle);

			legendX -= 15;
		}
	}
}
