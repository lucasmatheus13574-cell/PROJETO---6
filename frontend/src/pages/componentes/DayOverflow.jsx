import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import './DayOverflow.css';

/**
 * Popup estilo Google Calendar que aparece ao clicar em "Mais X"
 * Exibe todos os eventos do dia agrupados com scroll.
 */
export default function DayOverflow({ date, events, anchorRect, onSelectEvent, onClose }) {
    const popupRef = useRef(null);

    // Fechar ao clicar fora ou pressionar Escape
    useEffect(() => {
        const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        const onMouseDown = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onMouseDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onMouseDown);
        };
    }, [onClose]);

    // Posicionamento inteligente para não sair da tela
    const getStyle = () => {
        if (!anchorRect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
        const W = window.innerWidth;
        const H = window.innerHeight;
        const POPUP_W = 280;
        const POPUP_H = 360;

        let left = anchorRect.left;
        let top = anchorRect.bottom + 6;

        if (left + POPUP_W > W - 12) left = W - POPUP_W - 12;
        if (left < 8) left = 8;
        if (top + POPUP_H > H - 12) top = anchorRect.top - POPUP_H - 6;
        if (top < 8) top = 8;

        return { top, left };
    };

    const dateLabel = date
        ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
        : '';

    const labelCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    return (
        <div className="do-overlay">
            <div className="do-popup" ref={popupRef} style={getStyle()}>
                <div className="do-header">
                    <span className="do-date-label">{labelCapitalized}</span>
                    <button className="do-close" onClick={onClose} aria-label="Fechar">×</button>
                </div>

                <div className="do-list">
                    {events.map((event, idx) => {
                        const isTask = event.tipo === 'tarefa';
                        const color = event.color || (isTask ? '#0d6efd' : '#3788d8');
                        const timeStr = event.start && event.end
                            ? `${format(event.start, 'HH:mm')} – ${format(event.end, 'HH:mm')}`
                            : '';
                        return (
                            <button
                                key={event.id ?? idx}
                                className="do-event-row"
                                onClick={() => { onSelectEvent(event); onClose(); }}
                            >
                                <span
                                    className="do-event-dot"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="do-event-info">
                                    <span className="do-event-title">{event.title}</span>
                                    {timeStr && <span className="do-event-time">{timeStr}</span>}
                                    {isTask && <span className="do-event-badge">tarefa</span>}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
