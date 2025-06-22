const canvas = new fabric.Canvas('canvas', {
    width: 800,
    height: 600,
    selection: true, 
});

let currentMode = 'select';
let isDrawing = false;
let startX, startY;
let currentShape;

const selectTool = document.getElementById('select-tool');
const drawRectTool = document.getElementById('draw-rect');
const drawCircleTool = document.getElementById('draw-circle');
const drawLineTool = document.getElementById('draw-line');
const deleteBtn = document.getElementById('delete');
const toggleAnnotationsBtn = document.getElementById('toggle-annotations');
const toolbar = document.getElementById('toolbar');
const saveBtn = document.getElementById('save');
const saveModal = document.getElementById('save-modal');
const closeBtn = document.querySelector('.close-btn');
const saveDrawingBtn = document.getElementById('save-drawing-btn');
const drawingNameInput = document.getElementById('drawing-name');
const loadDrawingSelect = document.getElementById('load-drawing-select');
const loadDrawingBtn = document.getElementById('load-drawing-btn');

let annotationsVisible = true;

function setActiveTool(tool) {
    toolbar.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    if (tool) {
        tool.classList.add('active');
    }
}

selectTool.addEventListener('click', () => {
    currentMode = 'select';
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.getObjects().forEach(obj => obj.set({ selectable: true }));
    setActiveTool(selectTool);
});

drawRectTool.addEventListener('click', () => {
    currentMode = 'draw-rect';
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.getObjects().forEach(obj => obj.set({ selectable: false }));
    setActiveTool(drawRectTool);
});

drawCircleTool.addEventListener('click', () => {
    currentMode = 'draw-circle';
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.getObjects().forEach(obj => obj.set({ selectable: false }));
    setActiveTool(drawCircleTool);
});

drawLineTool.addEventListener('click', () => {
    currentMode = 'draw-line';
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.getObjects().forEach(obj => obj.set({ selectable: false }));
    setActiveTool(drawLineTool);
});

canvas.on('mouse:down', (options) => {
    if (!['draw-rect', 'draw-circle', 'draw-line'].includes(currentMode)) return;

    isDrawing = true;
    const pointer = canvas.getPointer(options.e);
    startX = pointer.x;
    startY = pointer.y;

    if (currentMode === 'draw-rect') {
        currentShape = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: 'black',
            strokeWidth: 2,
        });
        canvas.add(currentShape);
    } else if (currentMode === 'draw-circle') {
        currentShape = new fabric.Circle({
            left: startX,
            top: startY,
            radius: 0,
            fill: 'transparent',
            stroke: 'black',
            strokeWidth: 2,
        });
        canvas.add(currentShape);
    } else if (currentMode === 'draw-line') {
        currentShape = new fabric.Line([startX, startY, startX, startY], {
            stroke: 'black',
            strokeWidth: 2,
        });
        canvas.add(currentShape);
    }
});

canvas.on('mouse:move', (options) => {
    if (!isDrawing || !currentShape) return;

    const pointer = canvas.getPointer(options.e);
    const width = pointer.x - startX;
    const height = pointer.y - startY;

    if (currentMode === 'draw-rect') {
        currentShape.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width > 0 ? startX : pointer.x,
            top: height > 0 ? startY : pointer.y,
        });
        canvas.renderAll();
    } else if (currentMode === 'draw-circle') {
        const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;
        currentShape.set({
            radius: radius,
            left: startX - radius,
            top: startY - radius,
        });
        canvas.renderAll();
    } else if (currentMode === 'draw-line') {
        currentShape.set({
            x2: pointer.x,
            y2: pointer.y,
        });
        canvas.renderAll();
    }
});

canvas.on('mouse:up', (options) => {
    if (isDrawing) {
        isDrawing = false;
        
        if (currentShape) {
            addAnnotations(currentShape);
            currentShape = null;
        }

        selectTool.click();
    }
});

deleteBtn.addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.remove(activeObject);
    }
});

toggleAnnotationsBtn.addEventListener('click', () => {
    annotationsVisible = !annotationsVisible;
    canvas.forEachObject(obj => {
        if (obj.isAnnotation) {
            obj.set({ visible: annotationsVisible });
        }
        // Handle annotations inside groups
        if (obj.type === 'group') {
            obj.forEachObject(item => {
                if (item.isAnnotation) {
                    item.set({ visible: annotationsVisible });
                }
            });
        }
    });
    canvas.renderAll();
});

function addAnnotations(shape) {
    if (shape.type === 'rect') {
        const widthText = new fabric.Text(shape.width.toFixed(0), {
            left: shape.left + shape.width / 2,
            top: shape.top + shape.height,
            fontSize: 16,
            originX: 'center',
            originY: 'top',
            isAnnotation: true,
            visible: annotationsVisible,
        });

        const heightText = new fabric.Text(shape.height.toFixed(0), {
            left: shape.left - 5,
            top: shape.top + shape.height / 2,
            fontSize: 16,
            originX: 'right',
            originY: 'center',
            isAnnotation: true,
            visible: annotationsVisible,
        });

        const group = new fabric.Group([shape, widthText, heightText], {
        });

        canvas.remove(shape);
        canvas.add(group);
        
        group.on('scaling', () => {
            const scaledShape = group.item(0);
            const newWidth = scaledShape.width * group.scaleX;
            const newHeight = scaledShape.height * group.scaleY;
            
            const widthAnnotation = group.item(1);
            widthAnnotation.set({
                text: newWidth.toFixed(0),
            });

            const heightAnnotation = group.item(2);
            heightAnnotation.set({
                text: newHeight.toFixed(0),
            });
            
            canvas.renderAll();
        });
    } else if (shape.type === 'circle') {
        const radiusText = new fabric.Text(shape.radius.toFixed(0), {
            left: shape.left + shape.radius,
            top: shape.top + shape.radius,
            fontSize: 16,
            originX: 'center',
            originY: 'center',
            isAnnotation: true,
            visible: annotationsVisible,
        });

        const group = new fabric.Group([shape, radiusText]);
        canvas.remove(shape);
        canvas.add(group);

        group.on('scaling', () => {
            const scaledShape = group.item(0);
            const newRadius = scaledShape.radius * group.scaleX;
            const radiusAnnotation = group.item(1);
            radiusAnnotation.set({ text: newRadius.toFixed(0) });
            canvas.renderAll();
        });
    } else if (shape.type === 'line') {
        const length = Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2));
        const lengthText = new fabric.Text(length.toFixed(0), {
            left: (shape.x1 + shape.x2) / 2,
            top: (shape.y1 + shape.y2) / 2,
            fontSize: 16,
            isAnnotation: true,
            visible: annotationsVisible,
        });
        
        const group = new fabric.Group([shape, lengthText]);
        canvas.remove(shape);
        canvas.add(group);

        group.on('scaling', () => {
            const scaledShape = group.item(0);
            const newLength = Math.sqrt(Math.pow(scaledShape.x2 - scaledShape.x1, 2) + Math.pow(scaledShape.y2 - scaledShape.y1, 2)) * group.scaleX;
            const lengthAnnotation = group.item(1);
            lengthAnnotation.set({ text: newLength.toFixed(0) });
            canvas.renderAll();
        });
    }
}

setActiveTool(selectTool);


saveBtn.addEventListener('click', () => {
    saveModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    saveModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == saveModal) {
        saveModal.style.display = 'none';
    }
});

saveDrawingBtn.addEventListener('click', async () => {
    const name = drawingNameInput.value;
    if (!name) {
        alert('Please enter a name for the drawing.');
        return;
    }

    const data = JSON.stringify(canvas.toDatalessJSON());
    
    try {
        const response = await fetch('/api/drawings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, data }),
        });

        if (response.ok) {
            alert('Drawing saved successfully!');
            saveModal.style.display = 'none';
            drawingNameInput.value = '';
            loadDrawings();
        } else {
            alert('Failed to save drawing.');
        }
    } catch (error) {
        console.error('Error saving drawing:', error);
        alert('Error saving drawing.');
    }
});

async function loadDrawings() {
    try {
        const response = await fetch('/api/drawings');
        const { drawings } = await response.json();
        
        loadDrawingSelect.innerHTML = '<option>Load a drawing</option>';
        drawings.forEach(drawing => {
            const option = document.createElement('option');
            option.value = drawing.id;
            option.textContent = drawing.name;
            loadDrawingSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading drawings:', error);
    }
}

loadDrawingBtn.addEventListener('click', async () => {
    const drawingId = loadDrawingSelect.value;
    if (!drawingId || drawingId === 'Load a drawing') {
        alert('Please select a drawing to load.');
        return;
    }

    try {
        const response = await fetch(`/api/drawings/${drawingId}`);
        const { data } = await response.json();
        
        canvas.loadFromJSON(data, () => {
            canvas.renderAll();
        });
    } catch (error) {
        console.error('Error loading drawing:', error);
        alert('Error loading drawing.');
    }
});

loadDrawings();
