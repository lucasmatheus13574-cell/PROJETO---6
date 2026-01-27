# Scripts Auxiliares

Este diretório contém scripts para manutenção, testes e setup do AdaptaTasks.

## Scripts Disponíveis

### `migrate.js`
Executa as migrações do banco de dados necessárias para criar tabelas de calendários, exceções e lembretes.

**Uso:**
```bash
node scripts/migrate.js
```

**O que faz:**
- Lê o arquivo de migração SQL
- Executa statements SQL no banco PostgreSQL
- Valida que todas as tabelas foram criadas corretamente
- Exibe relatório de sucesso/falha

**Pré-requisitos:**
- PostgreSQL rodando
- `DATABASE_URL` configurada em `.env`

---

### `test.js`
Script de teste automatizado que valida todos os endpoints e funcionalidades principais do sistema.

**Uso:**
```bash
node scripts/test.js
```

**O que testa:**
1. **Autenticação**
   - Registrar novo usuário
   - Login e obtenção de token

2. **Calendários**
   - Listar calendários
   - Criar novo calendário
   - Atualizar calendário
   - Deletar calendário

3. **Eventos**
   - Criar evento simples
   - Listar eventos em intervalo
   - Atualizar evento

4. **Eventos Recorrentes**
   - Criar evento recorrente (DAILY)
   - Verificar expansão de múltiplas ocorrências
   - Deletar evento recorrente

5. **Lembretes**
   - Criar evento com lembrete
   - Adicionar lembrete por e-mail
   - Listar lembretes
   - Deletar lembrete

**Pré-requisitos:**
- Backend rodando em `http://localhost:3000`
- `VITE_API_URL` configurada (padrão: http://localhost:3000)
- Node.js com `axios` instalado

**Interpretando Resultados:**
```
✓ = Teste passou
✗ = Teste falhou
⚠ = Aviso (funcionalidade parcial)

Exemplo:
✓ Passed: 18
✗ Failed: 2
Total: 20
```

---

## Uso em Desenvolvimento

### Setup Inicial
```bash
# 1. Instalar dependências
cd backend && npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env com suas configurações

# 3. Executar migração
node scripts/migrate.js

# 4. Iniciar backend
npm start
```

### Executar Testes
```bash
# Em outro terminal
cd backend
node scripts/test.js
```

### Verificar Banco de Dados
```bash
# Conectar ao PostgreSQL
psql -U seu_usuario -d seu_banco

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d calendars

# Listar calendários do usuário
SELECT * FROM calendars;
```

---

## Troubleshooting

### "DATABASE_URL não encontrada"
- Verificar se `.env` existe na raiz de `backend/`
- Confirmar que `DATABASE_URL` está definida

### "Could not connect to database"
- PostgreSQL não está rodando
- String de conexão está incorreta
- Usuário/senha não tem permissões

### "API is not responding"
- Backend não está rodando (`npm start`)
- Porta 3000 está em uso
- `VITE_API_URL` aponta para endpoint errado

### "Migração falha com erro de sintaxe"
- Arquivo SQL está corrupto
- Verificar: `cat migrations/001_create_calendars_and_recurrence.sql`
- Tentar executar manualmente no psql para mais detalhes

---

## Exemplos Avançados

### Executar Teste Específico Manualmente
```bash
# Testar apenas autenticação
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'
```

### Monitorar Logs do Backend
```bash
# Terminal 1
cd backend
DEBUG=* npm start

# Terminal 2
node scripts/test.js  # Testes aparecerão nos logs
```

### Resetar Banco de Dados
```bash
# ⚠ CUIDADO: Isto deletará TODOS os dados
psql -U seu_usuario -d seu_banco -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Depois, re-executar migração
node scripts/migrate.js
```

---

## Contribuindo

Ao adicionar novo endpoint ou funcionalidade, adicione testes correspondentes no `test.js`:

```javascript
await test('Minha nova funcionalidade', async () => {
  const res = await axios.post(`${BASE_URL}/seu-endpoint`, dados, { headers });
  if (!res.data.esperado) {
    throw new Error('Validação falhou');
  }
});
```
