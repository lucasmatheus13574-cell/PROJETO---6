import React, { createContext, useState } from 'react';

export const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
    const [showEvents, setShowEvents] = useState(true);
    const [showTasks, setShowTasks] = useState(true);

    const value = {
        showEvents,
        showTasks,
        setShowEvents,
        setShowTasks
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

export default FilterProvider;