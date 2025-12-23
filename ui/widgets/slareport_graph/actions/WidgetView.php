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
			]
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

					$data['sli'] = API::Sla()->getSli([
						'slaid' => $data['sla']['slaid'],
						'serviceids' => array_slice(array_keys($data['services']), 0, $data['rows_per_page']),
						'periods' => $this->fields_values['show_periods'] !== '' ? $this->fields_values['show_periods'] : null,
						'period_from' => $period_from,
						'period_to' => $period_to
					]);

					// Lógica para o gráfico de tendências: buscar dados de SLI para todos os períodos
					$data['sli_history'] = API::Sla()->getSli([
						'slaid' => $data['sla']['slaid'],
						'serviceids' => array_slice(array_keys($data['services']), 0, 1), // Apenas o primeiro serviço para o gráfico
						'periods' => null, // Buscar todos os períodos
						'period_from' => $period_from,
						'period_to' => $period_to
					]);

					$data['graph_data'] = [];
					if (isset($data['sli_history']['periods']) && isset($data['sli_history']['sli'])) {
						$service_id = array_keys($data['services'])[0];
						$service_index = array_search($service_id, $data['sli_history']['serviceids']);

						foreach ($data['sli_history']['periods'] as $period_index => $period) {
							if (isset($data['sli_history']['sli'][$period_index][$service_index])) {
								$sli_value = $data['sli_history']['sli'][$period_index][$service_index]['sli'];
								$data['graph_data'][] = [
									'clock' => $period['period_from'],
									'value' => $sli_value !== null ? (float) $sli_value : 0.0
								];
							}
						}
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
