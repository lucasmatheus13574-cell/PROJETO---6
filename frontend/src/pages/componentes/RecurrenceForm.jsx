import React, { useState } from 'react';
import './RecurrenceForm.css';

export default function RecurrenceForm({ onRecurrenceChange, initialValue }) {
    const [enableRecurrence, setEnableRecurrence] = useState(!!initialValue?.rule);
    const [frequency, setFrequency] = useState(initialValue?.frequency || 'DAILY');
    const [interval, setInterval] = useState(initialValue?.interval || 1);
    const [byDay, setByDay] = useState(initialValue?.byDay || []);
    const [endType, setEndType] = useState(initialValue?.endType || 'never'); // never, date, count
    const [endDate, setEndDate] = useState(initialValue?.endDate || '');
    const [count, setCount] = useState(initialValue?.count || 1);

    const handleDayToggle = (day) => {
        const updated = byDay.includes(day)
            ? byDay.filter(d => d !== day)
            : [...byDay, day];
        setByDay(updated);
        updateRecurrence(frequency, interval, updated, endType, endDate, count);
    };

    
    const updateRecurrence = (freq, inter, days, endT, endD, cnt) => {
        if (!enableRecurrence) {
            onRecurrenceChange(null);
            return;
        }

        let rrule = `FREQ=${freq}`;

        if (inter > 1) {
            rrule += `;INTERVAL=${inter}`;
        }

        if (freq === 'WEEKLY' && days.length > 0) {
            rrule += `;BYDAY=${days.join(',')}`;
        }

        if (endT === 'date' && endD) {
            rrule += `;UNTIL=${endD}`;
        } else if (endT === 'count' && cnt) {
            rrule += `;COUNT=${cnt}`;
        }

        onRecurrenceChange({
            rule: rrule,
            frequency: freq,
            interval: inter,
            byDay: days,
            endType: endT,
            endDate: endD,
            count: cnt
        });
    };

    const handleFrequencyChange = (freq) => {
        setFrequency(freq);
        updateRecurrence(freq, interval, byDay, endType, endDate, count);
    };

    const handleIntervalChange = (value) => {
        setInterval(value);
        updateRecurrence(frequency, value, byDay, endType, endDate, count);
    };

    const handleEndTypeChange = (type) => {
        setEndType(type);
        updateRecurrence(frequency, interval, byDay, type, endDate, count);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
        updateRecurrence(frequency, interval, byDay, endType, date, count);
    };

    const handleCountChange = (value) => {
        setCount(value);
        updateRecurrence(frequency, interval, byDay, endType, endDate, value);
    };

    const handleToggleRecurrence = (checked) => {
        setEnableRecurrence(checked);
        if (!checked) {
            onRecurrenceChange(null);
        } else {
            updateRecurrence(frequency, interval, byDay, endType, endDate, count);
        }
    };

    return (
        <div className="recurrence-form">
            <div className="recurrence-toggle">
                <input
                    type="checkbox"
                    id="enableRecurrence"
                    checked={enableRecurrence}
                    onChange={(e) => handleToggleRecurrence(e.target.checked)}
                />
                <label htmlFor="enableRecurrence">
                    🔄 Evento Recorrente
                </label>
            </div>

            {enableRecurrence && (
                <>
                    <div className="form-section">
                        <h4>Frequência</h4>

                        <div className="form-group">
                            <label>Repetir:</label>
                            <select value={frequency} onChange={(e) => handleFrequencyChange(e.target.value)}>
                                <option value="DAILY">Diariamente</option>
                                <option value="WEEKLY">Semanalmente</option>
                                <option value="MONTHLY">Mensalmente</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>A cada:</label>
                            <div className="interval-input">
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={interval}
                                    onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                                />
                                <span>
                                    {frequency === 'DAILY' && `dia${interval > 1 ? 's' : ''}`}
                                    {frequency === 'WEEKLY' && `semana${interval > 1 ? 's' : ''}`}
                                    {frequency === 'MONTHLY' && `mês${interval > 1 ? 'es' : ''}`}
                                </span>
                            </div>
                        </div>

                        {frequency === 'WEEKLY' && (
                            <div className="form-group">
                                <label>Dias da semana:</label>
                                <div className="days-select">
                                    {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day, idx) => (
                                        <button
                                            key={day}
                                            onClick={() => handleDayToggle(day)}
                                            className={`day-btn ${byDay.includes(day) ? 'selected' : ''}`}
                                            title={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][idx]}
                                        >
                                            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][idx]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <h4>Quando Termina?</h4>

                        <div className="form-group">
                            <label>
                                <input
                                    type="radio"
                                    name="endType"
                                    value="never"
                                    checked={endType === 'never'}
                                    onChange={(e) => handleEndTypeChange(e.target.value)}
                                />
                                Nunca
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="radio"
                                    name="endType"
                                    value="date"
                                    checked={endType === 'date'}
                                    onChange={(e) => handleEndTypeChange(e.target.value)}
                                />
                                Em uma data específica
                            </label>
                            {endType === 'date' && (
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                    className="date-input"
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="radio"
                                    name="endType"
                                    value="count"
                                    checked={endType === 'count'}
                                    onChange={(e) => handleEndTypeChange(e.target.value)}
                                />
                                Após um número de ocorrências
                            </label>
                            {endType === 'count' && (
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={count}
                                    onChange={(e) => handleCountChange(parseInt(e.target.value))}
                                    className="count-input"
                                />
                            )}
                        </div>
                    </div>

                    <div className="recurrence-preview">
                        <strong>Resumo:</strong>
                        <p>
                            {frequency === 'DAILY' && `Repetir a cada ${interval} dia${interval > 1 ? 's' : ''}`}
                            {frequency === 'WEEKLY' && `Repetir a cada ${interval} semana${interval > 1 ? 's' : ''} ${byDay.length > 0 ? `em ${byDay.join(', ')}` : ''}`}
                            {frequency === 'MONTHLY' && `Repetir a cada ${interval} mês${interval > 1 ? 'es' : ''}`}
                            {endType === 'never' && ', sem término'}
                            {endType === 'date' && `, até ${new Date(endDate).toLocaleDateString('pt-BR')}`}
                            {endType === 'count' && `, ${count} vezes`}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
