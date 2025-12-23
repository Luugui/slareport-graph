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

	onInitialize() {
		this._graph_data = [];
		this._slo = 0;
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
		const padding = {top: 20, right: 30, bottom: 40, left: 50};
		const graphWidth = width - padding.left - padding.right;
		const graphHeight = height - padding.top - padding.bottom;

		// Criar SVG
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

		// Calcular escalas
		const values = this._graph_data.map(d => d.value);
		const minValue = Math.min(...values, this._slo) - 5;
		const maxValue = Math.max(...values, 100);
		const minTime = Math.min(...this._graph_data.map(d => d.clock));
		const maxTime = Math.max(...this._graph_data.map(d => d.clock));

		const scaleX = (time) => padding.left + ((time - minTime) / (maxTime - minTime || 1)) * graphWidth;
		const scaleY = (value) => padding.top + graphHeight - ((value - minValue) / (maxValue - minValue || 1)) * graphHeight;

		// Desenhar grid horizontal
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

		// Desenhar linha do SLO
		if (this._slo > minValue && this._slo < maxValue) {
			const sloY = scaleY(this._slo);

			const sloLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			sloLine.setAttribute('x1', padding.left);
			sloLine.setAttribute('y1', sloY);
			sloLine.setAttribute('x2', width - padding.right);
			sloLine.setAttribute('y2', sloY);
			sloLine.setAttribute('stroke', '#ff5722');
			sloLine.setAttribute('stroke-width', '2');
			sloLine.setAttribute('stroke-dasharray', '5,5');
			svg.appendChild(sloLine);

			const sloText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			sloText.setAttribute('x', width - padding.right + 5);
			sloText.setAttribute('y', sloY + 4);
			sloText.setAttribute('font-size', '10');
			sloText.setAttribute('fill', '#ff5722');
			sloText.textContent = 'SLO';
			svg.appendChild(sloText);
		}

		// Desenhar área preenchida primeiro (para ficar atrás da linha)
		if (this._graph_data.length > 1) {
			let areaPathD = `M ${scaleX(this._graph_data[0].clock)} ${padding.top + graphHeight}`;

			for (let i = 0; i < this._graph_data.length; i++) {
				const x = scaleX(this._graph_data[i].clock);
				const y = scaleY(this._graph_data[i].value);
				areaPathD += ` L ${x} ${y}`;
			}

			areaPathD += ` L ${scaleX(this._graph_data[this._graph_data.length - 1].clock)} ${padding.top + graphHeight} Z`;

			const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			areaPath.setAttribute('d', areaPathD);
			areaPath.setAttribute('fill', 'rgba(25, 118, 210, 0.1)');
			svg.appendChild(areaPath);
		}

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
		for (let i = 0; i < this._graph_data.length; i++) {
			const x = scaleX(this._graph_data[i].clock);
			const y = scaleY(this._graph_data[i].value);

			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', x);
			circle.setAttribute('cy', y);
			circle.setAttribute('r', '4');
			circle.setAttribute('fill', this._graph_data[i].value >= this._slo ? '#4caf50' : '#f44336');
			circle.setAttribute('stroke', '#fff');
			circle.setAttribute('stroke-width', '1');

			// Tooltip
			const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
			const date = new Date(this._graph_data[i].clock * 1000);
			title.textContent = `${date.toLocaleDateString()}: ${this._graph_data[i].value.toFixed(2)}%`;
			circle.appendChild(title);

			svg.appendChild(circle);
		}

		// Desenhar eixos
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

		// Labels do eixo X (datas)
		const numLabels = Math.min(this._graph_data.length, 5);
		const step = Math.floor(this._graph_data.length / numLabels) || 1;

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

		// Título do gráfico
		const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		title.setAttribute('x', width / 2);
		title.setAttribute('y', 12);
		title.setAttribute('text-anchor', 'middle');
		title.setAttribute('font-size', '12');
		title.setAttribute('font-weight', 'bold');
		title.setAttribute('fill', '#333');
		title.textContent = t('SLI Trend');
		svg.appendChild(title);

		container.appendChild(svg);
	}
}
