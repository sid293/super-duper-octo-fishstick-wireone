import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

const Canvas = ({ currentMode, setCanvas }) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#fff',
        });
        fabricRef.current = canvas;
        setCanvas(canvas);

        return () => {
            canvas.dispose();
        };
    }, [setCanvas]);

    useEffect(() => {
        if (fabricRef.current) {
            fabricRef.current.isDrawingMode = false;
            fabricRef.current.selection = currentMode === 'select';
            fabricRef.current.getObjects().forEach(obj => obj.set({ selectable: currentMode === 'select' }));
        }
    }, [currentMode]);


    return (
        <div id="drawing-area">
            <div id="canvas-container">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default Canvas; 