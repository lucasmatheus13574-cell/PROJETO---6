import React, { useState } from 'react';

const CustomToolbar = ({label, onView, onNavigate, views}) =>{
    const [itemText, setItemText] = useState('month');
    const viewsArray = Array.isArray(views) ? views : Object.keys(views || {});

    const handleQuickView = (view) => {
        if (onView) {
            onView(view);
            setItemText(view);
        }
    };
    return(
        <div className="toolbar-container">
            <h1 className='mesAno'>{label}</h1>
        
            <div className="dirtop">
                <div className="dropdown">
                    <button className='btn btn-secondary dropdown-toggle' type='button' id='dropdownMenuButton' data-bs-toggle="dropdown" aria-expanded="false">
                        {itemText}
                    </button>
                    <ul className='dropdown-menu' aria-labelledby='dropdownMenuButton'>
                        {viewsArray.map((view,index) =>(
                            <div key={index}>
                                <li>
                                    <button className='dropdown-item' onClick={() => { onView(view); setItemText(view); }}>{view}</button>
                                </li>
                                {index === 2 &&<hr className='dropdown-divider'></hr>}
                            </div>
                        ))}
                    </ul>
                </div>

                <div className="toolbar-navegation" style={{marginLeft: '15px', display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <div className="btn-group" role="group">
                        <button className='btn btn-outline-secondary btn-sm' onClick={() => handleQuickView('day')}>Dia</button>
                        <button className='btn btn-outline-secondary btn-sm' onClick={() => handleQuickView('week')}>Semana</button>
                        <button className='btn btn-outline-secondary btn-sm' onClick={() => handleQuickView('month')}>Mês</button>
                    </div>
                    <button className='btn btn-secondary btn-ls mr-2 border-0' onClick={() => onNavigate('TODAY')}>Hoje</button>
                    <button className='btn btn-sm mr-2 text-secondary' onClick={()=>onNavigate('PREV')} style={{ marginLeft: '15px'}}><i className="bi bi-caret-left"></i></button>
                    <button className='btn btn-sm mr-2 text-secondary' onClick={()=>onNavigate('NEXT')}><i className="bi bi-caret-right"></i></button>
                </div>
            </div>

        </div>
    )
}

export default CustomToolbar;