# SLA Report with Graph Widget for Zabbix 7.0

Este widget é uma extensão do widget nativo "SLA Report" do Zabbix, adicionando suporte para exibição de gráficos de tendências de SLI (Service Level Indicator) ao longo do tempo usando **Chart.js**.

## Funcionalidades

### Funcionalidades Base
- Exibição de relatório SLA com tabela de dados
- Visualização de SLI, SLO, Uptime, Downtime e Error Budget
- Suporte a múltiplos serviços e períodos

### Novas Funcionalidades (v2.2)

#### 1. Biblioteca Chart.js
- **Gráficos profissionais**: Todos os gráficos agora são renderizados com Chart.js 4.4.1
- **Performance otimizada**: Melhor desempenho e responsividade
- **Interatividade**: Tooltips informativos, zoom e pan (quando aplicável)
- **Acessibilidade**: Melhor suporte para leitores de tela

#### 2. Opções de Exibição de Conteúdo (NOVO!)
Escolha o que exibir no modo Report:
- **Graph and table**: Exibe o gráfico de tendências e a tabela de dados (padrão)
- **Graph only**: Exibe apenas o gráfico de tendências
- **Table only**: Exibe apenas a tabela de dados SLA

#### 3. Modo de Exibição
Escolha entre dois modos de visualização:
- **Report with graph**: Exibe o relatório completo com gráfico e/ou tabela
- **Single item**: Exibe apenas o valor atual do SLI de forma destacada

#### 4. Seletor de Tipo de Gráfico
Escolha entre três tipos de visualização:
- **Line (Linha)**: Gráfico de linha tradicional com pontos de dados
- **Bar (Barras)**: Gráfico de barras verticais coloridas por status
- **Area (Área)**: Gráfico de área preenchida com linha de contorno

#### 5. Período Customizável para o Gráfico
Selecione o período de dados exibido no gráfico:
- Últimos 7 dias
- Últimos 30 dias
- Últimos 90 dias
- Últimos 365 dias
- Usar período do relatório (customizado)

#### 6. Alertas Visuais e Thresholds
Configure thresholds para alertas visuais:
- **Threshold de Warning (%)**: Valor abaixo do qual o status é "Warning" (padrão: 95%)
- **Threshold de Critical (%)**: Valor abaixo do qual o status é "Critical" (padrão: 90%)

O gráfico exibe:
- **Zona verde**: SLI acima do threshold de warning
- **Zona amarela**: SLI entre warning e critical
- **Zona vermelha**: SLI abaixo do threshold critical
- **Linha do SLO**: Linha tracejada roxa indicando o objetivo de nível de serviço
- **Pontos coloridos**: Verde (OK), Amarelo (Warning), Vermelho (Critical)

#### 7. Modo Single Item
Visualização simplificada para dashboards:
- **Valor SLI destacado**: Exibe o SLI atual em tamanho grande com cor indicativa do status
- **Mini gráfico**: Gráfico sparkline mostrando a tendência recente
- **SLO**: Exibe o objetivo de nível de serviço
- **Error Budget**: Mostra o orçamento de erro restante
- **Cor de fundo**: Personalize a cor de fundo do widget

## Instalação

### Requisitos
- Zabbix 7.0.x

### Passos

1. **Baixe o arquivo ZIP** ou clone o repositório:
   ```bash
   git clone https://github.com/Luugui/slareport-graph.git
   ```

2. **Copie a pasta do módulo** para o diretório `modules/` do seu frontend Zabbix:
   ```bash
   cd /usr/share/zabbix/
   sudo unzip /caminho/para/slareport_graph.zip -d modules/
   ```

3. **Ajuste as permissões** (se necessário):
   ```bash
   sudo chown -R www-data:www-data /usr/share/zabbix/modules/slareport_graph
   sudo chmod -R 755 /usr/share/zabbix/modules/slareport_graph
   ```

4. **Registre o módulo** no Zabbix:
   - Acesse o frontend do Zabbix
   - Vá para **Administration** > **General** > **Modules**
   - Clique em **Scan directory** para detectar o novo módulo
   - Ative o módulo **SLA report with Graph**

5. **Adicione o widget** a um dashboard e configure conforme necessário.

## Configuração do Widget

### Campos Gerais

| Campo | Descrição |
|-------|-----------|
| Display mode | Modo de exibição: Report with graph ou Single item |
| Show | (Modo Report) Graph and table, Graph only ou Table only |
| SLA | Selecione o SLA a ser exibido |
| Service | (Opcional) Filtre por um serviço específico |
| Show periods | Número de períodos a exibir na tabela |
| Date period | Período de datas para o relatório |

### Configurações do Gráfico

| Campo | Descrição | Padrão |
|-------|-----------|--------|
| Graph type | Tipo de gráfico: Line, Bar ou Area | Line |
| Graph period | Período de dados do gráfico | Last 30 days |
| Warning threshold (%) | Threshold de warning | 95 |
| Critical threshold (%) | Threshold de critical | 90 |

### Configurações do Single Item

| Campo | Descrição | Padrão |
|-------|-----------|--------|
| Show mini graph | Exibir mini gráfico de tendência | Ativado |
| Show SLO | Exibir o valor do SLO | Ativado |
| Show error budget | Exibir o error budget restante | Ativado |
| Background color | Cor de fundo do widget | Nenhuma |

## Estrutura de Arquivos

```
modules/
└── slareport_graph/
    ├── Widget.php
    ├── manifest.json
    ├── actions/
    │   └── WidgetView.php
    ├── assets/
    │   └── js/
    │       ├── chart.min.js (Chart.js 4.4.1)
    │       └── class.widget.js
    ├── includes/
    │   └── WidgetForm.php
    └── views/
        ├── widget.view.php
        ├── widget.edit.php
        └── widget.edit.js.php
```

## Changelog

### v2.2.0
- **Migração para Chart.js**: Todos os gráficos agora usam Chart.js 4.4.1
- **Opções de exibição**: Adicionado campo "Show" para escolher entre Graph+Table, Graph only ou Table only
- **Performance**: Melhor desempenho de renderização de gráficos
- **Interatividade**: Tooltips aprimorados com status (OK, Warning, Critical)
- **Responsividade**: Gráficos se adaptam automaticamente ao tamanho do widget

### v2.1.0
- Adicionado modo de exibição "Single Item" para visualização simplificada
- Mini gráfico sparkline no modo Single Item
- Exibição de SLO e Error Budget no modo Single Item
- Opção de cor de fundo personalizada
- Valor SLI destacado com cor indicativa do status

### v2.0.0
- Adicionado seletor de tipo de gráfico (Linha, Barras, Área)
- Adicionado período customizável para o gráfico
- Adicionados alertas visuais com thresholds configuráveis
- Zonas coloridas no gráfico (verde, amarelo, vermelho)
- Legenda no gráfico
- Pontos coloridos baseados nos thresholds

### v1.0.0
- Versão inicial com gráfico de linha de tendências SLI
- Baseado no widget slareport do Zabbix 7.0

## Tecnologias

- **Chart.js 4.4.1**: Biblioteca JavaScript para gráficos interativos
- **PHP 8.1+**: Backend do widget
- **Zabbix 7.0 API**: Integração com dados de SLA

## Licença

GNU Affero General Public License v3.0

## Autor

Baseado no widget slareport do Zabbix.
Extensão desenvolvida para adicionar funcionalidades de gráficos de tendências com Chart.js.

## Suporte

Para reportar bugs ou solicitar funcionalidades, abra uma issue no repositório GitHub:
https://github.com/Luugui/slareport-graph/issues
