<?php declare(strict_types = 0);
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


/**
 * SLA report with Graph widget view.
 *
 * @var CView $this
 * @var array $data
 */

use Widgets\SlaReportGraph\Includes\WidgetForm;

// Criar o container do widget
$view = new CWidgetView($data);

// Verificar erros de permissão
if ($data['has_permissions_error']) {
	$view->addItem(
		(new CTableInfo())->setNoDataMessage(_('No permissions to referred object or it does not exist!'))
	);
	$view->show();
	return;
}

// Verificar se o SLA está habilitado
if (!isset($data['sla']) || $data['sla']['status'] != ZBX_SLA_STATUS_ENABLED) {
	$view->addItem(
		(new CTableInfo())->setNoDataMessage(_('SLA is disabled.'))
	);
	$view->show();
	return;
}

// Modo Single Item
if ($data['display_mode'] == WidgetForm::DISPLAY_MODE_SINGLE_ITEM) {
	renderSingleItemMode($view, $data);
}
// Modo Report (padrão)
else {
	renderReportMode($view, $data);
}

$view->show();

/**
 * Renderiza o modo Single Item
 */
function renderSingleItemMode(CWidgetView $view, array $data): void {
	$single_item = $data['single_item'];
	
	// Determinar cor baseada nos thresholds
	$sli_value = $single_item['sli'];
	$status_class = 'sla-status-ok';
	$status_color = '#4caf50';
	
	if ($sli_value !== null) {
		if ($sli_value < $data['threshold_critical']) {
			$status_class = 'sla-status-critical';
			$status_color = '#f44336';
		}
		elseif ($sli_value < $data['threshold_warning']) {
			$status_class = 'sla-status-warning';
			$status_color = '#ffc107';
		}
	}
	else {
		$status_class = 'sla-status-unknown';
		$status_color = '#9e9e9e';
	}

	// Container principal do Single Item
	$bg_style = '';
	if (!empty($data['bg_color'])) {
		$bg_style = 'background-color: #' . $data['bg_color'] . ';';
	}

	$single_container = (new CDiv())
		->addClass('sla-single-item-container')
		->addStyle('display: flex; flex-direction: column; height: 100%; padding: 10px; ' . $bg_style);

	// Cabeçalho com nome do serviço/SLA
	$header = (new CDiv())
		->addClass('sla-single-header')
		->addStyle('text-align: center; margin-bottom: 10px;');

	if ($single_item['service_name']) {
		$header->addItem(
			(new CDiv($single_item['service_name']))
				->addStyle('font-size: 14px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')
		);
	}

	$header->addItem(
		(new CDiv($single_item['sla_name']))
			->addStyle('font-size: 11px; color: #666;')
	);

	$single_container->addItem($header);

	// Valor principal do SLI
	$sli_display = $sli_value !== null ? sprintf('%.2f%%', $sli_value) : _('N/A');
	
	$main_value = (new CDiv())
		->addClass('sla-single-main-value')
		->addStyle('text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;');

	$main_value->addItem(
		(new CDiv($sli_display))
			->addClass($status_class)
			->addStyle('font-size: 48px; font-weight: bold; color: ' . $status_color . '; line-height: 1;')
	);

	$main_value->addItem(
		(new CDiv('SLI'))
			->addStyle('font-size: 12px; color: #666; margin-top: 5px;')
	);

	$single_container->addItem($main_value);

	// Informações adicionais
	$info_container = (new CDiv())
		->addClass('sla-single-info')
		->addStyle('display: flex; justify-content: space-around; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;');

	// SLO
	if ($data['show_slo_single']) {
		$slo_value = sprintf('%.2f%%', $single_item['slo']);
		$info_container->addItem(
			(new CDiv())
				->addStyle('text-align: center;')
				->addItem([
					(new CDiv($slo_value))->addStyle('font-size: 16px; font-weight: bold; color: #9c27b0;'),
					(new CDiv('SLO'))->addStyle('font-size: 10px; color: #666;')
				])
		);
	}

	// Error Budget
	if ($data['show_error_budget'] && $single_item['error_budget'] !== null) {
		$error_budget_seconds = $single_item['error_budget'];
		$error_budget_display = formatErrorBudget($error_budget_seconds);
		$error_budget_color = $error_budget_seconds >= 0 ? '#4caf50' : '#f44336';
		
		$info_container->addItem(
			(new CDiv())
				->addStyle('text-align: center;')
				->addItem([
					(new CDiv($error_budget_display))->addStyle('font-size: 16px; font-weight: bold; color: ' . $error_budget_color . ';'),
					(new CDiv(_('Error Budget')))->addStyle('font-size: 10px; color: #666;')
				])
		);
	}

	$single_container->addItem($info_container);

	// Mini gráfico
	if ($data['show_graph_single'] && !empty($data['graph_data'])) {
		$graph_container = (new CDiv())
			->setId('sla-trend-graph-'.uniqid())
			->addClass('sla-trend-graph-container sla-single-graph')
			->addStyle('width: 100%; height: 60px; margin-top: 10px;');

		$single_container->addItem($graph_container);
	}

	$view->addItem($single_container);

	// Passar dados para o JavaScript
	if (!empty($data['graph_data'])) {
		$view->setVar('graph_data', $data['graph_data']);
		$view->setVar('slo', (float) $data['sla']['slo']);
		$view->setVar('graph_type', $data['graph_type']);
		$view->setVar('graph_period', $data['graph_period']);
		$view->setVar('threshold_warning', $data['threshold_warning']);
		$view->setVar('threshold_critical', $data['threshold_critical']);
		$view->setVar('display_mode', $data['display_mode']);
		$view->setVar('single_item', $data['single_item']);
	}
}

/**
 * Renderiza o modo Report (padrão)
 */
function renderReportMode(CWidgetView $view, array $data): void {
	$report = (new CTableInfo())->addClass(ZBX_STYLE_LIST_TABLE_STICKY_HEADER);

	if (!$data['has_serviceid']) {
		$header = [
			_x('Service', 'compact table header'),
			_x('SLO', 'compact table header')
		];

		foreach ($data['sli']['periods'] as $period) {
			$header[] = CSlaHelper::getPeriodTag((int) $data['sla']['period'], $period['period_from'], $period['period_to'],
				$data['sla']['timezone'], $data['sla']['period'] != ZBX_SLA_PERIOD_ANNUALLY
			);
		}

		$report->setHeader($header);

		$service_index = array_flip($data['sli']['serviceids']);

		$num_rows_displayed = 0;

		foreach (array_intersect_key($data['services'], $service_index) as $serviceid => $service) {
			$row = [
				(new CCol($data['has_access'][CRoleHelper::ACTIONS_MANAGE_SLA]
					? new CLink(
						$service['name'],
						(new CUrl('zabbix.php'))
							->setArgument('action', 'slareport.list')
							->setArgument('filter_slaid', $data['sla']['slaid'])
							->setArgument('filter_serviceid', $serviceid)
							->setArgument('filter_set', 1)
							->getUrl()
					)
					: $service['name']
				))->addClass(ZBX_STYLE_WORDBREAK),
				CSlaHelper::getSloTag((float) $data['sla']['slo'])
			];

			foreach (array_keys($data['sli']['periods']) as $period_index) {
				$row[] = CSlaHelper::getSliTag(
					$data['sli']['sli'][$period_index][$service_index[$serviceid]]['sli'],
					(float) $data['sla']['slo']
				);
			}

			$report->addRow($row);

			if (++$num_rows_displayed == $data['rows_per_page']) {
				break;
			}
		}

		$total = count($data['services']) > $data['search_limit']
			? $data['search_limit'].'+'
			: count($data['services']);

		if ($total > 0) {
			$report->setFooter(
				(new CCol(_s('Displaying %1$s of %2$s found', $num_rows_displayed, $total)))
					->setColSpan($report->getNumCols())
					->addClass(ZBX_STYLE_LIST_TABLE_FOOTER)
			);
		}
	}
	else {
		$report->setHeader([
			CSlaHelper::getReportNames(true)[$data['sla']['period']],
			_x('SLO', 'compact table header'),
			_x('SLI', 'compact table header'),
			_x('Uptime', 'compact table header'),
			_x('Downtime', 'compact table header'),
			_x('Error budget', 'compact table header'),
			_x('Excluded downtimes', 'compact table header')
		]);

		if ($data['sli']['serviceids']) {
			$service_index = 0;

			foreach (array_reverse($data['sli']['periods'], true) as $period_index => $period) {
				$sli = $data['sli']['sli'][$period_index][$service_index];

				$excluded_downtime_tags = [];
				foreach ($sli['excluded_downtimes'] as $excluded_downtime) {
					$excluded_downtime_tags[] = CSlaHelper::getExcludedDowntimeTag($excluded_downtime);
				}

				$report->addRow([
					CSlaHelper::getPeriodTag((int) $data['sla']['period'], $period['period_from'], $period['period_to'],
						$data['sla']['timezone']
					),
					CSlaHelper::getSloTag((float) $data['sla']['slo']),
					CSlaHelper::getSliTag($sli['sli'], (float) $data['sla']['slo']),
					CSlaHelper::getUptimeTag($sli['uptime']),
					CSlaHelper::getDowntimeTag($sli['downtime']),
					CSlaHelper::getErrorBudgetTag($sli['error_budget']),
					$excluded_downtime_tags
				]);
			}
		}
	}

	// Adicionar o gráfico de tendências se houver dados
	if (!empty($data['graph_data'])) {
		$graph_container = (new CDiv())
			->setId('sla-trend-graph-'.uniqid())
			->addClass('sla-trend-graph-container')
			->addStyle('width: 100%; height: 200px; margin-bottom: 10px;');

		$view->addItem($graph_container);
		
		// Passar dados para o JavaScript
		$view->setVar('graph_data', $data['graph_data']);
		$view->setVar('slo', (float) $data['sla']['slo']);
		$view->setVar('graph_type', $data['graph_type']);
		$view->setVar('graph_period', $data['graph_period']);
		$view->setVar('threshold_warning', $data['threshold_warning']);
		$view->setVar('threshold_critical', $data['threshold_critical']);
		$view->setVar('display_mode', $data['display_mode']);
	}

	// Adicionar a tabela de relatório
	$view->addItem($report);
}

/**
 * Formata o error budget em formato legível
 */
function formatErrorBudget(int $seconds): string {
	$abs_seconds = abs($seconds);
	$sign = $seconds < 0 ? '-' : '';
	
	if ($abs_seconds >= 86400) {
		$days = floor($abs_seconds / 86400);
		$hours = floor(($abs_seconds % 86400) / 3600);
		return $sign . $days . 'd ' . $hours . 'h';
	}
	elseif ($abs_seconds >= 3600) {
		$hours = floor($abs_seconds / 3600);
		$minutes = floor(($abs_seconds % 3600) / 60);
		return $sign . $hours . 'h ' . $minutes . 'm';
	}
	elseif ($abs_seconds >= 60) {
		$minutes = floor($abs_seconds / 60);
		$secs = $abs_seconds % 60;
		return $sign . $minutes . 'm ' . $secs . 's';
	}
	else {
		return $sign . $abs_seconds . 's';
	}
}
