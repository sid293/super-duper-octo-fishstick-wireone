import React from 'react';

const Toolbar = ({
    currentMode,
    setCurrentMode,
    deleteActiveObject,
    toggleAnnotations,
    handleSave,
    loadDrawings,
    handleLoad,
    savedDrawings,
}) => {
    return (
        <div id="toolbar">
            <button
                className={currentMode === 'select' ? 'active' : ''}
                onClick={() => setCurrentMode('select')}
            >
                Select
            </button>
            <button
                className={currentMode === 'draw-rect' ? 'active' : ''}
                onClick={() => setCurrentMode('draw-rect')}
            >
                Draw Rectangle
            </button>
            <button
                className={currentMode === 'draw-circle' ? 'active' : ''}
                onClick={() => setCurrentMode('draw-circle')}
            >
                Draw Circle
            </button>
            <button
                className={currentMode === 'draw-line' ? 'active' : ''}
                onClick={() => setCurrentMode('draw-line')}
            >
                Draw Line
            </button>
            <button onClick={deleteActiveObject}>Delete</button>
            <button onClick={toggleAnnotations}>Toggle Annotations</button>
            <button onClick={handleSave}>Save</button>
            <div id="load-container">
                <select id="load-drawing-select" onChange={loadDrawings}>
                    <option>Load a drawing</option>
                    {savedDrawings.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name}
                        </option>
                    ))}
                </select>
                <button onClick={handleLoad}>Load</button>
            </div>
        </div>
    );
};

export default Toolbar; 