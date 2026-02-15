
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    uniform mat4 u_ProjectionMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ModelMatrix;
    varying vec2 v_UV;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }
`;


var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform int u_UseTexture;
    uniform int u_WhichTexture;
    uniform vec4 u_Color;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    void main() {
        if (u_UseTexture == 1) {
            if (u_WhichTexture == 0) {
                gl_FragColor = texture2D(u_Sampler0, v_UV);
            } else if (u_WhichTexture == 1) {
                gl_FragColor = texture2D(u_Sampler1, v_UV);
            } else if (u_WhichTexture == 2) {
                gl_FragColor = texture2D(u_Sampler2, v_UV);
            } else if (u_WhichTexture == 3) {
                gl_FragColor = texture2D(u_Sampler3, v_UV);
            }
        } else {
            gl_FragColor = u_Color;
        }
    }
`;


var gl;
var canvas;
var camera;


var u_ProjectionMatrix;
var u_ViewMatrix;
var u_ModelMatrix;
var u_UseTexture;
var u_WhichTexture;
var u_Color;
var u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;


var a_Position;
var a_UV;


var WORLD_SIZE = 32;
var world = [];


var keys = {};
var mouse = { lastX: 0, lastY: 0, locked: false };


var stats = {
    fps: 0,
    frameCount: 0,
    lastTime: 0,
    drawCalls: 0
};

// RONALD LOCATION 
var ronaldPosition = { x: 14, y: .1, z: 11 };
var foundRonald = false;

function main() {
    
    canvas = document.getElementById('webgl');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get WebGL context');
        return;
    }
    
   
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    
    
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_UseTexture = gl.getUniformLocation(gl.program, 'u_UseTexture');
    u_WhichTexture = gl.getUniformLocation(gl.program, 'u_WhichTexture');
    u_Color = gl.getUniformLocation(gl.program, 'u_Color');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    
    
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    
   
    initCubeBuffers(gl);
    
   
    gl.enable(gl.DEPTH_TEST);
    
    
    gl.clearColor(0.53, 0.81, 0.92, 1.0);
    
    
    camera = new Camera();
    
   
    initWorld();
    
   
    initTextures();
    

    setupInput();
    
    
    stats.lastTime = Date.now();
    tick();
}


function initWorld() {
    // Create 32x32 world map
    // 0 = no wall, 1-4 = wall height
    var map = [
        [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,2,2,2,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,2,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,4,4,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,3,3,0,3,3,0,0,0,0,0,0,0,0,0,0,4,4,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
        [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]
    ];
    
    
    for (var x = 0; x < WORLD_SIZE; x++) {
        world[x] = [];
        for (var z = 0; z < WORLD_SIZE; z++) {
            world[x][z] = [];
            var height = map[z][x];
            for (var y = 0; y < height; y++) {
                world[x][z][y] = 1; 
            }
        }
    }
}

function initTextures() {
    
    createProceduralTexture(0, 'brick');
    createProceduralTexture(1, 'stone');
    createProceduralTexture(2, 'grass');
    createProceduralTexture(3, 'wood');
    

    gl.uniform1i(u_Sampler0, 0);
    gl.uniform1i(u_Sampler1, 1);
    gl.uniform1i(u_Sampler2, 2);
    gl.uniform1i(u_Sampler3, 3);
}

function createProceduralTexture(unit, type) {
    var size = 64;
    var data = new Uint8Array(size * size * 4);
    
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            var idx = (i * size + j) * 4;
            
            if (type === 'brick') {
                
                var isBrick = (i % 8 < 7) && (j % 16 < 15);
                data[idx] = isBrick ? 139 : 90;
                data[idx + 1] = isBrick ? 69 : 45;
                data[idx + 2] = isBrick ? 19 : 12;
            } else if (type === 'stone') {
                
                var noise = Math.random() * 50;
                data[idx] = 100 + noise;
                data[idx + 1] = 100 + noise;
                data[idx + 2] = 100 + noise;
            } else if (type === 'grass') {
               
                var noise = Math.random() * 40;
                data[idx] = 34 + noise;
                data[idx + 1] = 139 + noise;
                data[idx + 2] = 34 + noise;
            } else if (type === 'wood') {
               
                var stripe = Math.floor(i / 4) % 2;
                data[idx] = 139 - stripe * 20;
                data[idx + 1] = 90 - stripe * 15;
                data[idx + 2] = 43 - stripe * 10;
            }
            data[idx + 3] = 255;
        }
    }
    
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}


function setupInput() {
  
    document.addEventListener('keydown', function(e) {
        keys[e.key.toLowerCase()] = true;
        
        if (e.key === ' ') {
            e.preventDefault();
            camera.jump();
        }
    });
    
    document.addEventListener('keyup', function(e) {
        keys[e.key.toLowerCase()] = false;
    });
    
    
    canvas.addEventListener('click', function() {
        canvas.requestPointerLock();
    });
    
    document.addEventListener('pointerlockchange', function() {
        mouse.locked = document.pointerLockElement === canvas;
    });
    
    document.addEventListener('mousemove', function(e) {
        if (mouse.locked) {
            camera.mouseRotate(e.movementX, e.movementY);
        }
    });
    

    canvas.addEventListener('mousedown', function(e) {
        e.preventDefault();
        
        if (!mouse.locked) return;
        
        var result = camera.raycastBlock(world);
        
        if (result.hit) {
            if (e.button === 0) { 
                addBlock(result.x, result.y + 1, result.z);
            } else if (e.button === 2) { 
                removeBlock(result.x, result.y, result.z);
            }
        } else {
            if (e.button === 0) {
                
                var block = camera.getBlockInFront(3);
                addBlock(block.x, block.y, block.z);
            }
        }
    });
    
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
   
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.updateProjectionMatrix();
    });
}

function addBlock(x, y, z) {
    if (x >= 0 && x < WORLD_SIZE && z >= 0 && z < WORLD_SIZE && y >= 0 && y < 10) {
        if (!world[x][z][y]) {
            world[x][z][y] = 1;
            showMessage('Block added!');
        }
    }
}

function removeBlock(x, y, z) {
    if (x >= 0 && x < WORLD_SIZE && z >= 0 && z < WORLD_SIZE && y >= 0 && y < 10) {
        if (world[x][z][y]) {
            world[x][z][y] = 0;
            showMessage('Block removed!');
        }
    }
}

function showMessage(text) {
    var msg = document.getElementById('message');
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(function() {
        msg.style.display = 'none';
    }, 2000);
}


function handleInput() {
    if (keys['w']) camera.moveForward();
    if (keys['s']) camera.moveBackward();
    if (keys['a']) camera.moveLeft();
    if (keys['d']) camera.moveRight();
    if (keys['q']) camera.panLeft();
    if (keys['e']) camera.panRight();
}


function renderScene() {
    stats.drawCalls = 0;
    
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    
    camera.updateViewMatrix();
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    
    
    var ground = new Cube();
    ground.modelMatrix.setTranslate(WORLD_SIZE / 2 - 0.5, -0.5, WORLD_SIZE / 2 - 0.5);
    ground.modelMatrix.scale(WORLD_SIZE, 0.1, WORLD_SIZE);
    ground.setTexture(2); // Grass texture
    ground.render(gl, a_Position, a_UV, u_ModelMatrix, u_UseTexture, u_WhichTexture, u_Color);
    stats.drawCalls++;
    
   
    var sky = new Cube();
    sky.modelMatrix.setTranslate(WORLD_SIZE / 2 - 0.5, 50, WORLD_SIZE / 2 - 0.5);
    sky.modelMatrix.scale(200, 200, 200);
    sky.setColor(0.53, 0.81, 0.98, 1.0);
    sky.render(gl, a_Position, a_UV, u_ModelMatrix, u_UseTexture, u_WhichTexture, u_Color);
    stats.drawCalls++;
    
    
    var blockCount = 0;
    for (var x = 0; x < WORLD_SIZE; x++) {
        for (var z = 0; z < WORLD_SIZE; z++) {
            for (var y = 0; y < 10; y++) {
                if (world[x][z][y]) {
                    var cube = new Cube();
                    cube.modelMatrix.setTranslate(x, y, z);
                    
                    // Vary textures based on position
                    var textureNum = ((x + z) % 2 === 0) ? 0 : 1;
                    cube.setTexture(textureNum);
                    
                    cube.render(gl, a_Position, a_UV, u_ModelMatrix, u_UseTexture, u_WhichTexture, u_Color);
                    stats.drawCalls++;
                    blockCount++;
                }
            }
        }
    }
    
    
    drawRonald();
    
    
    checkRonaldProximity();
    
   
    document.getElementById('drawCalls').textContent = stats.drawCalls;
    document.getElementById('blocks').textContent = blockCount;
}

// Draw Ronald 
function drawRonald() {
    var colors = {
        blue: [0.0, 0.2, 0.6, 1.0],
        turquoise: [0.0, 0.8, 0.8, 1.0],
        emerald: [0.0, 0.7, 0.3, 1.0],
        gold: [1.0, 0.84, 0.0, 1.0]
    };
    
    var baseX = ronaldPosition.x;
    var baseY = ronaldPosition.y;
    var baseZ = ronaldPosition.z;
    
    // Body
    var body = new Cube();
    body.modelMatrix.setTranslate(baseX, baseY, baseZ);
    body.modelMatrix.scale(0.4, 0.35, 0.3);
    body.setColor(...colors.blue);
    body.render(gl, a_Position, a_UV, u_ModelMatrix, u_UseTexture, u_WhichTexture, u_Color);
    stats.drawCalls++;
    
    // Head
    var head = new Cube();
    head.modelMatrix.setTranslate(baseX + 0.5, baseY + 0.2, baseZ);
    head.modelMatrix.scale(0.2, 0.2, 0.2);
    head.setColor(...colors.turquoise);
    head.render(gl, a_Position, a_UV, u_ModelMatrix, u_UseTexture, u_WhichTexture, u_Color);
    stats.drawCalls++;
    
    // Tail feathers (simplified)
    for (var i = 0; i < 5; i++) {
        var feather = new Cube();
        var angle = (i - 2) * 15;
        feather.modelMatrix.setTranslate(baseX - 0.3, baseY + 0.1, baseZ);
        feather.modelMatrix.rotate(angle, 0, 1, 0);
        feather.modelMatrix.translate(-0.3, 0, 0);
        feather.modelMatrix.scale(0.5, 0.1, 0.1);
        feather.setColor(...(i % 2 === 0 ? colors.emerald : colors.gold));
        feather.render(gl, a_Position, a_UV, u_ModelMatrix, u_UseTexture, u_WhichTexture, u_Color);
        stats.drawCalls++;
    }
}

function checkRonaldProximity() {
    var dx = camera.eye.elements[0] - ronaldPosition.x;
    var dy = camera.eye.elements[1] - ronaldPosition.y;
    var dz = camera.eye.elements[2] - ronaldPosition.z;
    var distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    if (distance < 3 && !foundRonald) {
        foundRonald = true;
        showMessage('You found Ronald the Peacock!');
    }
}


function tick() {
    var currentTime = Date.now();
    var deltaTime = currentTime - stats.lastTime;
    
  
    stats.frameCount++;
    if (deltaTime >= 1000) {
        stats.fps = Math.round(stats.frameCount * 1000 / deltaTime);
        stats.frameCount = 0;
        stats.lastTime = currentTime;
        document.getElementById('fps').textContent = stats.fps;
    }
    
   
    handleInput();
    
 
    camera.applyGravity();
    
    
    renderScene();
    
   
    requestAnimationFrame(tick);
}


window.onload = function() {
    main();
};
