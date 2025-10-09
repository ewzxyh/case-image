# Implementação do Editor Multipage com Zoom, Pan e Layers

## ✅ Funcionalidades Implementadas

### 1. Banco de Dados - Posições Normalizadas

#### Atualizações na tabela `template_placeholders`:

- ✅ Adicionadas colunas de posicionamento normalizado (ratios 0-1):
  - `x_ratio`, `y_ratio`, `width_ratio`, `height_ratio`
- ✅ Adicionadas âncoras para alinhamento:
  - `anchor_h` (left/center/right)
  - `anchor_v` (top/middle/bottom)
  - `is_background` (boolean)
- ✅ Novos campos de texto:
  - `line_height` (DECIMAL)
  - `is_static`, `hide_if_empty` (BOOLEAN)
- ✅ Ampliação de `image_position`:
  - Agora aceita: cover, contain, fill, align, **crop**, **background**

#### Trigger de Normalização:

- ✅ Função `normalize_placeholder_positions()` criada
- ✅ Conversão automática entre pixels ↔ ratios
- ✅ Tratamento especial para elementos `is_background = true`:
  - Força posição (0,0) e tamanho 100% do canvas
  - Define z_index ≤ -100 (background vai para trás)
  - Centraliza âncoras

#### Índices:

- ✅ `idx_placeholders_z_index` em `(canvas_id, z_index)`
- ✅ `idx_placeholders_background` parcial em `(canvas_id, is_background) WHERE is_background = true`

---

### 2. API - Suporte a Ratios e Novos Campos

#### `GET /api/templates/[id]`:

- ✅ Retorna `xRatio`, `yRatio`, `widthRatio`, `heightRatio`
- ✅ Retorna `anchorH`, `anchorV`, `isBackground`
- ✅ Retorna `lineHeight`, `isStatic`, `hideIfEmpty`

#### `POST /api/templates/[id]/placeholders`:

- ✅ Aceita posições em pixels OU ratios
- ✅ Campo `unit?: 'px' | 'ratio'` para indicar qual unidade está sendo usada
- ✅ Trigger do banco faz conversão automática

#### `PATCH /api/placeholders/[id]`:

- ✅ Aceita atualizações parciais de todos os novos campos
- ✅ Suporta ambos pixels e ratios simultaneamente
- ✅ Debounce implementado no frontend (400ms)

---

### 3. Editor - Componentes Criados

#### `app/editor/_components/zoom-controls.tsx`

- ✅ Controles de zoom visual (topo direito)
- ✅ Botões: Zoom In, Zoom Out, Reset (100%)
- ✅ Display do zoom atual em percentual
- ✅ Limites: 10% a 300%

#### `app/editor/_components/pages-layers-panel.tsx`

- ✅ Painel esquerdo com seção de **Páginas** e **Layers**
- ✅ Lista de páginas com botão "+ Add page"
- ✅ Lista de layers ordenada por z-index (decrescente)
- ✅ Cada layer mostra:
  - Ícone (texto ou imagem)
  - Nome
  - Botão visibilidade (olho)
  - Menu de contexto: Trazer para frente, Enviar para trás, Excluir
- ✅ Highlight do layer selecionado

#### `app/editor/_components/text-properties.tsx`

- ✅ Painel de propriedades para layers de **texto**
- ✅ Campos:
  - Conteúdo (textarea)
  - Fonte (select com 13 fontes)
  - Tamanho e Peso
  - Cor do texto (color picker + input)
  - Alinhamento de texto (left/center/right)
  - Altura da linha (slider)
  - Cor de fundo
  - **Grid 3x3 de alinhamento no canvas** (âncoras)
  - Switches: Visível, Estático, Ocultar se vazio
  - Posição e Tamanho (X, Y, Width, Height)
  - Opacidade (slider)

#### `app/editor/_components/image-properties.tsx`

- ✅ Painel de propriedades para layers de **imagem**
- ✅ Campos:
  - Botão para selecionar da Media Library (drawer)
  - URL externa (opcional)
  - **Tipo de ajuste**: Cover, Contain, Fill, Align, Crop, Background
  - Alinhamento da imagem (H/V) quando em modo Align
  - **Grid 3x3 de alinhamento no canvas** (quando não é background)
  - Switch: Visível
  - Alerta visual quando `isBackground = true`
  - Posição e Tamanho (desabilitado para background)
  - Opacidade, Borda (cor e largura), Arredondamento, Cor de fundo

#### `app/editor/_components/tools-toolbar.tsx`

- ✅ Card de ferramentas no painel direito
- ✅ Botões:
  - Adicionar Texto
  - Adicionar Imagem
  - Salvar (com indicador de status: idle/saving/saved)
  - Exportar Imagem (placeholder)
- ✅ Mensagem "Todas as alterações foram salvas"

---

### 4. Editor Principal - `app/editor/page.tsx`

#### Funcionalidades de Zoom e Pan:

- ✅ **Zoom com Ctrl + Scroll**: Zoom suave com ponto focal no cursor
- ✅ **Pan com Space ou botão do meio**: Arrastar canvas segurando espaço
- ✅ Cursor muda para "grabbing" durante pan
- ✅ Controles visuais de zoom no topo direito
- ✅ Limites de zoom: 10% a 300%

#### Sistema de Páginas (Multipage):

- ✅ Carrega template com múltiplos canvases (páginas)
- ✅ Troca de página limpa e recarrega layers do Fabric.js
- ✅ Cada página tem suas próprias dimensões e background
- ✅ Botão "+ Add page" cria nova página via API

#### Sistema de Layers:

- ✅ Lista de layers ordenada por z-index no painel esquerdo
- ✅ Seleção de layer:
  - Ao clicar no canvas (Fabric.js)
  - Ao clicar na lista de layers
- ✅ Reordenação de layers (Trazer para frente / Enviar para trás)
- ✅ Toggle de visibilidade
- ✅ Exclusão de layers
- ✅ Criação de novos layers (texto ou imagem) no centro do canvas

#### Integração Fabric.js ↔ Banco de Dados:

- ✅ Carregamento inicial de layers para o canvas
- ✅ Sincronização bidirecional:
  - Mudanças no canvas → API (debounced 400ms)
  - Mudanças no painel → Fabric.js (imediato)
- ✅ Cálculo automático de ratios ao mover/redimensionar
- ✅ Persistência de posições normalizadas

#### Propriedades Dinâmicas:

- ✅ Painel direito mostra propriedades do layer selecionado
- ✅ Switch entre `TextProperties` e `ImageProperties` automaticamente
- ✅ Atualizações em tempo real no canvas ao editar propriedades
- ✅ Debounce para salvar alterações (400ms)
- ✅ Indicador de status de salvamento (idle/saving/saved)

#### UX e Performance:

- ✅ Loading state ao carregar template
- ✅ Toasts de sucesso/erro para ações (criar, excluir, etc.)
- ✅ Redirecionamento automático se template ID não fornecido
- ✅ Canvas centralizado na área de trabalho
- ✅ Fundo cinza escuro (#neutral-800) para destacar o canvas

---

### 5. Tipos TypeScript Atualizados

#### `lib/types/database.ts`:

- ✅ Interface `TemplatePlaceholder` atualizada com todos os novos campos

#### `lib/types/api.ts`:

- ✅ `LayerResponse` com ratios e âncoras
- ✅ `CreatePlaceholderRequest` com `unit` e campos opcionais de pixels/ratios
- ✅ `UpdatePlaceholderRequest` estende `CreatePlaceholderRequest`

#### `lib/database.ts`:

- ✅ `createPlaceholder` aceita todos os novos parâmetros
- ✅ `updatePlaceholder` aceita todos os novos parâmetros

---

## 🎯 Compatibilidade com DynaPictures

A implementação segue o modelo do DynaPictures:

- ✅ **Image Templates** com múltiplos canvases (páginas)
- ✅ **Editor** dedicado para cada template
- ✅ **Layers** (placeholders) com posicionamento normalizado
- ✅ **Media Library** para gerenciar assets
- ✅ **Gallery** para imagens geradas
- ✅ **Zoom e Pan** para navegação confortável
- ✅ **Painel de Páginas & Layers** para organização
- ✅ **Propriedades por tipo** (texto vs imagem)
- ✅ **Placement types** incluindo Background

---

## 📋 Próximos Passos (Opcional)

1. **Integração completa da Media Library** no ImageProperties

   - Seleção de imagens do banco
   - Preview de thumbnails
   - Upload direto do drawer

2. **Implementação do `lib/generator.ts`**

   - Renderizar páginas usando Sharp
   - Aplicar layers com base em ratios
   - Suportar placement types (cover, contain, background, etc.)
   - Gerar imagens finais

3. **Endpoint `POST /api/generate`**

   - Receber template_id e dados dinâmicos
   - Chamar generator.ts
   - Salvar em `generated_images`
   - Retornar URLs das imagens geradas

4. **Undo/Redo**

   - Histórico de ações no frontend
   - Stack de comandos (Command pattern)
   - Atalhos: Ctrl+Z, Ctrl+Y

5. **Snapping e Guias**

   - Snapping à borda e centro do canvas
   - Linhas guia dinâmicas
   - Grid opcional

6. **Validação com Zod**

   - Schemas para CreatePlaceholderRequest
   - Schemas para UpdatePlaceholderRequest
   - Validação de ratios (0-1)

7. **Testes**
   - Testes unitários para trigger de normalização
   - Testes de integração para APIs
   - Testes E2E para o editor

---

## 🔧 Dependências Instaladas

```bash
bun add fabric
bun add @types/fabric
```

---

## 📝 Notas de Implementação

### Trigger de Normalização

O trigger `normalize_placeholder_positions()` é executado **BEFORE INSERT OR UPDATE** e:

1. Busca dimensões do canvas pai
2. Se recebeu pixels mas não ratios → calcula ratios
3. Se recebeu ratios → recalcula pixels
4. Se `is_background = true` → força posição/tamanho para preencher canvas inteiro
5. Clamp de ratios entre 0 e 1

### Debounce de Salvamento

- Evita múltiplas requisições durante drag contínuo
- Timer de 400ms (resetado a cada modificação)
- Status visual: idle → saving → saved (2s) → idle

### Fabric.js

- Cada objeto no canvas tem propriedade customizada `layerId`
- Mapeamento entre objetos Fabric e layers do banco
- Eventos: `selection:created`, `object:modified`, `mouse:wheel`

### Navegação

- Página `/templates` → clique no card → redireciona para `/editor?template=<id>`
- Editor carrega template, canvases e placeholders via `GET /api/templates/[id]`
- Sidebar global não aparece no editor (full screen experience)

---

## 🎨 UI/UX

### Layout

- **Esquerda**: Painel de Páginas & Layers (264px fixo)
- **Centro**: Canvas com zoom controls
- **Direita**: Ferramentas e Propriedades (320px fixo)
- **Topo**: Header com nome do template e página ativa

### Cores e Estados

- Layer selecionado: `ring-2 ring-primary`
- Canvas background: `#neutral-800`
- Botões de alinhamento 3x3: Grid visual com dots
- Status de salvamento: cores semânticas (muted → warning → success)

### Responsividade

- ScrollArea nos painéis laterais para muitos layers/páginas
- Canvas centralizado e responsivo ao zoom
- Painéis de propriedades com scroll independente

---

## ✅ Checklist de Implementação

- [x] Atualizar schema do banco com ratios e novos campos
- [x] Criar trigger de normalização
- [x] Atualizar tipos TypeScript
- [x] Atualizar APIs (GET, POST, PATCH)
- [x] Criar componente ZoomControls
- [x] Criar componente PagesLayersPanel
- [x] Criar componente TextProperties
- [x] Criar componente ImageProperties
- [x] Criar componente ToolsToolbar
- [x] Implementar editor principal com Fabric.js
- [x] Integrar zoom e pan
- [x] Integrar sistema de páginas
- [x] Integrar sistema de layers
- [x] Sincronização Fabric ↔ DB
- [x] Debounce e status de salvamento
- [x] Testar compilação TypeScript

---

## 🚀 Como Usar

1. **Acessar Templates**: Navegar para `/templates`
2. **Criar ou Selecionar Template**: Clique em um template existente ou crie novo
3. **Editor Abre**: Com a primeira página (canvas) carregada
4. **Adicionar Elementos**:
   - Clique "Adicionar Texto" ou "Adicionar Imagem"
   - Elementos aparecem no centro do canvas
5. **Editar no Canvas**:
   - Arrastar para mover
   - Cantos para redimensionar
   - Mudanças são salvas automaticamente (debounced)
6. **Editar Propriedades**:
   - Selecione um layer (canvas ou lista lateral)
   - Painel direito mostra propriedades
   - Edite e veja mudanças em tempo real
7. **Zoom e Pan**:
   - Ctrl + Scroll para zoom
   - Space + Drag para pan
   - Botões no topo direito
8. **Múltiplas Páginas**:
   - Clique "+ Add page" para criar nova página
   - Troque entre páginas na lista
   - Cada página tem seus próprios layers

---

**Status**: ✅ Implementação Completa Conforme Plano
