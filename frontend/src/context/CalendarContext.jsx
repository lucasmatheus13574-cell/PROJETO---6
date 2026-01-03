/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from 'react';

export const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [showYearView, setShowYearView] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());

    return (
        <CalendarContext.Provider value={{ currentDate, setCurrentDate, view, setView, showYearView, setShowYearView, year, setYear }}>
            {children}
        </CalendarContext.Provider>
    );
};

export default CalendarProvider;