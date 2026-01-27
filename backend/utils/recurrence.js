/**
 * Utility para gerar ocorrências de eventos recorrentes
 * Implementa padrão RRULE simplificado
 */

const RRuleFreq = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY'
};

/**
 * Gera todas as ocorrências de um evento recorrente dentro de um intervalo de datas
 * @param {Object} event - Evento com campos recurrence_rule, recurrence_until, recurrence_count
 * @param {Date} rangeStart - Data inicial da busca
 * @param {Date} rangeEnd - Data final da busca
 * @returns {Array} Array de objetos com as ocorrências
 */
function generateRecurrences(event, rangeStart, rangeEnd) {
  if (!event.recurrence_rule) {
    return [event];
  }

  const occurrences = [];
  const rule = parseRecurrenceRule(event.recurrence_rule);
  
  let currentDate = new Date(event.start_date_time);
  const eventStartDate = new Date(event.start_date_time);
  const eventEndDate = new Date(event.end_date_time);
  const duration = eventEndDate - eventStartDate;
  
  let count = 0;
  const maxCount = event.recurrence_count || Infinity;
  const until = event.recurrence_until ? new Date(event.recurrence_until) : null;

  while (currentDate < rangeEnd) {
    // Verificar limites
    if (until && currentDate > until) break;
    if (count >= maxCount) break;
    
    // Verificar se a ocorrência está no intervalo solicitado
    const occurrenceEnd = new Date(currentDate.getTime() + duration);
    
    if (occurrenceEnd >= rangeStart && currentDate < rangeEnd) {
      // Criar cópia do evento com novas datas
      const occurrence = {
        ...event,
        id: `${event.id}_${currentDate.getTime()}`, // ID único para a ocorrência
        start_date_time: currentDate.toISOString(),
        end_date_time: occurrenceEnd.toISOString(),
        is_occurrence: true,
        original_id: event.id
      };
      occurrences.push(occurrence);
      count++;
    }

    currentDate = getNextOccurrence(currentDate, rule);
  }

  return occurrences.length > 0 ? occurrences : [event];
}

/**
 * Parse da string de recorrência
 * Formato esperado: "FREQ=DAILY;INTERVAL=1" ou "FREQ=WEEKLY;BYDAY=MO,WE"
 */
function parseRecurrenceRule(rruleString) {
  if (!rruleString) return null;

  const rule = {};
  const parts = rruleString.split(';');

  parts.forEach(part => {
    const [key, value] = part.split('=');
    rule[key] = value;
  });

  return rule;
}

/**
 * Calcula a próxima ocorrência baseado na regra de recorrência
 */
function getNextOccurrence(currentDate, rule) {
  const next = new Date(currentDate);
  const interval = parseInt(rule.INTERVAL) || 1;
  const freq = rule.FREQ;

  switch (freq) {
    case RRuleFreq.DAILY:
      next.setDate(next.getDate() + interval);
      break;

    case RRuleFreq.WEEKLY:
      const byday = rule.BYDAY ? rule.BYDAY.split(',') : [];
      if (byday.length > 0) {
        // Se BYDAY é especificado, ir para o próximo dia especificado
        next.setDate(next.getDate() + 1);
        const dayMap = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
        while (!byday.includes(getDayAbbr(next.getDay()))) {
          next.setDate(next.getDate() + 1);
        }
      } else {
        // Senão, ir 7 dias à frente
        next.setDate(next.getDate() + (7 * interval));
      }
      break;

    case RRuleFreq.MONTHLY:
      const dayOfMonth = currentDate.getDate();
      next.setMonth(next.getMonth() + interval);
      next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      break;

    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Converte número do dia para abreviação (usado em RRULE)
 */
function getDayAbbr(dayNum) {
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return days[dayNum];
}

/**
 * Cria uma string RRULE a partir de um objeto
 */
function createRRuleString(frequency, interval, byDay, until, count) {
  let rrule = `FREQ=${frequency}`;
  
  if (interval && interval > 1) {
    rrule += `;INTERVAL=${interval}`;
  }
  
  if (byDay && byDay.length > 0) {
    rrule += `;BYDAY=${byDay.join(',')}`;
  }
  
  if (until) {
    rrule += `;UNTIL=${until}`;
  }
  
  if (count) {
    rrule += `;COUNT=${count}`;
  }

  return rrule;
}

module.exports = {
  RRuleFreq,
  generateRecurrences,
  parseRecurrenceRule,
  getNextOccurrence,
  getDayAbbr,
  createRRuleString
};
