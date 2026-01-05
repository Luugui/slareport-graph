# Auditoria de Constantes - Widget slareport-graph

## Resumo

Este documento lista todas as constantes usadas no widget e identifica potenciais problemas.

## Constantes Usadas

### Constantes Comuns (usadas pelo widget original)
Estas constantes são usadas pelo widget original `slareport` e estão disponíveis no Zabbix 7.0:

- ✅ `ZBX_DATE` - Formato de data
- ✅ `ZBX_DEFAULT_TIMEZONE` - Timezone padrão
- ✅ `ZBX_MAX_DATE` - Data máxima permitida
- ✅ `ZBX_SLA_DEFAULT_REPORTING_PERIODS` - Número padrão de períodos de relatório
- ✅ `ZBX_SLA_MAX_REPORTING_PERIODS` - Número máximo de períodos de relatório
- ✅ `ZBX_SLA_PERIOD_ANNUALLY` - Período anual do SLA
- ✅ `ZBX_SLA_STATUS_ENABLED` - Status de SLA habilitado
- ✅ `ZBX_SORT_UP` - Ordenação ascendente
- ✅ `ZBX_STYLE_LIST_TABLE_FOOTER` - Estilo CSS para rodapé de tabela
- ✅ `ZBX_STYLE_LIST_TABLE_STICKY_HEADER` - Estilo CSS para cabeçalho fixo
- ✅ `ZBX_STYLE_WORDBREAK` - Estilo CSS para quebra de palavra

### Constantes Adicionais (usadas apenas no nosso widget)
Estas constantes foram adicionadas no nosso código mas NÃO foram encontradas no widget original:

- ⚠️ `ZBX_SLA_PERIOD_DAILY` - Período diário do SLA (linha 162 do WidgetView.php)
- ⚠️ `ZBX_SLA_PERIOD_WEEKLY` - Período semanal do SLA (linha 165 do WidgetView.php)
- ⚠️ `ZBX_SLA_PERIOD_MONTHLY` - Período mensal do SLA (linha 168 do WidgetView.php)
- ⚠️ `ZBX_SLA_PERIOD_QUARTERLY` - Período trimestral do SLA (linha 171 do WidgetView.php)

### Constante Removida (causou erro fatal)
- ❌ `ZBX_SLA_MIN_REPORTING_PERIODS` - NÃO EXISTE no Zabbix 7.0 (corrigido na v2.2.2)

## Problema Identificado

As constantes `ZBX_SLA_PERIOD_*` (exceto `ANNUALLY`) são usadas no switch/case do arquivo `WidgetView.php` (linhas 161-179) para calcular o número de períodos do gráfico baseado no tipo de período do SLA.

**Localização do código:**
```php
switch ($data['sla']['period']) {
    case ZBX_SLA_PERIOD_DAILY:
        $graph_periods_count = min($graph_period_days, ZBX_SLA_MAX_REPORTING_PERIODS);
        break;
    case ZBX_SLA_PERIOD_WEEKLY:
        $graph_periods_count = min(ceil($graph_period_days / 7), ZBX_SLA_MAX_REPORTING_PERIODS);
        break;
    // ... etc
}
```

## Status

**Risco:** MÉDIO - Se essas constantes não existirem no Zabbix 7.0, o código não causará erro fatal (pois estão em um switch/case), mas os cases nunca serão executados e sempre cairá no `default`.

**Ação Necessária:** Verificar se essas constantes existem no Zabbix 7.0 instalado ou substituir por valores numéricos hardcoded.

## Solução Proposta

Substituir as constantes por valores numéricos se elas não existirem, ou remover o switch/case e usar uma lógica diferente que não dependa dessas constantes.

**Alternativa:** Usar apenas os valores numéricos retornados pela API do SLA no campo `$data['sla']['period']` diretamente, sem comparar com constantes.
