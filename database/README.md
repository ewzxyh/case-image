# 🗄️ Banco de Dados - Gerador de Imagens de Loteria

Este documento explica como configurar e usar o banco de dados PostgreSQL no Neon para o projeto de gerador de imagens de loteria.

## 🚀 Configuração Inicial

### 1. Criar conta no Neon

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string fornecida

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# URL de conexão do Neon Database
DATABASE_URL=postgresql://username:password@hostname/dbname?sslmode=require
```

### 3. Executar o schema

Execute o arquivo `database/schema.sql` no seu banco Neon:

```bash
# Via psql
psql "DATABASE_URL" -f database/schema.sql

# Ou via interface web do Neon (SQL Editor)
```

## 📊 Estrutura do Banco

### 🗂️ Tabelas Principais

#### `users` - Usuários do sistema

- **Campos**: id, email, name, avatar_url, role, is_active, last_login_at
- **Índices**: email (único), role

#### `templates` - Templates de imagem

- **Campos**: id, name, description, image_url, lottery_type, status, usage_count
- **Relacionamentos**: created_by → users.id
- **Índices**: status, lottery_type, created_by, created_at

#### `template_placeholders` - Placeholders dos templates

- **Campos**: id, template_id, name, position, dimensions, styling
- **Relacionamentos**: template_id → templates.id (CASCADE)
- **Índices**: template_id, name (único por template)

#### `lottery_draws` - Sorteios das loterias

- **Campos**: id, lottery_type, draw_number, draw_date, result_data, prize_value
- **Índices**: lottery_type + draw_number (único), draw_date

#### `generated_images` - Imagens geradas

- **Campos**: id, template_id, lottery_draw_id, image_url, file_size, generation_time
- **Relacionamentos**: template_id → templates.id, lottery_draw_id → lottery_draws.id
- **Índices**: template_id, created_at, created_by

#### `template_usage_stats` - Estatísticas de uso

- **Campos**: id, template_id, date, usage_count, average_generation_time
- **Índices**: template_id + date (único)

## 🔧 Como Usar

### Importar a configuração

```typescript
import { sql, dbHelpers } from "@/lib/database";
```

### Exemplos de uso

#### Buscar templates ativos

```typescript
const templates = await sql`
  SELECT * FROM templates
  WHERE status = 'active'
  ORDER BY created_at DESC
`;
```

#### Buscar template com placeholders

```typescript
const templateWithPlaceholders = await dbHelpers.getTemplateWithPlaceholders(
  templateId
);
```

#### Registrar uso de template

```typescript
await dbHelpers.recordTemplateUsage(templateId, generationTime);
```

#### Buscar estatísticas do dashboard

```typescript
const stats = await dbHelpers.getDashboardStats();
// Retorna: { total_templates, images_last_30_days, avg_generation_time, active_users_week }
```

## 🎯 Substituindo Dados Mockados

### 📊 Dashboard

**Antes (mockado):**

```typescript
const stats = {
  totalTemplates: 12,
  imagesGenerated: 1247,
  averageTime: 2.3,
  activeUsers: 573,
};
```

**Depois (banco real):**

```typescript
const stats = await dbHelpers.getDashboardStats();
```

### 📋 Templates

**Antes (mockado):**

```typescript
const templates = [
  { id: 1, name: "Mega-Sena Principal", usage: 1247 },
  { id: 2, name: "Lotofácil", usage: 856 },
];
```

**Depois (banco real):**

```typescript
const templates = await dbHelpers.getTemplatesWithStats();
```

### 🖼️ Imagens Geradas

**Antes (mockado):**

```typescript
const images = mockGeneratedImages;
```

**Depois (banco real):**

```typescript
const images = await dbHelpers.getGeneratedImages(templateId);
```

## 🔄 Migrações

Para fazer alterações no schema:

1. **Criar arquivo de migração** em `database/migrations/`
2. **Testar em ambiente de desenvolvimento**
3. **Aplicar no ambiente de produção**
4. **Atualizar documentação**

### Exemplo de migração:

```sql
-- Adicionar coluna de categoria aos templates
ALTER TABLE templates ADD COLUMN category VARCHAR(100);

-- Criar índice para a nova coluna
CREATE INDEX idx_templates_category ON templates(category);
```

## 📈 Monitoramento e Performance

### Índices Otimizados

- ✅ Templates por status, tipo de loteria, criador
- ✅ Placeholders por template
- ✅ Sorteios por tipo e data
- ✅ Imagens por template e data de criação
- ✅ Estatísticas por template e data

### Views para Consultas Complexas

- ✅ `dashboard_stats` - Estatísticas do dashboard
- ✅ `templates_with_stats` - Templates com estatísticas de uso

### Funções Auxiliares

- ✅ `update_template_usage()` - Atualiza estatísticas automaticamente
- ✅ Triggers para campos `updated_at`

## 🔒 Segurança

### Row Level Security (RLS)

- ✅ Usuários veem apenas seus próprios dados
- ✅ Templates públicos ou próprios
- ✅ Imagens baseadas em permissões de template

### Políticas de Segurança

```sql
-- Usuários veem apenas seu perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Templates: públicos ou próprios
CREATE POLICY "Users can view public templates or own templates" ON templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());
```

## 🚀 Próximos Passos

1. **Configurar ambiente**: Adicionar `DATABASE_URL` no Vercel
2. **Testar conexão**: Verificar se a aplicação consegue conectar
3. **Migrar dados**: Importar dados mockados para o banco
4. **Atualizar queries**: Substituir todos os dados mockados por queries reais
5. **Implementar cache**: Adicionar Redis para cache de queries frequentes

## 📝 Notas Importantes

- **Backup**: Configure backups automáticos no Neon
- **Monitoramento**: Monitore uso e performance das queries
- **Otimização**: Use `EXPLAIN ANALYZE` para otimizar queries lentas
- **Limites**: Respeite os limites do plano gratuito do Neon
- **Migrations**: Sempre teste migrations em desenvolvimento antes

---

**🎯 Status**: Schema completo criado e pronto para uso! 🚀
