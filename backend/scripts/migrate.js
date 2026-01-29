#!/usr/bin/env node

/**
 * Script de Migração do Banco de Dados
 * Executa as migrações SQL necessárias para suportar múltiplos calendários e recorrências
 * 
 * Uso: node scripts/migrate.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migração do banco de dados...\n');
    
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, '../migrations/001_create_calendars_and_recurrence.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationPath}`);
    }
    
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir em statements individuais
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    let statementsExecuted = 0;
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        statementsExecuted++;
        console.log(`✓ Statement ${statementsExecuted} executado`);
      } catch (err) {
        // Ignora erros de "table already exists" etc
        if (err.code === '42P07' || err.code === '42701') {
          console.log(`⚠ Tabela/índice já existe (ignorado): ${err.code}`);
        } else {
          throw err;
        }
      }
    }
    
    console.log(`\n✅ Migração concluída com sucesso! (${statementsExecuted} statements)`);
    
    // Verificar se as tabelas foram criadas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('calendars', 'event_exceptions', 'reminders')
    `;
    
    const result = await client.query(tablesQuery);
    
    console.log('\n📊 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (result.rows.length < 3) {
      console.warn('\n⚠ Nem todas as tabelas foram criadas!');
    }
    
  } catch (err) {
    console.error('\n❌ Erro durante migração:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

// Executar migração
runMigration().then(() => {
  process.exit(0);
});
