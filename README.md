# SLA Report with Graph Widget for Zabbix 7.0

Este widget é uma extensão do widget nativo "SLA Report" do Zabbix, adicionando suporte para exibição de gráficos de tendências de SLI (Service Level Indicator) ao longo do tempo.

## Funcionalidades

### Funcionalidades Base
- Exibição de relatório SLA com tabela de dados
- Visualização de SLI, SLO, Uptime, Downtime e Error Budget
- Suporte a múltiplos serviços e períodos

### Novas Funcionalidades (v2.0)

#### 1. Seletor de Tipo de Gráfico
Escolha entre três tipos de visualização:
- **Linha**: Gráfico de linha tradicional com pontos de dados
- **Barras**: Gráfico de barras verticais coloridas por status
- **Área**: Gráfico de área preenchida com linha de contorno

#### 2. Período Customizável para o Gráfico
Selecione o período de dados exibido no gráfico:
- Últimos 7 dias
- Últimos 30 dias
- Últimos 90 dias
- Últimos 365 dias
- Usar período do relatório (customizado)

#### 3. Alertas Visuais e Thresholds
Configure thresholds para alertas visuais:
- **Threshold de Warning (%)**: Valor abaixo do qual o status é "Warning" (padrão: 95%)
- **Threshold de Critical (%)**: Valor abaixo do qual o status é "Critical" (padrão: 90%)

O gráfico exibe:
- **Zona verde**: SLI acima do threshold de warning
- **Zona amarela**: SLI entre warning e critical
- **Zona vermelha**: SLI abaixo do threshold critical
- **Linha do SLO**: Linha tracejada roxa indicando o objetivo de nível de serviço
- **Pontos coloridos**: Verde (OK), Amarelo (Warning), Vermelho (Critical)

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

| Campo | Descrição |
|-------|-----------|
| SLA | Selecione o SLA a ser exibido |
| Service | (Opcional) Filtre por um serviço específico |
| Show periods | Número de períodos a exibir na tabela |
| Date period | Período de datas para o relatório |
| **Graph type** | Tipo de gráfico: Line, Bar ou Area |
| **Graph period** | Período de dados do gráfico |
| **Warning threshold** | Threshold de warning em % |
| **Critical threshold** | Threshold de critical em % |

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
    │       └── class.widget.js
    ├── includes/
    │   └── WidgetForm.php
    └── views/
        ├── widget.view.php
        ├── widget.edit.php
        └── widget.edit.js.php
```

## Changelog

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

## Licença

GNU Affero General Public License v3.0

## Autor

Baseado no widget slareport do Zabbix.
Extensão desenvolvida para adicionar funcionalidades de gráficos de tendências.
