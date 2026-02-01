// Vertex shader program
var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_GlobalRotation;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '    gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;\n' +
    '    v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE = 
    'precision mediump float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '    gl_FragColor = v_Color;\n' +
    '}\n';

// Global variables
var gl;
var canvas;
var u_GlobalRotation;
var u_ModelMatrix;

// Joint angle variables
var g_globalRotation = 30;
var g_tailFan = 60;
var g_feather1 = 0;
var g_feather2 = 0;
var g_neckBend = 10;
var g_headTilt = 0;
var g_rightLeg = 0;

// Animation variables
var g_animating = false;
var g_time = 0;
var g_animationId = null;

// Performance tracking variables
var g_frameCount = 0;
var g_lastFpsUpdate = 0;
var g_fps = 0;
var g_frameTime = 0;
var g_drawCalls = 0;
var g_totalVertices = 0;
var g_lastFrameTime = 0;

function main() {
    console.log("main() called");
    
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }
    console.log("Canvas found");

    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    console.log("WebGL context obtained");

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }
    console.log("Shaders initialized");

    // Get the storage locations of uniform variables
    u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    
    if (!u_GlobalRotation || !u_ModelMatrix) {
        console.log('Failed to get the storage location of uniform variables');
        console.log('u_GlobalRotation:', u_GlobalRotation);
        console.log('u_ModelMatrix:', u_ModelMatrix);
        return;
    }
    console.log("Uniform locations retrieved");

    // Enable depth test
    gl.enable(gl.DEPTH_TEST);

    // Set clear color
    gl.clearColor(0.95, 0.97, 1.0, 1.0);

    // Set up UI event handlers
    setupUI();
    console.log("UI setup complete");

    // Initialize performance tracking
    g_lastFpsUpdate = Date.now();
    g_lastFrameTime = Date.now();

    // Draw the scene
    renderScene();
    console.log("First render complete");
}

function setupUI() {
    // Setup sliders
    var sliders = ['globalRotation', 'tailFan', 'feather1', 'feather2', 'neckBend', 'headTilt', 'rightLeg'];
    
    sliders.forEach(function(id) {
        var slider = document.getElementById(id);
        var valueSpan = document.getElementById(id + 'Value');
        
        slider.addEventListener('input', function(e) {
            var value = parseFloat(e.target.value);
            valueSpan.textContent = value;
            
            // Update global variable
            switch(id) {
                case 'globalRotation': g_globalRotation = value; break;
                case 'tailFan': g_tailFan = value; break;
                case 'feather1': g_feather1 = value; break;
                case 'feather2': g_feather2 = value; break;
                case 'neckBend': g_neckBend = value; break;
                case 'headTilt': g_headTilt = value; break;
                case 'rightLeg': g_rightLeg = value; break;
            }
            
            if (!g_animating) {
                renderScene();
            }
        });
    });

    // Animation button
    document.getElementById('animateBtn').addEventListener('click', function(e) {
        g_animating = !g_animating;
        e.target.textContent = g_animating ? 'Stop Animation' : 'Start Animation';
        
        if (g_animating) {
            g_lastFpsUpdate = Date.now();
            g_frameCount = 0;
            tick();
        } else {
            cancelAnimationFrame(g_animationId);
        }
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', function() {
        g_globalRotation = 30;
        g_tailFan = 60;
        g_feather1 = 0;
        g_feather2 = 0;
        g_neckBend = 10;
        g_headTilt = 0;
        g_rightLeg = 0;
        
        document.getElementById('globalRotation').value = 30;
        document.getElementById('tailFan').value = 60;
        document.getElementById('feather1').value = 0;
        document.getElementById('feather2').value = 0;
        document.getElementById('neckBend').value = 10;
        document.getElementById('headTilt').value = 0;
        document.getElementById('rightLeg').value = 0;
        
        sliders.forEach(function(id) {
            document.getElementById(id + 'Value').textContent = document.getElementById(id).value;
        });
        
        if (!g_animating) {
            renderScene();
        }
    });
}

function drawCube(matrix, color) {
    
    var vertices = new Float32Array([
        // Front 
        -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
        // Back 
        -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
        // Top 
        -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
        // Bottom 
        -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
        // Right 
         0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,
         0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
        // Left 
        -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5
    ]);

    //Makin Colors
    var colors = new Float32Array(36 * 4);
    for (var i = 0; i < 36; i++) {
        colors[i * 4] = color[0];
        colors[i * 4 + 1] = color[1];
        colors[i * 4 + 2] = color[2];
        colors[i * 4 + 3] = color[3];
    }

    
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create vertex buffer');
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    
    var colorBuffer = gl.createBuffer();
    if (!colorBuffer) {
        console.log('Failed to create color buffer');
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return;
    }
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Color);

    
    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);

    // Draw the cube
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    
    
    g_drawCalls++;
    g_totalVertices += 36;
}

function renderScene() {
    
    var frameStart = performance.now();
    
    
    g_drawCalls = 0;
    g_totalVertices = 0;
    
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    var globalRotation = new Matrix4();
    globalRotation.setRotate(g_globalRotation, 0, 1, 0);
    globalRotation.rotate(-15, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotation.elements);

    // Colors
    var royalBlue = [0.0, 0.2, 0.6, 1.0];
    var turquoise = [0.0, 0.8, 0.8, 1.0];
    var emerald = [0.0, 0.7, 0.3, 1.0];
    var gold = [1.0, 0.84, 0.0, 1.0];
    var orange = [1.0, 0.5, 0.0, 1.0];
    var yellow = [1.0, 0.9, 0.0, 1.0];
    var darkGray = [0.3, 0.3, 0.3, 1.0];

    // MAIN BODY
    var M = new Matrix4();
    M.setTranslate(0, 0, 0);
    M.scale(0.4, 0.35, 0.3);
    drawCube(M, royalBlue);

    // NECK
    M = new Matrix4();
    M.setTranslate(0.18, 0.15, 0);
    M.rotate(g_neckBend, 0, 0, 1);
    var neckM = new Matrix4(M);
    M.translate(0.15, 0, 0);
    M.scale(0.25, 0.15, 0.15);
    drawCube(M, turquoise);

    // DOME
    M = new Matrix4(neckM);
    M.translate(0.3, 0, 0);
    M.rotate(g_headTilt, 0, 0, 1);
    var headM = new Matrix4(M);
    M.scale(0.18, 0.18, 0.18);
    drawCube(M, royalBlue);

    // BEAK
    M = new Matrix4(headM);
    M.translate(0.15, 0, 0);
    M.scale(0.12, 0.06, 0.06);
    drawCube(M, orange);

    // FEATHERS
    for (var i = 0; i < 3; i++) {
        M = new Matrix4(headM);
        M.translate(-0.05 + i * 0.05, 0.15, 0);
        M.scale(0.03, 0.15, 0.03);
        drawCube(M, emerald);
        
        M = new Matrix4(headM);
        M.translate(-0.05 + i * 0.05, 0.25, 0);
        M.scale(0.06, 0.06, 0.06);
        drawCube(M, turquoise);
    }

    //TAIL BASE
    M = new Matrix4();
    M.setTranslate(-0.18, 0.05, 0);
    M.rotate(g_tailFan * 0.3, 0, 0, 1);
    var tailBaseM = new Matrix4(M);
    M.translate(-0.1, 0, 0);
    M.scale(0.15, 0.12, 0.15);
    drawCube(M, emerald);

    // FEATBER
    var numFeathers = 7;
    for (var i = 0; i < numFeathers; i++) {
        var angle = (i - 3) * (g_tailFan / 6);
        var color = i % 2 === 0 ? turquoise : emerald;
        
        
        M = new Matrix4(tailBaseM);
        M.translate(-0.1, 0, 0);
        M.rotate(angle, 0, 1, 0);
        var featherSeg1M = new Matrix4(M);
        M.translate(-0.15, 0, 0);
        M.scale(0.25, 0.05, 0.08);
        drawCube(M, color);

        
        var extraAngle = 0;
        if (i === 1) extraAngle = g_feather1;
        if (i === 5) extraAngle = g_feather2;
        
        M = new Matrix4(featherSeg1M);
        M.translate(-0.3, 0, 0);
        M.rotate(extraAngle, 0, 1, 0);
        var featherSeg2M = new Matrix4(M);
        M.translate(-0.15, 0, 0);
        M.scale(0.25, 0.04, 0.1);
        drawCube(M, i % 2 === 0 ? emerald : royalBlue);

        // SPOT
        M = new Matrix4(featherSeg2M);
        M.translate(-0.3, 0, 0);
        M.scale(0.12, 0.12, 0.01);
        drawCube(M, gold);
        
        M = new Matrix4(featherSeg2M);
        M.translate(-0.3, 0, 0);
        M.scale(0.06, 0.06, 0.02);
        drawCube(M, royalBlue);
    }

    //WINGS 
    M = new Matrix4();
    M.setTranslate(0, 0.05, 0.2);
    M.rotate(-20, 1, 0, 0);
    M.scale(0.35, 0.05, 0.25);
    drawCube(M, turquoise);

    M = new Matrix4();
    M.setTranslate(0, 0.05, -0.2);
    M.rotate(20, 1, 0, 0);
    M.scale(0.35, 0.05, 0.25);
    drawCube(M, turquoise);

    // RIGHT LEG
    M = new Matrix4();
    M.setTranslate(0.05, -0.15, 0.1);
    M.rotate(g_rightLeg, 0, 0, 1);
    var rightLegM = new Matrix4(M);
    M.translate(0, -0.15, 0);
    M.scale(0.08, 0.25, 0.08);
    drawCube(M, darkGray);

    // RIGHT FOOT
    M = new Matrix4(rightLegM);
    M.translate(0, -0.3, 0);
    M.translate(0.05, 0, 0);
    M.scale(0.15, 0.03, 0.12);
    drawCube(M, yellow);

    // LEFT LEG
    M = new Matrix4();
    M.setTranslate(0.05, -0.3, -0.1);
    M.scale(0.08, 0.25, 0.08);
    drawCube(M, darkGray);

    // LEFT FOOT
    M = new Matrix4();
    M.setTranslate(0.1, -0.425, -0.1);
    M.scale(0.15, 0.03, 0.12);
    drawCube(M, yellow);
    
    // Calculate frame time
    var frameEnd = performance.now();
    g_frameTime = frameEnd - frameStart;
    
    
    updatePerformanceDisplay();
}

function updatePerformanceDisplay() {
    var currentTime = Date.now();
    g_frameCount++;
    
    
    if (currentTime - g_lastFpsUpdate >= 500) {
        g_fps = Math.round((g_frameCount * 1000) / (currentTime - g_lastFpsUpdate));
        g_frameCount = 0;
        g_lastFpsUpdate = currentTime;
    }
    
    
    var fpsElement = document.getElementById('fps');
    if (fpsElement) {
        fpsElement.textContent = g_fps;
        
        fpsElement.className = 'perf-value';
        if (g_fps >= 50) {
            fpsElement.classList.add('fps-good');
        } else if (g_fps >= 30) {
            fpsElement.classList.add('fps-ok');
        } else {
            fpsElement.classList.add('fps-bad');
        }
    }
    
    var frameTimeElement = document.getElementById('frameTime');
    if (frameTimeElement) {
        frameTimeElement.textContent = g_frameTime.toFixed(2) + ' ms';
    }
    
    var drawCallsElement = document.getElementById('drawCalls');
    if (drawCallsElement) {
        drawCallsElement.textContent = g_drawCalls;
    }
    
    var verticesElement = document.getElementById('vertices');
    if (verticesElement) {
        verticesElement.textContent = g_totalVertices.toLocaleString();
    }
}

function updateAnimationAngles() {
    if (!g_animating) return;
    
    
    g_neckBend = 10 + Math.sin(g_time * 0.002) * 15;
    g_headTilt = Math.sin(g_time * 0.0015) * 10;
    
    
    g_tailFan = 60 + Math.sin(g_time * 0.001) * 40;
    
    
    g_feather1 = Math.sin(g_time * 0.003) * 20;
    g_feather2 = Math.sin(g_time * 0.003 + Math.PI) * 20;
    
    
    g_rightLeg = Math.sin(g_time * 0.004) * 20;
}

function tick() {
    g_time = Date.now();
    updateAnimationAngles();
    renderScene();
    g_animationId = requestAnimationFrame(tick);
}


window.onload = function() {
    main();
};
