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


namespace Widgets\SlaReportGraph\Actions;

use API,
	CControllerDashboardWidgetView,
	CControllerResponseData,
	CParser,
	CRangeTimeParser,
	CRoleHelper,
	CSettingsHelper,
	CTimezoneHelper,
	CWebUser,
	DateTimeZone;

use Widgets\SlaReportGraph\Includes\WidgetForm;

class WidgetView extends CControllerDashboardWidgetView {

	protected function doAction(): void {
		$data = [
			'name' => $this->getInput('name', $this->widget->getDefaultName()),
			'has_access' => [
				CRoleHelper::ACTIONS_MANAGE_SLA => $this->checkAccess(CRoleHelper::ACTIONS_MANAGE_SLA)
			],
			'has_serviceid' => (bool) $this->fields_values['serviceid'],
			'has_permissions_error' => false,
			'rows_per_page' => CWebUser::$data['rows_per_page'],
			'search_limit' => CSettingsHelper::get(CSettingsHelper::SEARCH_LIMIT),
			'user' => [
				'debug_mode' => $this->getDebugMode()
			],
			'graph_data' => [],
			// Novos campos para configuração do gráfico
			'graph_type' => $this->fields_values['graph_type'] ?? WidgetForm::GRAPH_TYPE_LINE,
			'graph_period' => $this->fields_values['graph_period'] ?? WidgetForm::GRAPH_PERIOD_30_DAYS,
			'threshold_warning' => $this->fields_values['threshold_warning'] ?? 95,
			'threshold_critical' => $this->fields_values['threshold_critical'] ?? 90
		];

		$db_slas = $this->fields_values['slaid']
			? API::Sla()->get([
				'output' => ['slaid', 'name', 'period', 'slo', 'timezone', 'status'],
				'slaids' => $this->fields_values['slaid']
			])
			: [];

		if ($db_slas) {
			$data['sla'] = $db_slas[0];

			if ($data['sla']['status'] == ZBX_SLA_STATUS_ENABLED) {
				$data['services'] = API::Service()->get([
					'output' => ['name'],
					'serviceids' => $this->fields_values['serviceid'] ?: null,
					'slaids' => $data['sla']['slaid'],
					'sortfield' => 'name',
					'sortorder' => ZBX_SORT_UP,
					'limit' => $data['search_limit'] + 1,
					'preservekeys' => true
				]);

				if ($this->fields_values['serviceid'] && !$data['services']) {
					$service_accessible = API::Service()->get([
						'output' => [],
						'serviceids' => $this->fields_values['serviceid']
					]);

					if (!$service_accessible) {
						$data['has_permissions_error'] = true;
					}
				}

				if (!$data['has_permissions_error']) {
					$timezone = new DateTimeZone($data['sla']['timezone'] !== ZBX_DEFAULT_TIMEZONE
						? $data['sla']['timezone']
						: CTimezoneHelper::getSystemTimezone()
					);

					$range_time_parser = new CRangeTimeParser();

					// Calcular período para o relatório
					if ($this->fields_values['date_period']['from'] !== ''
							&& $range_time_parser->parse($this->fields_values['date_period']['from']) == CParser::PARSE_SUCCESS) {
						$period_from = $range_time_parser->getDateTime(true, $timezone)->getTimestamp();

						if ($period_from < 0 || $period_from > ZBX_MAX_DATE) {
							$period_from = null;

							error(_s('Incorrect value for field "%1$s": %2$s.', _s('From'), _('a date is expected')));
						}
					}
					else {
						$period_from = null;
					}

					if ($this->fields_values['date_period']['to'] !== ''
							&& $range_time_parser->parse($this->fields_values['date_period']['to']) == CParser::PARSE_SUCCESS) {
						$period_to = $range_time_parser->getDateTime(false, $timezone)->getTimestamp();

						if ($period_to < 0 || $period_to > ZBX_MAX_DATE) {
							$period_to = null;

							error(_s('Incorrect value for field "%1$s": %2$s.', _s('To'), _('a date is expected')));
						}
					}
					else {
						$period_to = null;
					}

					// Calcular período para o gráfico (pode ser diferente do relatório)
					$graph_period_days = $data['graph_period'];
					
					if ($graph_period_days == WidgetForm::GRAPH_PERIOD_CUSTOM) {
						// Usar o mesmo período do relatório
						$graph_period_from = $period_from;
						$graph_period_to = $period_to;
						$graph_periods_count = $this->fields_values['show_periods'] !== '' 
							? $this->fields_values['show_periods'] 
							: ZBX_SLA_DEFAULT_REPORTING_PERIODS;
					}
					else {
						// Calcular período baseado nos dias selecionados
						$graph_period_to = time();
						$graph_period_from = strtotime("-{$graph_period_days} days");
						
						// Calcular número de períodos baseado no período do SLA
						switch ($data['sla']['period']) {
							case ZBX_SLA_PERIOD_DAILY:
								$graph_periods_count = min($graph_period_days, ZBX_SLA_MAX_REPORTING_PERIODS);
								break;
							case ZBX_SLA_PERIOD_WEEKLY:
								$graph_periods_count = min(ceil($graph_period_days / 7), ZBX_SLA_MAX_REPORTING_PERIODS);
								break;
							case ZBX_SLA_PERIOD_MONTHLY:
								$graph_periods_count = min(ceil($graph_period_days / 30), ZBX_SLA_MAX_REPORTING_PERIODS);
								break;
							case ZBX_SLA_PERIOD_QUARTERLY:
								$graph_periods_count = min(ceil($graph_period_days / 90), ZBX_SLA_MAX_REPORTING_PERIODS);
								break;
							case ZBX_SLA_PERIOD_ANNUALLY:
								$graph_periods_count = min(ceil($graph_period_days / 365), ZBX_SLA_MAX_REPORTING_PERIODS);
								break;
							default:
								$graph_periods_count = ZBX_SLA_DEFAULT_REPORTING_PERIODS;
						}
					}

					// Buscar dados para o relatório
					$data['sli'] = API::Sla()->getSli([
						'slaid' => $data['sla']['slaid'],
						'serviceids' => array_slice(array_keys($data['services']), 0, $data['rows_per_page']),
						'periods' => $this->fields_values['show_periods'] !== '' ? $this->fields_values['show_periods'] : null,
						'period_from' => $period_from,
						'period_to' => $period_to
					]);

					// Buscar dados para o gráfico (pode ter mais períodos)
					$graph_sli = API::Sla()->getSli([
						'slaid' => $data['sla']['slaid'],
						'serviceids' => array_slice(array_keys($data['services']), 0, 1), // Apenas o primeiro serviço para o gráfico
						'periods' => (int) $graph_periods_count,
						'period_from' => $graph_period_from,
						'period_to' => $graph_period_to
					]);

					// Preparar dados para o gráfico de tendências
					if (isset($graph_sli['periods']) && isset($graph_sli['sli']) && !empty($graph_sli['serviceids'])) {
						$service_index = 0;

						foreach ($graph_sli['periods'] as $period_index => $period) {
							if (isset($graph_sli['sli'][$period_index][$service_index])) {
								$sli_value = $graph_sli['sli'][$period_index][$service_index]['sli'];
								$data['graph_data'][] = [
									'clock' => (int) $period['period_from'],
									'value' => $sli_value !== null ? (float) $sli_value : 0.0,
									'period_from' => (int) $period['period_from'],
									'period_to' => (int) $period['period_to']
								];
							}
						}

						// Ordenar por timestamp
						usort($data['graph_data'], function($a, $b) {
							return $a['clock'] - $b['clock'];
						});
					}
				}
			}
		}
		else {
			$data['has_permissions_error'] = true;
		}

		$this->setResponse(new CControllerResponseData($data));
	}
}
