# SLA Report with Graph Widget for Zabbix 7.0

Este widget é uma variação do widget nativo **SLA report** do Zabbix, adicionando suporte para exibição de **gráficos de tendências** da disponibilidade de serviços SLA ao longo do tempo.

## Funcionalidades

- **Tabela de Relatório SLA**: Exibe os mesmos dados do widget original (SLO, SLI, Uptime, Downtime, Error Budget, etc.).
- **Gráfico de Tendências SLI**: Exibe um gráfico SVG interativo mostrando a evolução do SLI (Service Level Indicator) ao longo do tempo.
- **Linha de Referência SLO**: O gráfico inclui uma linha tracejada indicando o objetivo de nível de serviço (SLO).
- **Indicadores Visuais**: Pontos no gráfico são coloridos em verde (acima do SLO) ou vermelho (abaixo do SLO).
- **Tooltips**: Ao passar o mouse sobre os pontos, são exibidas informações detalhadas (data e valor do SLI).

## Requisitos

- **Zabbix 7.0.x** (testado com 7.0.10)
- SLA e Serviços configurados no Zabbix

## Instalação

### Opção 1: Via arquivo ZIP

1. Baixe o arquivo `slareport-graph.zip` da pasta `ui/widgets/` deste repositório.
2. Descompacte o arquivo no diretório `ui/widgets/` do seu frontend Zabbix:

```bash
# Navegue até o diretório raiz do frontend Zabbix
cd /usr/share/zabbix/

# Descompacte o arquivo ZIP
sudo unzip /caminho/para/slareport-graph.zip -d ui/widgets/
```

3. Limpe o cache do frontend Zabbix (se necessário).

### Opção 2: Via Git Clone

```bash
# Clone o repositório
git clone https://github.com/Luugui/slareport-graph.git

# Copie o diretório do widget para o frontend Zabbix
sudo cp -r slareport-graph/ui/widgets/slareport_graph /usr/share/zabbix/ui/widgets/
```

## Configuração

1. Acesse o frontend do Zabbix.
2. Vá para **Administration** > **General** > **Modules**.
3. Ative o módulo **SLA report with Graph**.
4. Adicione o widget a um dashboard.
5. Configure o widget selecionando:
   - **SLA**: O SLA que deseja monitorar.
   - **Service** (opcional): Um serviço específico para exibir detalhes.
   - **Show periods**: Número de períodos a serem exibidos.
   - **Date period**: Período de tempo para o relatório.

## Estrutura de Arquivos

```
slareport_graph/
├── Widget.php              # Classe principal do widget
├── manifest.json           # Configuração do widget
├── actions/
│   └── WidgetView.php      # Controller para a visualização
├── assets/
│   └── js/
│       └── class.widget.js # JavaScript para renderização do gráfico SVG
├── includes/
│   └── WidgetForm.php      # Formulário de configuração do widget
└── views/
    ├── widget.view.php     # View principal do widget
    ├── widget.edit.php     # View de edição do widget
    └── widget.edit.js.php  # JavaScript para o formulário de edição
```

## Licença

Este projeto é distribuído sob a licença **GNU Affero General Public License v3.0**, a mesma licença do Zabbix.

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Autor

Desenvolvido por **Manus** com base no widget original do Zabbix.
