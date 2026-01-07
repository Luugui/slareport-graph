# Implementação do Gráfico Gauge - Código-Fonte

Este documento mostra o código-fonte completo da implementação do gráfico Gauge no widget `slareport-graph`.

---

## 1. Definição das Constantes (WidgetForm.php)

```php
<?php
namespace Widgets\SlaReportGraph\Includes;

class WidgetForm extends CWidgetForm {

    // Constantes para tipos de gráfico Single Item
    public const SINGLE_GRAPH_TYPE_SPARKLINE = 0;
    public const SINGLE_GRAPH_TYPE_PIE = 1;
    public const SINGLE_GRAPH_TYPE_DOUGHNUT = 2;
    public const SINGLE_GRAPH_TYPE_GAUGE = 3;  // ← Gauge

    // ... outros códigos ...
}
```

---

## 2. Definição do Campo de Seleção (WidgetForm.php)

```php
// Campo para selecionar o tipo de gráfico Single Item
(new CWidgetFieldSelect('single_graph_type', _('Graph type'), [
    self::SINGLE_GRAPH_TYPE_SPARKLINE => _('Sparkline'),
    self::SINGLE_GRAPH_TYPE_PIE => _('Pie'),
    self::SINGLE_GRAPH_TYPE_DOUGHNUT => _('Doughnut'),
    self::SINGLE_GRAPH_TYPE_GAUGE => _('Gauge')  // ← Opção Gauge
]))
    ->setDefault(self::SINGLE_GRAPH_TYPE_SPARKLINE)
```

---

## 3. Implementação da Renderização (class.widget.js)

### 3.1. Constantes JavaScript

```javascript
class CWidgetSlaReportGraph extends CWidget {
    static SINGLE_GRAPH_TYPE_SPARKLINE = 0;
    static SINGLE_GRAPH_TYPE_PIE = 1;
    static SINGLE_GRAPH_TYPE_DOUGHNUT = 2;
    static SINGLE_GRAPH_TYPE_GAUGE = 3;  // ← Gauge
}
```

### 3.2. Lógica de Decisão de Renderização

```javascript
_renderGraph() {
    // ... código de preparação ...

    // Renderizar baseado no tipo de gráfico
    if (isSingleMode && (this._single_graph_type === CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_PIE || 
                        this._single_graph_type === CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_DOUGHNUT)) {
        this._renderPieChart(canvas);
    } else if (isSingleMode && this._single_graph_type === CWidgetSlaReportGraph.SINGLE_GRAPH_TYPE_GAUGE) {
        this._renderGaugeChart(canvas);  // ← Chama método Gauge
    } else {
        this._renderLineChart(canvas, isSingleMode);
    }
}
```

### 3.3. Método `_renderGaugeChart()` - Implementação Completa

```javascript
_renderGaugeChart(canvas) {
    // ========================================
    // PASSO 1: Calcular SLI médio
    // ========================================
    const avgSLI = this._graph_data.reduce((sum, d) => sum + d.value, 0) / this._graph_data.length;

    // ========================================
    // PASSO 2: Determinar cor baseada nos thresholds
    // ========================================
    let sliColor;
    if (avgSLI >= this._threshold_warning) {
        sliColor = '#4caf50'; // Verde - OK
    } else if (avgSLI >= this._threshold_critical) {
        sliColor = '#ffc107'; // Amarelo - Warning
    } else {
        sliColor = '#f44336'; // Vermelho - Critical
    }

    // ========================================
    // PASSO 3: Configurar o Chart.js
    // ========================================
    const chartConfig = {
        type: 'doughnut',  // Usa doughnut para simular gauge
        data: {
            labels: ['SLI', 'Restante'],
            datasets: [{
                data: [avgSLI, 100 - avgSLI],  // SLI + espaço restante
                backgroundColor: [sliColor, '#e0e0e0'],  // Cor dinâmica + cinza
                borderWidth: 0,
                circumference: 180,  // ← Semicírculo (180°)
                rotation: 270        // ← Rotação para começar embaixo
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false  // Sem legenda
                },
                tooltip: {
                    enabled: false  // Sem tooltip
                }
            }
        },
        // ========================================
        // PASSO 4: Plugin customizado para desenhar valor no centro
        // ========================================
        plugins: [{
            afterDraw: (chart) => {
                const {ctx, chartArea: {top, bottom, left, right, width, height}} = chart;
                ctx.save();
                
                // Calcular posição central
                const centerX = (left + right) / 2;
                const centerY = bottom - 10;
                
                // Desenhar o valor do SLI (grande)
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = sliColor;  // ← Usa a mesma cor do threshold
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${avgSLI.toFixed(1)}%`, centerX, centerY);
                
                // Desenhar o label "SLI" (pequeno)
                ctx.font = '10px Arial';
                ctx.fillStyle = '#666';
                ctx.fillText('SLI', centerX, centerY + 18);
                
                ctx.restore();
            }
        }]
    };

    // ========================================
    // PASSO 5: Criar a instância do Chart.js
    // ========================================
    this._chart_instance = new Chart(canvas, chartConfig);
}
```

---

## 4. Lógica de Thresholds Detalhada

### 4.1. Valores de Threshold (configuráveis pelo usuário)

```javascript
// Valores padrão (podem ser alterados na configuração do widget)
this._threshold_warning = 95;   // Warning: abaixo de 95%
this._threshold_critical = 90;  // Critical: abaixo de 90%
```

### 4.2. Lógica de Cores

```javascript
if (avgSLI >= this._threshold_warning) {
    // avgSLI >= 95%
    sliColor = '#4caf50'; // Verde - Status OK
} else if (avgSLI >= this._threshold_critical) {
    // 90% <= avgSLI < 95%
    sliColor = '#ffc107'; // Amarelo - Status Warning
} else {
    // avgSLI < 90%
    sliColor = '#f44336'; // Vermelho - Status Critical
}
```

### 4.3. Tabela de Exemplos

| SLI Médio | Threshold Warning | Threshold Critical | Cor Resultante | Status |
|-----------|-------------------|-------------------|----------------|--------|
| 98.5% | 95% | 90% | Verde (#4caf50) | OK |
| 93.2% | 95% | 90% | Amarelo (#ffc107) | Warning |
| 87.8% | 95% | 90% | Vermelho (#f44336) | Critical |
| 95.0% | 95% | 90% | Verde (#4caf50) | OK (no limite) |
| 90.0% | 95% | 90% | Amarelo (#ffc107) | Warning (no limite) |

---

## 5. Características Técnicas do Gauge

### 5.1. Semicírculo (180°)

```javascript
circumference: 180,  // Metade de um círculo completo (360°)
rotation: 270        // Rotação para começar na posição 6h (embaixo)
```

**Explicação:**
- `circumference: 180` → Define que o gráfico ocupa apenas 180° (semicírculo)
- `rotation: 270` → Rotaciona o início para a posição 270° (6h no relógio)
- Resultado: O gauge começa à esquerda (9h) e termina à direita (3h)

### 5.2. Dados do Gráfico

```javascript
data: [avgSLI, 100 - avgSLI]
```

**Exemplo:**
- Se `avgSLI = 92.5%`, então:
  - Parte colorida (SLI): 92.5%
  - Parte cinza (Restante): 7.5%
- O gráfico mostra visualmente a proporção do SLI em relação a 100%

### 5.3. Plugin Customizado

O plugin `afterDraw` desenha o texto no centro do gauge após o Chart.js renderizar o gráfico:

1. **Valor do SLI**: Fonte grande (24px), cor dinâmica, formato `XX.X%`
2. **Label "SLI"**: Fonte pequena (10px), cor cinza (#666)
3. **Posição**: Centralizado horizontalmente, próximo à base do semicírculo

---

## 6. Fluxo de Execução Completo

```
1. Usuário seleciona "Gauge" no campo "Graph type"
   ↓
2. WidgetView.php passa single_graph_type = 3 para o JavaScript
   ↓
3. JavaScript recebe os dados em processUpdateResponse()
   ↓
4. _renderGraph() detecta modo Single Item + tipo Gauge
   ↓
5. Chama _renderGaugeChart(canvas)
   ↓
6. Calcula avgSLI dos dados do gráfico
   ↓
7. Determina cor baseada em thresholds (verde/amarelo/vermelho)
   ↓
8. Cria configuração do Chart.js tipo 'doughnut' com 180°
   ↓
9. Adiciona plugin customizado para desenhar texto no centro
   ↓
10. Chart.js renderiza o gauge no canvas
   ↓
11. Plugin afterDraw desenha o valor e label no centro
```

---

## 7. Exemplo de Uso

### Configuração do Widget:
- **Display mode**: Single item
- **Graph type**: Gauge
- **Warning threshold**: 95%
- **Critical threshold**: 90%

### Dados de Entrada:
```javascript
this._graph_data = [
    {clock: 1704067200, value: 98.5},
    {clock: 1704153600, value: 97.2},
    {clock: 1704240000, value: 96.8},
    {clock: 1704326400, value: 95.5},
    {clock: 1704412800, value: 94.1}
];
```

### Cálculo:
```javascript
avgSLI = (98.5 + 97.2 + 96.8 + 95.5 + 94.1) / 5 = 96.42%
```

### Resultado:
- **Cor**: Verde (#4caf50) - pois 96.42% >= 95%
- **Texto no centro**: "96.4%"
- **Gauge**: Semicírculo verde preenchido até 96.4%

---

## 8. Vantagens da Implementação

✅ **Uso do Chart.js**: Biblioteca profissional e mantida  
✅ **Responsivo**: Se adapta ao tamanho do widget  
✅ **Cores dinâmicas**: Baseadas em thresholds configuráveis  
✅ **Plugin customizado**: Texto centralizado com boa legibilidade  
✅ **Performance**: Renderização eficiente via canvas  
✅ **Acessibilidade**: Valor numérico exibido claramente  

---

**Versão do Widget**: v2.3.0  
**Data**: Janeiro 2026  
**Biblioteca**: Chart.js 4.4.1
