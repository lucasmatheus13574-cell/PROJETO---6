import Sidebar from '../componentes/Sidebar';
import { Outlet } from 'react-router-dom';
import { FilterProvider } from '../../context/FilterContext';
import { CalendarProvider } from '../../context/CalendarContext';

function MainLayout() {
    return (
        <FilterProvider>
            <CalendarProvider>
                <div className="layout">
                    <Sidebar />
                    <main className="main-content">
                        <Outlet />
                    </main>
                </div>
            </CalendarProvider>
        </FilterProvider>
    );
}

export default MainLayout;
