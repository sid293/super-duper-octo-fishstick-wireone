import React, { useState, useEffect, useRef } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import SaveModal from './components/SaveModal';
import * as fabric from 'fabric';
import './App.css';

function App() {
    const [canvas, setCanvas] = useState(null);
    const [currentMode, setCurrentMode] = useState('select');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [drawingName, setDrawingName] = useState('');
    const [savedDrawings, setSavedDrawings] = useState([]);
    const [annotationsVisible, setAnnotationsVisible] = useState(true);
    const isDrawing = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const currentShape = useRef(null);
    
    const deleteActiveObject = () => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.remove(activeObject);
        }
    };
    
    const toggleAnnotations = () => {
        setAnnotationsVisible(prev => {
            const isVisible = !prev;
            canvas.forEachObject(obj => {
                if (obj.type === 'group') {
                    obj.forEachObject(item => {
                        if (item.isAnnotation) {
                            item.set({ visible: isVisible });
                        }
                    });
                }
            });
            canvas.renderAll();
            return isVisible;
        });
    };

    const handleSave = () => {
        setShowSaveModal(true);
    };
    
    const handleActualSave = async () => {
        const data = JSON.stringify(canvas.toDatalessJSON());
        try {
            await fetch('/api/drawings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: drawingName, data }),
            });
            setShowSaveModal(false);
            loadDrawings();
        } catch (error) {
            console.error('Failed to save drawing', error);
        }
    };
    
    const loadDrawings = async () => {
        try {
            const response = await fetch('/api/drawings');
            const { drawings } = await response.json();
            setSavedDrawings(drawings);
        } catch (error) {
            console.error('Failed to load drawings', error);
        }
    };
    
    const handleLoad = async () => {
        const select = document.getElementById('load-drawing-select');
        const id = select.value;
        if (id && id !== 'Load a drawing') {
            try {
                const response = await fetch(`/api/drawings/${id}`);
                const { data } = await response.json();
                const parsedData = JSON.parse(data); // Parse the string data
                
                canvas.loadFromJSON(parsedData, canvas.renderAll.bind(canvas), (o, object) => {
                    // This is the reviver function
                    if (object.type === 'group') {
                        const shape = object.item(0);
                        if (shape.type === 'rect') {
                            object.on('scaling', () => {
                                const newWidth = shape.width * object.scaleX;
                                const newHeight = shape.height * object.scaleY;
                                object.item(1).set({ text: newWidth.toFixed(0) });
                                object.item(2).set({ text: newHeight.toFixed(0) });
                                canvas.renderAll();
                            });
                        } else if (shape.type === 'circle') {
                             object.on('scaling', () => {
                                const newRadius = shape.radius * object.scaleX;
                                object.item(1).set({ text: newRadius.toFixed(0) });
                                canvas.renderAll();
                            });
                        } else if (shape.type === 'line') {
                            object.on('scaling', () => {
                                const newLength = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1) * object.scaleX;
                                object.item(1).set({ text: newLength.toFixed(0) });
                                canvas.renderAll();
                            });
                        }
                    }
                });

            } catch (error) {
                console.error('Failed to load drawing', error);
            }
        }
    };

    useEffect(() => {
        loadDrawings();
    }, []);

    useEffect(() => {
        if (!canvas) return;

        const handleMouseDown = (options) => {
            if (!['draw-rect', 'draw-circle', 'draw-line'].includes(currentMode)) return;

            isDrawing.current = true;
            const pointer = canvas.getPointer(options.e);
            startPos.current = { x: pointer.x, y: pointer.y };
            let shape;

            if (currentMode === 'draw-rect') {
                shape = new fabric.Rect({ left: startPos.current.x, top: startPos.current.y, width: 0, height: 0, fill: 'transparent', stroke: 'black', strokeWidth: 2 });
            } else if (currentMode === 'draw-circle') {
                shape = new fabric.Circle({ left: startPos.current.x, top: startPos.current.y, radius: 0, fill: 'transparent', stroke: 'black', strokeWidth: 2 });
            } else if (currentMode === 'draw-line') {
                shape = new fabric.Line([startPos.current.x, startPos.current.y, startPos.current.x, startPos.current.y], { stroke: 'black', strokeWidth: 2 });
            }

            if (shape) {
                currentShape.current = shape;
                canvas.add(currentShape.current);
            }
        };

        const handleMouseMove = (options) => {
            if (!isDrawing.current || !currentShape.current) return;
            const pointer = canvas.getPointer(options.e);
            const { x: startX, y: startY } = startPos.current;

            if (currentMode === 'draw-rect') {
                const width = pointer.x - startX;
                const height = pointer.y - startY;
                currentShape.current.set({ width: Math.abs(width), height: Math.abs(height), left: width > 0 ? startX : pointer.x, top: height > 0 ? startY : pointer.y });
            } else if (currentMode === 'draw-circle') {
                const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)) / 2;
                currentShape.current.set({ radius, left: startX - radius, top: startY - radius });
            } else if (currentMode === 'draw-line') {
                currentShape.current.set({ x2: pointer.x, y2: pointer.y });
            }
            canvas.renderAll();
        };

        const handleMouseUp = () => {
            isDrawing.current = false;
            if (currentShape.current) {
                addAnnotations(currentShape.current);
                currentShape.current = null;
            }
            setCurrentMode('select');
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
        };
    }, [canvas, currentMode]);

    const addAnnotations = (shape) => {
        if (!canvas) return;

        if (shape.type === 'rect') {
            const widthText = new fabric.Text(shape.width.toFixed(0), {
                left: shape.left + shape.width / 2,
                top: shape.top + shape.height,
                fontSize: 16, originX: 'center', originY: 'top',
                isAnnotation: true, visible: annotationsVisible,
            });
            const heightText = new fabric.Text(shape.height.toFixed(0), {
                left: shape.left - 5,
                top: shape.top + shape.height / 2,
                fontSize: 16, originX: 'right', originY: 'center',
                isAnnotation: true, visible: annotationsVisible,
            });
            const group = new fabric.Group([shape, widthText, heightText]);
            group.on('scaling', () => {
                const scaledShape = group.item(0);
                const newWidth = scaledShape.width * group.scaleX;
                const newHeight = scaledShape.height * group.scaleY;
                group.item(1).set({ text: newWidth.toFixed(0) });
                group.item(2).set({ text: newHeight.toFixed(0) });
                canvas.renderAll();
            });
            canvas.remove(shape);
            canvas.add(group);
        } else if (shape.type === 'circle') {
            const radiusText = new fabric.Text(shape.radius.toFixed(0), {
                left: shape.left + shape.radius, top: shape.top + shape.radius,
                fontSize: 16, originX: 'center', originY: 'center',
                isAnnotation: true, visible: annotationsVisible,
            });
            const group = new fabric.Group([shape, radiusText]);
            group.on('scaling', () => {
                const newRadius = group.item(0).radius * group.scaleX;
                group.item(1).set({ text: newRadius.toFixed(0) });
                canvas.renderAll();
            });
            canvas.remove(shape);
            canvas.add(group);
        } else if (shape.type === 'line') {
            const length = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1);
            const lengthText = new fabric.Text(length.toFixed(0), {
                left: (shape.x1 + shape.x2) / 2, top: (shape.y1 + shape.y2) / 2,
                fontSize: 16, isAnnotation: true, visible: annotationsVisible,
            });
            const group = new fabric.Group([shape, lengthText]);
            group.on('scaling', () => {
                const newLength = Math.hypot(group.item(0).x2 - group.item(0).x1, group.item(0).y2 - group.item(0).y1) * group.scaleX;
                group.item(1).set({ text: newLength.toFixed(0) });
                canvas.renderAll();
            });
            canvas.remove(shape);
            canvas.add(group);
        }
    };

    return (
        <>
            <h1>Wireone BuildPlanner (React)</h1>
            <Toolbar
                currentMode={currentMode}
                setCurrentMode={setCurrentMode}
                deleteActiveObject={deleteActiveObject}
                toggleAnnotations={toggleAnnotations}
                handleSave={handleSave}
                loadDrawings={loadDrawings}
                handleLoad={handleLoad}
                savedDrawings={savedDrawings}
            />
            <Canvas setCanvas={setCanvas} currentMode={currentMode} />
            <SaveModal
                show={showSaveModal}
                handleClose={() => setShowSaveModal(false)}
                handleSave={handleActualSave}
                setName={setDrawingName}
            />
        </>
    );
}

export default App;
