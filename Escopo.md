Contexto do Projeto: Gerador de Imagens de Loteria Automatizado
1. Objetivo Principal
O objetivo deste projeto é criar uma aplicação web para automatizar a geração de imagens para redes sociais, baseadas nos resultados de sorteios de loterias (como Mega-Sena). A aplicação permitirá que um usuário faça o upload de uma imagem de fundo (template) e defina visualmente áreas (placeholders) que serão preenchidas dinamicamente com dados de uma API externa.

2. Stack Tecnológica
Framework: Next.js

Runtime: Bun.js

Backend (API): API Routes do Next.js

Frontend (UI): React (next.js)

Manipulação de Imagem (Backend): Biblioteca sharp (para alta performance)

Editor Visual de Placeholders (Frontend): Biblioteca de Canvas Fabric.js.

Cliente HTTP: fetch (nativo) ou Axios para consumir a API da loteria.

3. Fluxo de Trabalho e Funcionalidades Chave
a. Interface Visual para Criação de Templates
A funcionalidade central para o usuário será um editor visual. O fluxo será:

Upload: O usuário sobe uma imagem base (ex: template-megasena.png).

Definição de Placeholders: Sobre a imagem, o usuário poderá desenhar caixas de texto. Para cada caixa, ele definirá:

Nome do Placeholder: Um identificador único (ex: {{VALOR_PREMIO}}, {{NUM_GANHADORES}}, {{STATUS_ACUMULADO}}).

Posição e Dimensão: Coordenadas x, y, largura e altura.

Estilização do Texto: Fonte, tamanho da fonte, cor e alinhamento (centralizado, esquerda, etc.).

Salvamento: A configuração do template (imagem de fundo + um array de objetos JSON descrevendo cada placeholder) será salva no backend.

b. Processo de Geração da Imagem (Backend)
Trigger: Uma API Route (ex: POST /api/generate) será chamada, seja por um botão na UI ou por um processo agendado (cron job).

Busca de Dados: O backend fará uma requisição para a API da loteria para obter os dados mais recentes.

Endpoint de Exemplo: https://conectalot.com.br/api/resultados/megasena

Composição da Imagem:

A biblioteca sharp carregará a imagem de fundo do template.

O código irá iterar sobre a lista de placeholders salvos para aquele template.

Para cada placeholder, o valor correspondente da API será buscado (ex: valor_estimado_prox_concurso para o placeholder {{VALOR_PREMIO}}).

Usando sharp, o texto será renderizado e sobreposto na imagem base, respeitando exatamente a posição, dimensão e estilos definidos na UI.

Salvamento e Resposta: A nova imagem composta será salva no servidor (ex: /public/generated/megasena-concurso-2916.png) e sua URL será retornada na resposta da API.

4. Estrutura de Dados
Dados da API (Exemplo da Mega-Sena):

{
  "id": 2916,
  "acumulado": 1, // 1 para sim, 0 para não
  "data_proximo_concurso": "2025-09-20",
  "dezenas_sorteadas": ["16", "11", "45", "05", "27", "40"],
  "f1_ganhadores": 0,
  "valor_estimado_prox_concurso": 40000000
}

Estrutura do Template (Exemplo a ser salvo no nosso sistema):

{
  "templateId": "mega-sena-principal",
  "imageUrl": "/templates/template-megasena.png",
  "placeholders": [
    {
      "name": "{{VALOR_PREMIO}}",
      "x": 150,
      "y": 300,
      "width": 800,
      "height": 200,
      "font": "Inter Black",
      "fontSize": 180,
      "color": "#00FF00",
      "align": "center"
    },
    {
      "name": "{{STATUS_ACUMULADO}}",
      "x": 200,
      "y": 750,
      "width": 700,
      "height": 100,
      "font": "Inter Bold",
      "fontSize": 90,
      "color": "#FFFF00",
      "align": "center"
    }
  ]
}
