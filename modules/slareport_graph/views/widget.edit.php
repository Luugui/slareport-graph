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
 * SLA report with Graph widget form view.
 *
 * @var CView $this
 * @var array $data
 */

(new CWidgetFormView($data))
	// Modo de exibição
	->addField(
		new CWidgetFieldSelectView($data['fields']['display_mode'])
	)
	// Campos originais do SLA Report
	->addField(
		new CWidgetFieldMultiSelectSlaView($data['fields']['slaid'])
	)
	->addField(
		new CWidgetFieldMultiSelectServiceView($data['fields']['serviceid'])
	)
	->addField(
		new CWidgetFieldIntegerBoxView($data['fields']['show_periods'])
	)
	->addField(
		(new CWidgetFieldTimePeriodView($data['fields']['date_period']))
			->setDateFormat(ZBX_DATE)
			->setFromPlaceholder(_('YYYY-MM-DD'))
			->setToPlaceholder(_('YYYY-MM-DD'))
	)
	// Configurações do gráfico
	->addFieldsGroup(
		getGraphFieldsGroupView($data['fields'])
	)
	// Configurações do Single Item
	->addFieldsGroup(
		getSingleItemFieldsGroupView($data['fields'])
	)
	->includeJsFile('widget.edit.js.php')
	->addJavaScript('widget_slareport_graph_form.init('.json_encode([
		'serviceid_field_id' => $data['fields']['serviceid']->getName()
	], JSON_THROW_ON_ERROR).');')
	->show();

function getGraphFieldsGroupView(array $fields): CWidgetFieldsGroupView {
	return (new CWidgetFieldsGroupView(_('Graph settings')))
		->addField(
			new CWidgetFieldSelectView($fields['graph_type'])
		)
		->addField(
			new CWidgetFieldSelectView($fields['graph_period'])
		)
		->addField(
			new CWidgetFieldIntegerBoxView($fields['threshold_warning'])
		)
		->addField(
			new CWidgetFieldIntegerBoxView($fields['threshold_critical'])
		);
}

function getSingleItemFieldsGroupView(array $fields): CWidgetFieldsGroupView {
	return (new CWidgetFieldsGroupView(_('Single item settings')))
		->addField(
			new CWidgetFieldCheckBoxView($fields['show_graph_single'])
		)
		->addField(
			new CWidgetFieldCheckBoxView($fields['show_slo_single'])
		)
		->addField(
			new CWidgetFieldCheckBoxView($fields['show_error_budget'])
		)
		->addField(
			new CWidgetFieldColorView($fields['bg_color'])
		);
}
