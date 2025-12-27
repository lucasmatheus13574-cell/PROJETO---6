import React, { createContext, useState } from 'react';
import moment from 'moment';

export const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
    const [currentDate, setCurrentDate] = useState(moment().toDate());
    const [view, setView] = useState('month');
    const [showYearView, setShowYearView] = useState(false);
    const [year, setYear] = useState(moment().year());

    return (
        <CalendarContext.Provider value={{ currentDate, setCurrentDate, view, setView, showYearView, setShowYearView, year, setYear }}>
            {children}
        </CalendarContext.Provider>
    );
};

export default CalendarProvider;