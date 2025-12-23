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


namespace Widgets\SlaReportGraph\Includes;

use API,
	CTimezoneHelper,
	DateTimeZone;

use Zabbix\Widgets\{
	CWidgetField,
	CWidgetForm
};

use Zabbix\Widgets\Fields\{
	CWidgetFieldIntegerBox,
	CWidgetFieldMultiSelectService,
	CWidgetFieldMultiSelectSla,
	CWidgetFieldSelect,
	CWidgetFieldTimePeriod
};

/**
 * SLA report with Graph widget form.
 */
class WidgetForm extends CWidgetForm {

	// Constantes para tipos de gráfico
	public const GRAPH_TYPE_LINE = 0;
	public const GRAPH_TYPE_BAR = 1;
	public const GRAPH_TYPE_AREA = 2;

	// Constantes para períodos do gráfico
	public const GRAPH_PERIOD_7_DAYS = 7;
	public const GRAPH_PERIOD_30_DAYS = 30;
	public const GRAPH_PERIOD_90_DAYS = 90;
	public const GRAPH_PERIOD_365_DAYS = 365;
	public const GRAPH_PERIOD_CUSTOM = 0;

	public function validate(bool $strict = false): array {
		/** @var CWidgetFieldMultiSelectSla $slaid_field */
		$slaid_field = $this->getFields()['slaid'];

		if ($errors = $slaid_field->validate($strict)) {
			return $errors;
		}

		$slaids = $slaid_field->getValue();

		$slas = $slaids
			? API::Sla()->get([
				'output' => ['timezone'],
				'slaids' => $slaids,
				'filter' => [
					'status' => ZBX_SLA_STATUS_ENABLED
				]
			])
			: [];

		$sla = $slas ? $slas[0] : null;

		$timezone = new DateTimeZone($sla !== null && $sla['timezone'] !== ZBX_DEFAULT_TIMEZONE
			? $sla['timezone']
			: CTimezoneHelper::getSystemTimezone()
		);

		/** @var CWidgetFieldTimePeriod $date_period_field */
		$date_period_field = $this->getFields()['date_period'];

		$date_period_field->setTimeZone($timezone);

		return parent::validate($strict);
	}

	public function addFields(): self {
		return $this
			// Campos originais do SLA Report
			->addField(
				(new CWidgetFieldMultiSelectSla('slaid', _('SLA')))
					->setFlags(CWidgetField::FLAG_NOT_EMPTY | CWidgetField::FLAG_LABEL_ASTERISK)
					->setMultiple(false)
			)
			->addField(
				(new CWidgetFieldMultiSelectService('serviceid', _('Service')))->setMultiple(false)
			)
			->addField(
				(new CWidgetFieldIntegerBox('show_periods', _('Show periods'), 1, ZBX_SLA_MAX_REPORTING_PERIODS))
					->setDefault(ZBX_SLA_DEFAULT_REPORTING_PERIODS)
			)
			->addField(
				(new CWidgetFieldTimePeriod('date_period'))
					->setDateOnly()
			)
			// Novos campos para o gráfico
			->addField(
				(new CWidgetFieldSelect('graph_type', _('Graph type'), [
					self::GRAPH_TYPE_LINE => _('Line'),
					self::GRAPH_TYPE_BAR => _('Bar'),
					self::GRAPH_TYPE_AREA => _('Area')
				]))->setDefault(self::GRAPH_TYPE_LINE)
			)
			->addField(
				(new CWidgetFieldSelect('graph_period', _('Graph period'), [
					self::GRAPH_PERIOD_7_DAYS => _('Last 7 days'),
					self::GRAPH_PERIOD_30_DAYS => _('Last 30 days'),
					self::GRAPH_PERIOD_90_DAYS => _('Last 90 days'),
					self::GRAPH_PERIOD_365_DAYS => _('Last 365 days'),
					self::GRAPH_PERIOD_CUSTOM => _('Use report period')
				]))->setDefault(self::GRAPH_PERIOD_30_DAYS)
			)
			// Campos para thresholds de alerta
			->addField(
				(new CWidgetFieldIntegerBox('threshold_warning', _('Warning threshold (%)'), 0, 100))
					->setDefault(95)
			)
			->addField(
				(new CWidgetFieldIntegerBox('threshold_critical', _('Critical threshold (%)'), 0, 100))
					->setDefault(90)
			);
	}
}
