// asg1 Christian Reyes-Moreno
//Student ID:1866388

// ===== Shaders =====
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';


let canvas, gl;
let a_Position, u_FragColor, u_Size;

const shapesList = [];

let g_selectedSize = 10;
let g_selectedSegments = 12;
let g_mouseDown = false;

const TYPE_POINT = 0;
const TYPE_TRIANGLE = 1;
const TYPE_CIRCLE = 2;
let g_selectedType = TYPE_POINT;


let g_showPicture = false;

// ===== Point =====
class Point {
  constructor(position, color, size) {
    this.position = position;
    this.color = color;
    this.size = size;
  }

  render() {
    
    gl.disableVertexAttribArray(a_Position);
    gl.vertexAttrib3f(a_Position, this.position[0], this.position[1], 0.0);

    gl.uniform4f(
      u_FragColor,
      this.color[0], this.color[1], this.color[2], this.color[3]
    );
    gl.uniform1f(u_Size, this.size);

    gl.drawArrays(gl.POINTS, 0, 1);
  }
}


function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  return !!gl;
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) return false;

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');

  return true;
}

function addActionsForHTMLUI() {
 
  const sizeSlider = document.getElementById('sizeSlide');
  g_selectedSize = Number(sizeSlider.value);
  sizeSlider.oninput = (e) => g_selectedSize = Number(e.target.value);

  
  const segSlider = document.getElementById('segSlide');
  g_selectedSegments = Number(segSlider.value);
  segSlider.oninput = (e) => g_selectedSegments = Number(e.target.value);

  
  document.getElementById('clearButton').onclick = clearCanvas;
  document.getElementById('pointButton').onclick = () => g_selectedType = TYPE_POINT;
  document.getElementById('triButton').onclick   = () => g_selectedType = TYPE_TRIANGLE;
  document.getElementById('circleButton').onclick = () => g_selectedType = TYPE_CIRCLE;

  
  document.getElementById('pictureButton').onclick = () => {
    g_showPicture = true;
    renderAllShapes(); // force redraw so it appears immediately
  };
}

function convertCoordinatesEventToGL(ev) {
  const rect = ev.target.getBoundingClientRect();
  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);

  return [x, y];
}

function getSelectedColor() {
  return [
    document.getElementById('rSlide').value / 100,
    document.getElementById('gSlide').value / 100,
    document.getElementById('bSlide').value / 100,
    1.0
  ];
}

// PAINTIN
function addShapeAtEvent(ev) {
  const pos = convertCoordinatesEventToGL(ev);
  const color = getSelectedColor();

  if (g_selectedType === TYPE_POINT) {
    shapesList.push(new Point(pos, color, g_selectedSize));
  } else if (g_selectedType === TYPE_TRIANGLE) {
    const s = g_selectedSize / 200;
    const x = pos[0], y = pos[1];
    shapesList.push(new Triangle(color, [
      x,     y + s,
      x - s, y - s,
      x + s, y - s
    ]));
  } else if (g_selectedType === TYPE_CIRCLE) {
    shapesList.push(new Circle(pos, color, g_selectedSize, g_selectedSegments));
  }

  renderAllShapes();
}

function clearCanvas() {
  shapesList.length = 0;
  g_showPicture = false; // optional: also hide picture when clearing
  renderAllShapes();
}

// RENDERING
function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);


  for (const shape of shapesList) shape.render();

  
  if (g_showPicture) drawMyPicture();
}

// DRAWING PICTURE
function drawMyPicture() {
  const body = [1.0, 0.2, 0.2, 1.0];
  gl.uniform4f(u_FragColor, ...body);

  //FISH BODY

  // Main body (teal)
gl.uniform4f(u_FragColor, 0.0, 0.55, 0.6, 1.0);
drawTriangle([0.0, 0.0, 0.3, 0.3, 0.3, 0.0]);

// Lower body (darker teal)
gl.uniform4f(u_FragColor, 0.0, 0.40, 0.50, 1.0);
drawTriangle([0.0, 0.0, 0.3, -0.2, 0.3, 0.0]);

// Mid body (slightly lighter)
gl.uniform4f(u_FragColor, 0.1, 0.60, 0.65, 1.0);
drawTriangle([0.3, 0.0, 0.3, 0.3, 0.6, 0.0]);

// Lower mid body
gl.uniform4f(u_FragColor, 0.0, 0.45, 0.55, 1.0);
drawTriangle([0.3, 0.0, 0.6, 0.0, 0.3, -0.2]);

// Rear Upper Fin (darker fin)
gl.uniform4f(u_FragColor, 0.0, 0.35, 0.45, 1.0);
drawTriangle([0.0, 0.0, -0.3, 0.0, -0.3, 0.2]);

// Rear Lower Fin (lighter fin)
gl.uniform4f(u_FragColor, 0.2, 0.65, 0.70, 1.0);
drawTriangle([0.0, 0.0, -0.3, -0.1, -0.1, -0.1]);

// Lower flappah (belly fin)
gl.uniform4f(u_FragColor, 0.3, 0.75, 0.6, 1.0);
drawTriangle([0.2, 0.0, 0.1, -0.25, 0.25, -0.05]);

// Upper flappah (top fin)
gl.uniform4f(u_FragColor, 0.1, 0.50, 0.4, 1.0);
drawTriangle([0.2, 0.15, 0.25, 0.20, 0.15, 0.4]);

//SCENERY

  // Triangle 1 (darkest)
gl.uniform4f(u_FragColor, 0.0, 0.25, 0.0, 1.0);
drawTriangle([-1, -1,   -0.8, -1.0,   -0.89, -0.8]);

// Triangle 2
gl.uniform4f(u_FragColor, 0.0, 0.40, 0.0, 1.0);
drawTriangle([-1, -0.9,  -0.8, -0.9,   -0.89, -0.7]);

// Triangle 3
gl.uniform4f(u_FragColor, 0.0, 0.55, 0.0, 1.0);
drawTriangle([-1, -0.8,  -0.8, -0.8,   -0.89, -0.6]);

// Triangle 4 (lightest)
gl.uniform4f(u_FragColor, 0.0, 0.70, 0.0, 1.0);
drawTriangle([-1, -0.7,  -0.8, -0.7,   -0.89, -0.5]);

// ROCK

// Bottom/darker triangle (closest to edge)
gl.uniform4f(u_FragColor, 0.22, 0.22, 0.22, 1.0);
drawTriangle([0.78, -0.98,0.98, -0.98,0.90, -0.86]);

// Top/lighter triangle (adjacent)
gl.uniform4f(u_FragColor, 0.38, 0.38, 0.38, 1.0);
drawTriangle([0.78, -0.90,0.90, -0.86,0.98, -0.90]);

// ROCK


gl.uniform4f(u_FragColor, 0.22, 0.22, 0.22, 1.0);
drawTriangle([0.78, -0.98,0.98, -0.98,0.90, -0.86]);


gl.uniform4f(u_FragColor, 0.38, 0.38, 0.38, 1.0);
drawTriangle([0.78, -0.90,0.90, -0.86,0.98, -0.90]);

// CRACKS
gl.uniform4f(u_FragColor, 0.12, 0.12, 0.12, 1.0);


drawTriangle([0.86, -0.90,0.88, -0.88,0.84, -0.86]);


drawTriangle([0.92, -0.90,0.94, -0.89,0.91, -0.87]);


drawTriangle([0.82, -0.94,0.84, -0.92,0.81, -0.90]);

// FISH EYE


gl.uniform4f(u_FragColor, 0.95, 0.98, 1.0, 1.0);
drawTriangle([0.22 + .15, 0.14,  0.26 + .15, 0.14,  0.24 + .15, 0.18]);
drawTriangle([0.22 + .15, 0.14,  0.26 + .15, 0.14,  0.24 + .15, 0.10]);


gl.uniform4f(u_FragColor, 0.05, 0.05, 0.05, 1.0);
drawTriangle([0.235 + .15, 0.145,  0.245 + .15, 0.145,  0.240 + .15, 0.155]);
drawTriangle([0.235 + .15, 0.145,  0.245 + .15, 0.145,  0.240 + .15, 0.135]);


//INITIAL


gl.uniform4f(u_FragColor, 0.15, 0.35, 0.25, 1.0); // dark green-gray

// ===== Letter C =====

// left vertical bar
drawTriangle([-0.85, -0.55,  -0.83, -0.55,  -0.83, -0.75]);
drawTriangle([-0.85, -0.55,  -0.83, -0.75,  -0.85, -0.75]);

// top bar
drawTriangle([-0.85, -0.55,  -0.73, -0.55,  -0.73, -0.57]);
drawTriangle([-0.85, -0.55,  -0.73, -0.57,  -0.85, -0.57]);

// bottom bar
drawTriangle([-0.85, -0.73,  -0.73, -0.73,  -0.73, -0.75]);
drawTriangle([-0.85, -0.73,  -0.73, -0.75,  -0.85, -0.75]);


// R


gl.uniform4f(u_FragColor, 0.15, 0.35, 0.25, 1.0);

// Vertical spine
drawTriangle([-0.65, -0.55,  -0.63, -0.55,  -0.63, -0.75]);
drawTriangle([-0.65, -0.55,  -0.63, -0.75,  -0.65, -0.75]);

// Top bar
drawTriangle([-0.65, -0.55,  -0.52, -0.55,  -0.52, -0.57]);
drawTriangle([-0.65, -0.55,  -0.52, -0.57,  -0.65, -0.57]);

// Middle bar (this defines the bowl)
drawTriangle([-0.65, -0.63,  -0.54, -0.63,  -0.54, -0.65]);
drawTriangle([-0.65, -0.63,  -0.54, -0.65,  -0.65, -0.65]);

// Right vertical (bowl side)
drawTriangle([-0.54, -0.57,  -0.52, -0.57,  -0.52, -0.65]);
drawTriangle([-0.54, -0.57,  -0.52, -0.65,  -0.54, -0.65]);

// Diagonal leg (clean, starts below bowl)
drawTriangle([-0.62, -0.65,  -0.52, -0.75,  -0.55, -0.75]);
drawTriangle([-0.62, -0.65,  -0.55, -0.75,  -0.58, -0.65]);





  
}

// MAIN
function main() {
  if (!setupWebGL()) return;
  if (!connectVariablesToGLSL()) return;

  addActionsForHTMLUI();

  canvas.onmousedown = (ev) => {
    g_mouseDown = true;
    addShapeAtEvent(ev);
  };

  canvas.onmouseup = () => g_mouseDown = false;
  canvas.onmouseleave = () => g_mouseDown = false;

  canvas.onmousemove = (ev) => {
    if (g_mouseDown) addShapeAtEvent(ev);
  };

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}
