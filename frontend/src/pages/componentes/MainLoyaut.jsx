import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';
import { FilterProvider } from '../../context/FilterContext';


function MainLayout() {
    return (
        <FilterProvider>
            <div className="layout">
                <Sidebar />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </FilterProvider>
    );
}

export default MainLayout;
