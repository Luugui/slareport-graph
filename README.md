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

1. Baixe o arquivo `slareport_graph.zip` da pasta `modules/` deste repositório.
2. Descompacte o arquivo no diretório `modules/` do seu frontend Zabbix:

```bash
# Navegue até o diretório raiz do frontend Zabbix
cd /usr/share/zabbix/

# Descompacte o arquivo ZIP no diretório modules/
sudo unzip /caminho/para/slareport_graph.zip -d modules/
```

3. Acesse o frontend do Zabbix.
4. Vá para **Administration** > **General** > **Modules**.
5. Clique em **Scan directory** para detectar o novo módulo.
6. Ative o módulo **SLA report with Graph**.

### Opção 2: Via Git Clone

```bash
# Clone o repositório
git clone https://github.com/Luugui/slareport-graph.git

# Copie o diretório do widget para o frontend Zabbix
sudo cp -r slareport-graph/modules/slareport_graph /usr/share/zabbix/modules/
```

Em seguida, siga os passos 3-6 da Opção 1 para ativar o módulo.

## Configuração

1. Adicione o widget a um dashboard.
2. Configure o widget selecionando:
   - **SLA**: O SLA que deseja monitorar.
   - **Service** (opcional): Um serviço específico para exibir detalhes.
   - **Show periods**: Número de períodos a serem exibidos.
   - **Date period**: Período de tempo para o relatório.

## Estrutura de Arquivos

```
modules/
└── slareport_graph/
    ├── Widget.php              # Classe principal do widget
    ├── manifest.json           # Configuração do widget/módulo
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

## Solução de Problemas

### O módulo não aparece na lista de módulos

1. Verifique se o diretório `slareport_graph` está dentro de `/usr/share/zabbix/modules/`.
2. Verifique as permissões dos arquivos:
   ```bash
   sudo chown -R www-data:www-data /usr/share/zabbix/modules/slareport_graph
   sudo chmod -R 755 /usr/share/zabbix/modules/slareport_graph
   ```
3. Clique em **Scan directory** na página de módulos do Zabbix.

### Erro ao ativar o módulo

Verifique o log de erro do PHP do seu servidor web (geralmente em `/var/log/apache2/error.log` ou `/var/log/nginx/error.log`).

## Licença

Este projeto é distribuído sob a licença **GNU Affero General Public License v3.0**, a mesma licença do Zabbix.

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Autor

Desenvolvido por **Manus** com base no widget original do Zabbix.
