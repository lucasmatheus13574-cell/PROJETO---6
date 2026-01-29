/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import api from '../pages/componentes/LembrestesAPI';

export const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [showYearView, setShowYearView] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    
    
    // Novo: Estado para múltiplos calendários
    const [calendars, setCalendars] = useState([]);
    const [activeCalendarId, setActiveCalendarId] = useState(null);
    const [visibleCalendars, setVisibleCalendars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Carregar calendários do usuário
    useEffect(() => {
        fetchCalendars();
    }, []);

    const fetchCalendars = async () => {
        try {
            setLoading(true);
            const response = await api.get('/calendars');
            setCalendars(response.data);
            setVisibleCalendars(response.data.map(cal => cal.id));
            
            // Definir primeiro calendário como ativo
            if (response.data.length > 0) {
                setActiveCalendarId(response.data[0].id);
            }
            setError(null);
        } catch (err) {
            console.error('Erro ao buscar calendários:', err);
            setError('Erro ao carregar calendários');
        } finally {
            setLoading(false);
        }
    };

    const createCalendar = async (name, color) => {
        try {
            const response = await api.post('/calendars', { name, color });
            setCalendars([...calendars, response.data]);
            setVisibleCalendars([...visibleCalendars, response.data.id]);
            return response.data;
        } catch (err) {
            console.error('Erro ao criar calendário:', err);
            throw err;
        }
    };

    const updateCalendar = async (calendarId, updates) => {
        try {
            const response = await api.put(`/calendars/${calendarId}`, updates);
            setCalendars(calendars.map(cal => cal.id === calendarId ? response.data : cal));
            return response.data;
        } catch (err) {
            console.error('Erro ao atualizar calendário:', err);
            throw err;
        }
    };

    const deleteCalendar = async (calendarId) => {
        try {
            await api.delete(`/calendars/${calendarId}`);
            setCalendars(calendars.filter(cal => cal.id !== calendarId));
            setVisibleCalendars(visibleCalendars.filter(id => id !== calendarId));
            if (activeCalendarId === calendarId && calendars.length > 1) {
                setActiveCalendarId(calendars[0].id);
            }
        } catch (err) {
            console.error('Erro ao deletar calendário:', err);
            throw err;
        }
    };

    const toggleCalendarVisibility = (calendarId) => {
        if (visibleCalendars.includes(calendarId)) {
            setVisibleCalendars(visibleCalendars.filter(id => id !== calendarId));
        } else {
            setVisibleCalendars([...visibleCalendars, calendarId]);
        }
    };

    const value = {
        currentDate,
        setCurrentDate,
        view,
        setView,
        showYearView,
        setShowYearView,
        year,
        setYear,
        calendars,
        activeCalendarId,
        setActiveCalendarId,
        visibleCalendars,
        toggleCalendarVisibility,
        createCalendar,
        updateCalendar,
        deleteCalendar,
        fetchCalendars,
        loading,
        error
    };

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
};

export default CalendarProvider;