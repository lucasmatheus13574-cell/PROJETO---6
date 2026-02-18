import React, { useEffect, useRef } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import './EventPreview.css';

const priorityLabel = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
const priorityColor = { baixa: '#10b981', media: '#f59e0b', alta: '#ef4444' };

function fmtDate(val) {
    if (!val) return '';
    try {
        const d = val instanceof Date ? val : parseISO(val);
        if (!isValid(d)) return '';
        return format(d, "EEE, d 'de' MMMM", { locale: ptBR });
    } catch { return ''; }
}

function fmtTime(val) {
    if (!val) return '';
    try {
        const d = val instanceof Date ? val : parseISO(val);
        if (!isValid(d)) return '';
        return format(d, 'HH:mm');
    } catch { return ''; }
}

export default function EventPreview({ event, anchorRect, onOpenFull, onClose }) {
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const isTask = event.tipo === 'tarefa';
    const isConcluded = event.concluida === 1 || (event.raw && event.raw.concluida === 1);
    const accentColor = isTask ? (event.color || '#0d6efd') : (event.color || '#6366f1');

    // Smart positioning so the popup stays on screen
    const getStyle = () => {
        if (!anchorRect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
        const popW = 320, popH = 260;
        const vw = window.innerWidth, vh = window.innerHeight;
        let top = anchorRect.bottom + 8;
        let left = anchorRect.left;
        if (left + popW > vw - 12) left = vw - popW - 12;
        if (left < 12) left = 12;
        if (top + popH > vh - 12) top = anchorRect.top - popH - 8;
        return { top, left };
    };

    return (
        <div className="ep-overlay" onClick={onClose}>
            <div
                className="ep-popup"
                ref={ref}
                style={getStyle()}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Color strip header */}
                <div className="ep-header" style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}66)` }}>
                    <div className="ep-type-pill" style={{ background: accentColor }}>
                        {isTask ? '✓ Tarefa' : '📅 Evento'}
                    </div>
                    <button className="ep-close" onClick={onClose}>✕</button>
                </div>

                {/* Title */}
                <div className="ep-body">
                    <h3 className="ep-title" style={{ textDecoration: isConcluded ? 'line-through' : 'none' }}>
                        {event.title}
                    </h3>

                    {/* Date / time */}
                    <div className="ep-row">
                        <span className="ep-icon">🕐</span>
                        <div className="ep-info">
                            <span className="ep-date">{fmtDate(event.start)}</span>
                            {!isTask && !event.allDay && (
                                <span className="ep-time">
                                    {fmtTime(event.start)}
                                    {event.end && ` — ${fmtTime(event.end)}`}
                                </span>
                            )}
                            {event.allDay && <span className="ep-badge">Dia inteiro</span>}
                        </div>
                    </div>

                    {/* Location (events only) */}
                    {!isTask && event.location && (
                        <div className="ep-row">
                            <span className="ep-icon">📍</span>
                            <span className="ep-info">{event.location}</span>
                        </div>
                    )}

                    {/* Priority (tasks only) */}
                    {isTask && event.prioridade && (
                        <div className="ep-row">
                            <span className="ep-icon">🎯</span>
                            <span
                                className="ep-priority"
                                style={{ color: priorityColor[event.prioridade] }}
                            >
                                Prioridade {priorityLabel[event.prioridade]}
                            </span>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="ep-row">
                            <span className="ep-icon">📝</span>
                            <span className="ep-desc">{event.description}</span>
                        </div>
                    )}

                    {/* Concluded badge */}
                    {isTask && isConcluded && (
                        <div className="ep-concluded">✔ Concluída</div>
                    )}
                </div>

                {/* Footer */}
                <div className="ep-footer">
                    <button className="ep-open-btn" onClick={onOpenFull}>
                        {isTask ? '📋 Abrir tarefa' : '📅 Abrir evento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
