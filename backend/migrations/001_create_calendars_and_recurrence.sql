-- Migration: Create tables for AdaptaTasks mission
-- Novas tabelas para suportar múltiplos calendários, eventos recorrentes e lembretes

-- Tabela de calendários (múltiplos calendários por usuário)
CREATE TABLE IF NOT EXISTS calendars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3174ad',
    is_archived BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Atualizar tabela de eventos para incluir calendar_id e campos de recorrência
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS calendar_id INTEGER;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS recurrence_until DATE;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS location TEXT;

-- Adicionar foreign key para calendar_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_eventos_calendar'
    ) THEN
        ALTER TABLE eventos 
        ADD CONSTRAINT fk_eventos_calendar 
        FOREIGN KEY(calendar_id) REFERENCES calendars(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Tabela de exceções de recorrência (datas em que um evento recorrente NÃO ocorre)
CREATE TABLE IF NOT EXISTS event_exceptions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    exception_date_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(event_id) REFERENCES eventos(id) ON DELETE CASCADE,
    UNIQUE(event_id, exception_date_time)
);

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    method VARCHAR(20) NOT NULL, -- 'email' ou 'whatsapp'
    time_offset INTEGER NOT NULL, -- em minutos antes do evento (ex: -15 para 15 min antes)
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    scheduled_job_id TEXT, -- ID do job no Agenda.js
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(event_id) REFERENCES eventos(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_eventos_calendar_id ON eventos(calendar_id);
CREATE INDEX IF NOT EXISTS idx_eventos_user_id ON eventos(user_id);
CREATE INDEX IF NOT EXISTS idx_event_exceptions_event_id ON event_exceptions(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_event_id ON reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_method ON reminders(method);

-- Criar calendário padrão para usuários existentes
INSERT INTO calendars (user_id, name, color, is_default)
SELECT id, 'Padrão', '#3174ad', TRUE 
FROM users 
WHERE id NOT IN (SELECT DISTINCT user_id FROM calendars)
ON CONFLICT DO NOTHING;
