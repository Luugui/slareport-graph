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

	// Constantes para tipos de gráfico (modo Report)
	static GRAPH_TYPE_LINE = 0;
	static GRAPH_TYPE_BAR = 1;
	static GRAPH_TYPE_AREA = 2;

	// Constantes para tipos de gráfico Single Item
	static SINGLE_GRAPH_TYPE_SPARKLINE = 0;
	static SINGLE_GRAPH_TYPE_PIE = 1;
	static SINGLE_GRAPH_TYPE_DOUGHNUT = 2;
	static SINGLE_GRAPH_TYPE_GAUGE = 3;

	// Constantes para modo de exibição (devem corresponder ao PHP)
	static DISPLAY_MODE_REPORT = 0;
	static DISPLAY_MODE_SINGLE_ITEM = 1;

	// Constantes para opções de exibição de conteúdo
	static SHOW_GRAPH_AND_TABLE = 0;
	static SHOW_GRAPH_ONLY = 1;
	static SHOW_TABLE_ONLY = 2;

	onInitialize() {
		this._graph_data = [];
		this._slo = 0;
		this._graph_type = CWidgetSlaReportGraph.GRAPH_TYPE_LINE;
		this._single_graph_type = CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_SPARKLINE;
		this._threshold_warning = 95;
		this._threshold_critical = 90;
		this._display_mode = CWidgetSlaReportGraph.DISPLAY_MODE_REPORT;
		this._show_content = CWidgetSlaReportGraph.SHOW_GRAPH_AND_TABLE;
		this._has_contents = false;
		this._chart_instance = null;
	}

	onActivate() {
		if (this._has_contents) {
			this._renderGraph();
		}
	}

	onDeactivate() {
		this._destroyChart();
	}

	onResize() {
		if (this._has_contents && this._chart_instance) {
			this._chart_instance.resize();
		}
	}

	processUpdateResponse(response) {
		super.processUpdateResponse(response);

		// Os dados são passados via setVar no PHP e chegam no response
		if (response.graph_data !== undefined && response.graph_data.length > 0) {
			this._graph_data = response.graph_data;
			this._slo = response.slo || 0;
			this._graph_type = response.graph_type !== undefined ? parseInt(response.graph_type) : CWidgetSlaReportGraph.GRAPH_TYPE_LINE;
			this._single_graph_type = response.single_graph_type !== undefined ? parseInt(response.single_graph_type) : CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_SPARKLINE;
			this._threshold_warning = response.threshold_warning !== undefined ? parseInt(response.threshold_warning) : 95;
			this._threshold_critical = response.threshold_critical !== undefined ? parseInt(response.threshold_critical) : 90;
			this._display_mode = response.display_mode !== undefined ? parseInt(response.display_mode) : CWidgetSlaReportGraph.DISPLAY_MODE_REPORT;
			this._show_content = response.show_content !== undefined ? parseInt(response.show_content) : CWidgetSlaReportGraph.SHOW_GRAPH_AND_TABLE;
			this._has_contents = true;
			
			// Aguardar o DOM estar pronto antes de renderizar o gráfico
			setTimeout(() => {
				this._renderGraph();
			}, 100);
		}
		else {
			this._has_contents = false;
			this._graph_data = [];
			this._destroyChart();
		}
	}

	_destroyChart() {
		if (this._chart_instance) {
			this._chart_instance.destroy();
			this._chart_instance = null;
		}
	}

	_renderGraph() {
		const container = this._body.querySelector('.sla-trend-graph-container');

		if (!container) {
			return;
		}

		if (!this._graph_data || this._graph_data.length === 0) {
			container.innerHTML = '<div style="text-align: center; padding: 10px; color: #999; font-size: 11px;">' +
				t('No trend data available') + '</div>';
			return;
		}

		// Limpar container
		container.innerHTML = '';

		// Verificar se é modo Single Item
		const isSingleMode = this._display_mode === CWidgetSlaReportGraph.DISPLAY_MODE_SINGLE_ITEM;

		// Criar canvas para o Chart.js
		const canvas = document.createElement('canvas');
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		container.appendChild(canvas);

		// Destruir chart anterior se existir
		this._destroyChart();

		// Renderizar baseado no tipo de gráfico
		if (isSingleMode && (this._single_graph_type === CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_PIE || 
							this._single_graph_type === CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_DOUGHNUT)) {
			this._renderPieChart(canvas);
		} else if (isSingleMode && this._single_graph_type === CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_GAUGE) {
			this._renderGaugeChart(canvas);
		} else {
			this._renderLineChart(canvas, isSingleMode);
		}
	}

	_getChartType() {
		switch (this._graph_type) {
			case CWidgetSlaReportGraph.GRAPH_TYPE_BAR:
				return 'bar';
			case CWidgetSlaReportGraph.GRAPH_TYPE_AREA:
			case CWidgetSlaReportGraph.GRAPH_TYPE_LINE:
			default:
				return 'line';
		}
	}

	_getBackgroundColor(isSingleMode) {
		if (this._graph_type === CWidgetSlaReportGraph.GRAPH_TYPE_AREA) {
			if (isSingleMode) {
				return 'rgba(25, 118, 210, 0.3)';
			}
			return 'rgba(25, 118, 210, 0.2)';
		}
		
		if (this._graph_type === CWidgetSlaReportGraph.GRAPH_TYPE_BAR) {
			// Para barras, usar as cores dos thresholds
			return this._graph_data.map(d => {
				if (d.value >= this._threshold_warning) {
					return '#4caf50';
				} else if (d.value >= this._threshold_critical) {
					return '#ffc107';
				} else {
					return '#f44336';
				}
			});
		}

		return 'transparent';
	}

	_getChartOptions(isSingleMode) {
		const options = {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: 'index',
				intersect: false
			},
			plugins: {
				legend: {
					display: !isSingleMode,
					position: 'top'
				},
				title: {
					display: !isSingleMode,
					text: t('SLI Trend'),
					font: {
						size: 14,
						weight: 'bold'
					}
				},
				tooltip: {
					enabled: true,
					callbacks: {
						label: (context) => {
							const value = context.parsed.y;
							let status = '';
							if (value >= this._threshold_warning) {
								status = ' ✓ OK';
							} else if (value >= this._threshold_critical) {
								status = ' ⚠ Warning';
							} else {
								status = ' ✗ Critical';
							}
							return `SLI: ${value.toFixed(2)}%${status}`;
						}
					}
				}
			},
			scales: {
				y: {
					display: !isSingleMode,
					beginAtZero: false,
					min: Math.min(...this._graph_data.map(d => d.value), this._threshold_critical) - 5,
					max: 100,
					title: {
						display: !isSingleMode,
						text: 'SLI (%)'
					},
					ticks: {
						callback: (value) => value.toFixed(1) + '%'
					}
				},
				x: {
					display: !isSingleMode,
					title: {
						display: !isSingleMode,
						text: t('Date')
					}
				}
			}
		};

		return options;
	}

	_getThresholdLinesPlugin() {
		const isSingleMode = this._display_mode === CWidgetSlaReportGraph.DISPLAY_MODE_SINGLE_ITEM;
		
		if (isSingleMode) {
			return {}; // Não desenhar linhas de threshold no modo Single Item
		}

		return {
			id: 'thresholdLines',
			afterDatasetsDraw: (chart) => {
				const ctx = chart.ctx;
				const chartArea = chart.chartArea;
				const yScale = chart.scales.y;

				// Desenhar zonas de alerta
				this._drawAlertZones(ctx, chartArea, yScale);

				// Desenhar linha do SLO
				this._drawThresholdLine(ctx, chartArea, yScale, this._slo, '#9c27b0', 'SLO', [5, 5]);

				// Desenhar linha de Warning
				this._drawThresholdLine(ctx, chartArea, yScale, this._threshold_warning, '#ffc107', 'Warning', [3, 3]);

				// Desenhar linha de Critical
				this._drawThresholdLine(ctx, chartArea, yScale, this._threshold_critical, '#f44336', 'Critical', [3, 3]);
			}
		};
	}

	_drawAlertZones(ctx, chartArea, yScale) {
		const {left, right, top, bottom} = chartArea;

		// Zona verde (acima do warning threshold)
		if (this._threshold_warning <= yScale.max && this._threshold_warning >= yScale.min) {
			const warningY = yScale.getPixelForValue(this._threshold_warning);
			ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
			ctx.fillRect(left, top, right - left, warningY - top);
		}

		// Zona amarela (entre warning e critical)
		if (this._threshold_warning > this._threshold_critical) {
			const warningY = yScale.getPixelForValue(this._threshold_warning);
			const criticalY = yScale.getPixelForValue(this._threshold_critical);
			
			if (criticalY > warningY) {
				ctx.fillStyle = 'rgba(255, 193, 7, 0.1)';
				ctx.fillRect(left, warningY, right - left, criticalY - warningY);
			}
		}

		// Zona vermelha (abaixo do critical threshold)
		if (this._threshold_critical >= yScale.min) {
			const criticalY = yScale.getPixelForValue(this._threshold_critical);
			ctx.fillStyle = 'rgba(244, 67, 54, 0.1)';
			ctx.fillRect(left, criticalY, right - left, bottom - criticalY);
		}
	}

	_drawThresholdLine(ctx, chartArea, yScale, value, color, label, dashPattern) {
		if (value < yScale.min || value > yScale.max) {
			return;
		}

		const {left, right} = chartArea;
		const y = yScale.getPixelForValue(value);

		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
		ctx.setLineDash(dashPattern);
		ctx.beginPath();
		ctx.moveTo(left, y);
		ctx.lineTo(right, y);
		ctx.stroke();
		ctx.restore();

		// Label
		ctx.save();
		ctx.fillStyle = color;
		ctx.font = '9px Arial';
		ctx.textAlign = 'right';
		ctx.fillText(label, right - 5, y - 3);
			ctx.restore();
		}
	}

	_renderLineChart(canvas, isSingleMode) {
		// Preparar dados para o Chart.js
		const labels = this._graph_data.map(d => {
			const date = new Date(d.clock * 1000);
			return date.toLocaleDateString('pt-BR', {month: 'short', day: 'numeric'});
		});

		const values = this._graph_data.map(d => d.value);

		// Determinar cores dos pontos baseadas nos thresholds
		const pointColors = values.map(value => {
			if (value >= this._threshold_warning) {
				return '#4caf50'; // Verde
			} else if (value >= this._threshold_critical) {
				return '#ffc107'; // Amarelo
			} else {
				return '#f44336'; // Vermelho
			}
		});

		// Configuração do Chart.js
		const chartConfig = {
			type: this._getChartType(),
			data: {
				labels: labels,
				datasets: [
					{
						label: 'SLI (%)',
						data: values,
						borderColor: isSingleMode ? '#1976d2' : '#1976d2',
						backgroundColor: this._getBackgroundColor(isSingleMode),
						pointBackgroundColor: pointColors,
						pointBorderColor: '#fff',
						pointBorderWidth: isSingleMode ? 1 : 2,
						pointRadius: isSingleMode ? 2 : 5,
						pointHoverRadius: isSingleMode ? 3 : 7,
						borderWidth: isSingleMode ? 1.5 : 2,
						fill: this._graph_type === CWidgetSlaReportGraph.GRAPH_TYPE_AREA,
						tension: 0.1
					}
				]
			},
			options: this._getChartOptions(isSingleMode),
			plugins: [this._getThresholdLinesPlugin()]
		};

		// Criar o chart
		this._chart_instance = new Chart(canvas, chartConfig);
	}

	_renderPieChart(canvas) {
		// Calcular SLI médio
		const avgSLI = this._graph_data.reduce((sum, d) => sum + d.value, 0) / this._graph_data.length;
		const errorBudget = 100 - avgSLI;

		// Determinar cor baseada nos thresholds
		let sliColor;
		if (avgSLI >= this._threshold_warning) {
			sliColor = '#4caf50'; // Verde
		} else if (avgSLI >= this._threshold_critical) {
			sliColor = '#ffc107'; // Amarelo
		} else {
			sliColor = '#f44336'; // Vermelho
		}

		const chartType = this._single_graph_type === CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_DOUGHNUT ? 'doughnut' : 'pie';

		const chartConfig = {
			type: chartType,
			data: {
				labels: ['SLI', 'Error Budget'],
				datasets: [{
					data: [avgSLI, errorBudget],
					backgroundColor: [sliColor, '#e0e0e0'],
					borderWidth: 2,
					borderColor: '#fff'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						position: 'bottom',
						labels: {
							font: {
								size: 10
							}
						}
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								const label = context.label || '';
								const value = context.parsed;
								return `${label}: ${value.toFixed(2)}%`;
							}
						}
					}
				}
			}
		};

		this._chart_instance = new Chart(canvas, chartConfig);
	}

	_renderGaugeChart(canvas) {
		// Calcular SLI médio
		const avgSLI = this._graph_data.reduce((sum, d) => sum + d.value, 0) / this._graph_data.length;

		// Determinar cor baseada nos thresholds
		let sliColor;
		if (avgSLI >= this._threshold_warning) {
			sliColor = '#4caf50'; // Verde
		} else if (avgSLI >= this._threshold_critical) {
			sliColor = '#ffc107'; // Amarelo
		} else {
			sliColor = '#f44336'; // Vermelho
		}

		// Usar gráfico doughnut para simular gauge
		const chartConfig = {
			type: 'doughnut',
			data: {
				labels: ['SLI', 'Restante'],
				datasets: [{
					data: [avgSLI, 100 - avgSLI],
					backgroundColor: [sliColor, '#e0e0e0'],
					borderWidth: 0,
					circumference: 180,
					rotation: 270
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						enabled: false
					}
				}
			},
			plugins: [{
				afterDraw: (chart) => {
					const {ctx, chartArea: {top, bottom, left, right, width, height}} = chart;
					ctx.save();
					
					// Desenhar o valor no centro
					const centerX = (left + right) / 2;
					const centerY = bottom - 10;
					
					ctx.font = 'bold 24px Arial';
					ctx.fillStyle = sliColor;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(`${avgSLI.toFixed(1)}%`, centerX, centerY);
					
					ctx.font = '10px Arial';
					ctx.fillStyle = '#666';
					ctx.fillText('SLI', centerX, centerY + 18);
					
					ctx.restore();
				}
			}]
		};

		this._chart_instance = new Chart(canvas, chartConfig);
	}
}