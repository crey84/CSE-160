function getNormalMatrix(modelMat) {
  var inv = new Matrix4();
  inv.setInverseOf(modelMat);
  inv.transpose();
  var e = inv.elements;
  
  return new Float32Array([
    e[0], e[1], e[2],
    e[4], e[5], e[6],
    e[8], e[9], e[10]
  ]);
}


var gl;
var canvas;
var locs = {};


var g_lightingOn = true;
var g_normalsOn = false;
var g_light1On = true;
var g_light2On = true;
var g_lightAnimOn = true;


var g_lightAngle = 0;
var g_lightY = 1.5;
var g_lightR = 2.0;
var g_lightColor = [1.0, 0.95, 0.8];


var g_spotPos = [0, 3, 0];
var g_spotCutoff = 18; // in degrees
var g_spotColor = [0.3, 0.5, 1.0];


var g_camY = 0;
var g_camX = 0;
var g_camPos = [0, 0, 5];


var g_tailFan = 60;
var g_feather1 = 0;
var g_feather2 = 0;
var g_neckBend = 10;
var g_headTilt = 0;
var g_rightLeg = 0;


var g_animating = false;
var g_animId = null;
var g_time = 0;


var g_fpsFrames = 0;
var g_fpsLast = 0;
var g_fps = 0;
var g_dc = 0;


var g_cube;
var g_sphere;
var g_ground;


var g_objBuf = null;
var g_objCount = 0;
var g_objLoaded = false;


var g_mouseDown = false;
var g_lastMouseX = 0;
var g_lastMouseY = 0;


window.onload = function() {
  canvas = document.getElementById('webgl');

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('webgl context failed');
    return;
  }

  var vsSource = document.getElementById('vs').textContent;
  var fsSource = document.getElementById('fs').textContent;

  if (!initShaders(gl, vsSource, fsSource)) {
    console.log('shader init failed');
    return;
  }

  
  locs.aPos  = gl.getAttribLocation(gl.program, 'a_Position');
  locs.aNorm = gl.getAttribLocation(gl.program, 'a_Normal');

  locs.uMvp     = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  locs.uModel   = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  locs.uNorm    = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  locs.uLPos    = gl.getUniformLocation(gl.program, 'u_LightPos');
  locs.uLCol    = gl.getUniformLocation(gl.program, 'u_LightColor');
  locs.uL1On    = gl.getUniformLocation(gl.program, 'u_Light1On');
  locs.uSPos    = gl.getUniformLocation(gl.program, 'u_SpotPos');
  locs.uSDir    = gl.getUniformLocation(gl.program, 'u_SpotDir');
  locs.uSCut    = gl.getUniformLocation(gl.program, 'u_SpotCutoff');
  locs.uSCol    = gl.getUniformLocation(gl.program, 'u_SpotColor');
  locs.uL2On    = gl.getUniformLocation(gl.program, 'u_Light2On');
  locs.uCam     = gl.getUniformLocation(gl.program, 'u_CamPos');
  locs.uBase    = gl.getUniformLocation(gl.program, 'u_BaseColor');
  locs.uLightOn = gl.getUniformLocation(gl.program, 'u_LightingOn');
  locs.uNViz    = gl.getUniformLocation(gl.program, 'u_NormalsOn');

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.05, 0.06, 0.12, 1.0);

  initGeometry();

  
  canvas.style.cursor = 'grab';

  canvas.addEventListener('mousedown', function(e) {
    g_mouseDown = true;
    g_lastMouseX = e.clientX;
    g_lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', function(e) {
    if (!g_mouseDown) return;
    var dx = e.clientX - g_lastMouseX;
    var dy = e.clientY - g_lastMouseY;
    g_lastMouseX = e.clientX;
    g_lastMouseY = e.clientY;

    g_camY += dx * 0.4;
    g_camX += dy * 0.4;

    
    if (g_camX > 70) g_camX = 70;
    if (g_camX < -70) g_camX = -70;
    g_camY = ((g_camY % 360) + 360) % 360;

    document.getElementById('slCamY').value = Math.round(g_camY);
    document.getElementById('slCamX').value = Math.round(g_camX);
  });

  document.addEventListener('mouseup', function() {
    g_mouseDown = false;
    canvas.style.cursor = 'grab';
  });

  g_fpsLast = Date.now();
  tick();
};

document.addEventListener('keydown', function(e) {
  if (e.key === 'p' || e.key === 'P') toggleAnimation();
});



function initGeometry() {
  g_cube   = buildCube();
  g_sphere = buildSphere(24, 24);
  g_ground = buildGround();
}

function buildCube() {
  
  var p = [
    
    -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,
    
    -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
    -0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5,-0.5,-0.5,
   
    -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5, 0.5,-0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
    
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
    
     0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
     0.5,-0.5,-0.5,   0.5, 0.5, 0.5,   0.5,-0.5, 0.5,
    
    -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
    -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5
  ];

  var faceNormals = [
    [0,0,1], [0,0,-1], [0,1,0], [0,-1,0], [1,0,0], [-1,0,0]
  ];

  var n = [];
  for (var f = 0; f < 6; f++) {
    for (var v = 0; v < 6; v++) {
      n.push(faceNormals[f][0], faceNormals[f][1], faceNormals[f][2]);
    }
  }

  var pb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p), gl.STATIC_DRAW);

  var nb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);

  return { posBuf: pb, normBuf: nb, count: 36 };
}

function buildSphere(stacks, slices) {
  var pos = [];
  var nrm = [];
  var idx = [];

  for (var i = 0; i <= stacks; i++) {
    var phi = Math.PI * i / stacks;
    for (var j = 0; j <= slices; j++) {
      var theta = 2 * Math.PI * j / slices;
      var x = Math.sin(phi) * Math.cos(theta);
      var y = Math.cos(phi);
      var z = Math.sin(phi) * Math.sin(theta);
      pos.push(x, y, z);
      nrm.push(x, y, z); 
    }
  }

  for (var i = 0; i < stacks; i++) {
    for (var j = 0; j < slices; j++) {
      var a = (slices + 1) * i + j;
      idx.push(a, a + slices + 1, a + 1);
      idx.push(a + 1, a + slices + 1, a + slices + 2);
    }
  }

  var pb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

  var nb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nrm), gl.STATIC_DRAW);

  var ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

  return { posBuf: pb, normBuf: nb, idxBuf: ib, count: idx.length };
}

function buildGround() {
  
  var p = [
    -3,-0.55,-3,  3,-0.55,-3,  3,-0.55, 3,
    -3,-0.55,-3,  3,-0.55, 3, -3,-0.55, 3
  ];
  var n = [];
  for (var i = 0; i < 6; i++) n.push(0, 1, 0);

  var pb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p), gl.STATIC_DRAW);

  var nb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(n), gl.STATIC_DRAW);

  return { posBuf: pb, normBuf: nb, count: 6 };
}



function bindMesh(geo) {
  gl.bindBuffer(gl.ARRAY_BUFFER, geo.posBuf);
  gl.vertexAttribPointer(locs.aPos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(locs.aPos);

  gl.bindBuffer(gl.ARRAY_BUFFER, geo.normBuf);
  gl.vertexAttribPointer(locs.aNorm, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(locs.aNorm);
}


function setUniforms(modelMat, projView, baseColor) {
  var mvp = new Matrix4(projView);
  mvp.multiply(modelMat);

  gl.uniformMatrix4fv(locs.uMvp,   false, mvp.elements);
  gl.uniformMatrix4fv(locs.uModel, false, modelMat.elements);
  gl.uniformMatrix3fv(locs.uNorm,  false, getNormalMatrix(modelMat));
  gl.uniform3fv(locs.uBase, baseColor);
  g_dc++;
}

function drawCubeM(M, projView, color) {
  setUniforms(M, projView, color);
  bindMesh(g_cube);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawSphere(M, projView, color) {
  setUniforms(M, projView, color);
  bindMesh(g_sphere);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_sphere.idxBuf);
  gl.drawElements(gl.TRIANGLES, g_sphere.count, gl.UNSIGNED_SHORT, 0);
}

function drawGroundMesh(projView) {
  var identity = new Matrix4();
  setUniforms(identity, projView, [0.18, 0.35, 0.18]);
  bindMesh(g_ground);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawOBJ(projView) {
  if (!g_objLoaded || !g_objBuf) return;

  var M = new Matrix4();
  M.setTranslate(1.5, -0.1, -0.8);
  M.scale(0.5, 0.5, 0.5);

  setUniforms(M, projView, [0.6, 0.5, 0.4]);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_objBuf.posBuf);
  gl.vertexAttribPointer(locs.aPos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(locs.aPos);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_objBuf.normBuf);
  gl.vertexAttribPointer(locs.aNorm, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(locs.aNorm);

  gl.drawArrays(gl.TRIANGLES, 0, g_objCount);
}



function buildProjView() {
  var camRY = g_camY * Math.PI / 180;
  var camRX = g_camX * Math.PI / 180;
  var r = 4.5;

  var ex = r * Math.sin(camRY) * Math.cos(camRX);
  var ey = r * Math.sin(camRX) + 0.4;
  var ez = r * Math.cos(camRY) * Math.cos(camRX);
  g_camPos = [ex, ey, ez];

  var proj = new Matrix4();
  proj.setPerspective(45, 720 / 560, 0.1, 100);

  var view = new Matrix4();
  view.setLookAt(ex, ey, ez,  0, 0.2, 0,  0, 1, 0);

  proj.multiply(view);
  return proj;
}


function setLightingUniforms() {
  var lx = g_lightR * Math.cos(g_lightAngle);
  var lz = g_lightR * Math.sin(g_lightAngle);

  gl.uniform3f(locs.uLPos, lx, g_lightY, lz);
  gl.uniform3fv(locs.uLCol, g_lightColor);
  gl.uniform1i(locs.uL1On, g_light1On ? 1 : 0);

  
  gl.uniform3fv(locs.uSPos, g_spotPos);
  var sdx = -g_spotPos[0];
  var sdy = -g_spotPos[1];
  var sdz = -g_spotPos[2];
  var sl = Math.sqrt(sdx*sdx + sdy*sdy + sdz*sdz) || 1;
  gl.uniform3f(locs.uSDir, sdx/sl, sdy/sl, sdz/sl);
  gl.uniform1f(locs.uSCut, Math.cos(g_spotCutoff * Math.PI / 180));
  gl.uniform3fv(locs.uSCol, g_spotColor);
  gl.uniform1i(locs.uL2On, g_light2On ? 1 : 0);

  gl.uniform3fv(locs.uCam, g_camPos);
  gl.uniform1i(locs.uLightOn, g_lightingOn ? 1 : 0);
  gl.uniform1i(locs.uNViz, g_normalsOn ? 1 : 0);
}


function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  g_dc = 0;

  var pv = buildProjView();
  setLightingUniforms();

  drawGroundMesh(pv);
  renderPeacock(pv);

 
  var sm;
  sm = new Matrix4();
  sm.setTranslate(1.2, -0.1, 0.6);
  sm.scale(0.28, 0.28, 0.28);
  drawSphere(sm, pv, [0.7, 0.2, 0.2]);

  sm = new Matrix4();
  sm.setTranslate(-1.1, -0.1, 0.7);
  sm.scale(0.28, 0.28, 0.28);
  drawSphere(sm, pv, [0.2, 0.5, 0.8]);

  sm = new Matrix4();
  sm.setTranslate(0.0, -0.1, -1.1);
  sm.scale(0.22, 0.22, 0.22);
  drawSphere(sm, pv, [0.8, 0.7, 0.1]);

  
  gl.uniform1i(locs.uLightOn, 0);

  var lx = g_lightR * Math.cos(g_lightAngle);
  var lz = g_lightR * Math.sin(g_lightAngle);
  var lm = new Matrix4();
  lm.setTranslate(lx, g_lightY, lz);
  lm.scale(0.07, 0.07, 0.07);
  drawCubeM(lm, pv, [1.0, 1.0, 0.8]);

  var sm2 = new Matrix4();
  sm2.setTranslate(g_spotPos[0], g_spotPos[1], g_spotPos[2]);
  sm2.scale(0.07, 0.07, 0.07);
  drawCubeM(sm2, pv, [0.5, 0.7, 1.0]);

  
  gl.uniform1i(locs.uLightOn, g_lightingOn ? 1 : 0);

  drawOBJ(pv);

  
  g_fpsFrames++;
  var now = Date.now();
  if (now - g_fpsLast >= 500) {
    g_fps = Math.round(g_fpsFrames * 1000 / (now - g_fpsLast));
    g_fpsFrames = 0;
    g_fpsLast = now;
    document.getElementById('fpsVal').textContent = g_fps;
    document.getElementById('dcVal').textContent = g_dc;
  }
}



function renderPeacock(pv) {
  // colors
  var royalBlue = [0.0, 0.2, 0.6];
  var turquoise = [0.0, 0.8, 0.8];
  var emerald   = [0.0, 0.7, 0.3];
  var gold      = [1.0, 0.84, 0.0];
  var orange    = [1.0, 0.5, 0.0];
  var yellow    = [1.0, 0.9, 0.0];
  var darkGray  = [0.3, 0.3, 0.3];

  var M;

  
  M = new Matrix4();
  M.setScale(0.4, 0.35, 0.3);
  drawCubeM(M, pv, royalBlue);

  
  var neckBase = new Matrix4();
  neckBase.setTranslate(0.18, 0.15, 0);
  neckBase.rotate(g_neckBend, 0, 0, 1);

  var neckM = new Matrix4(neckBase);
  neckM.translate(0.15, 0, 0);
  neckM.scale(0.25, 0.15, 0.15);
  drawCubeM(neckM, pv, turquoise);

  
  var headBase = new Matrix4(neckBase);
  headBase.translate(0.3, 0, 0);
  headBase.rotate(g_headTilt, 0, 0, 1);

  var headM = new Matrix4(headBase);
  headM.scale(0.18, 0.18, 0.18);
  drawCubeM(headM, pv, royalBlue);

 
  var beakM = new Matrix4(headBase);
  beakM.translate(0.15, 0, 0);
  beakM.scale(0.12, 0.06, 0.06);
  drawCubeM(beakM, pv, orange);

  
  for (var i = 0; i < 3; i++) {
    var f = new Matrix4(headBase);
    f.translate(-0.05 + i * 0.05, 0.15, 0);
    f.scale(0.03, 0.15, 0.03);
    drawCubeM(f, pv, emerald);

    var fp = new Matrix4(headBase);
    fp.translate(-0.05 + i * 0.05, 0.25, 0);
    fp.scale(0.06, 0.06, 0.06);
    drawCubeM(fp, pv, turquoise);
  }

  
  var tailBase = new Matrix4();
  tailBase.setTranslate(-0.18, 0.05, 0);
  tailBase.rotate(g_tailFan * 0.3, 0, 0, 1);

  var tbM = new Matrix4(tailBase);
  tbM.translate(-0.1, 0, 0);
  tbM.scale(0.15, 0.12, 0.15);
  drawCubeM(tbM, pv, emerald);

  
  for (var i = 0; i < 7; i++) {
    var angle = (i - 3) * (g_tailFan / 6);
    var col = (i % 2 === 0) ? turquoise : emerald;

    var seg1Base = new Matrix4(tailBase);
    seg1Base.translate(-0.1, 0, 0);
    seg1Base.rotate(angle, 0, 1, 0);

    var seg1M = new Matrix4(seg1Base);
    seg1M.translate(-0.15, 0, 0);
    seg1M.scale(0.25, 0.05, 0.08);
    drawCubeM(seg1M, pv, col);

    
    var extra = 0;
    if (i === 1) extra = g_feather1;
    if (i === 5) extra = g_feather2;

    var seg2Base = new Matrix4(seg1Base);
    seg2Base.translate(-0.3, 0, 0);
    seg2Base.rotate(extra, 0, 1, 0);

    var seg2M = new Matrix4(seg2Base);
    seg2M.translate(-0.15, 0, 0);
    seg2M.scale(0.25, 0.04, 0.1);
    drawCubeM(seg2M, pv, (i % 2 === 0) ? emerald : royalBlue);

   
    var spotM = new Matrix4(seg2Base);
    spotM.translate(-0.3, 0, 0);
    spotM.scale(0.12, 0.12, 0.01);
    drawCubeM(spotM, pv, gold);

    var spot2M = new Matrix4(seg2Base);
    spot2M.translate(-0.3, 0, 0);
    spot2M.scale(0.06, 0.06, 0.02);
    drawCubeM(spot2M, pv, royalBlue);
  }

  
  var wL = new Matrix4();
  wL.setTranslate(0, 0.05, 0.2);
  wL.rotate(-20, 1, 0, 0);
  wL.scale(0.35, 0.05, 0.25);
  drawCubeM(wL, pv, turquoise);

  var wR = new Matrix4();
  wR.setTranslate(0, 0.05, -0.2);
  wR.rotate(20, 1, 0, 0);
  wR.scale(0.35, 0.05, 0.25);
  drawCubeM(wR, pv, turquoise);

 
  var rLegBase = new Matrix4();
  rLegBase.setTranslate(0.05, -0.15, 0.1);
  rLegBase.rotate(g_rightLeg, 0, 0, 1);

  var rLegM = new Matrix4(rLegBase);
  rLegM.translate(0, -0.15, 0);
  rLegM.scale(0.08, 0.25, 0.08);
  drawCubeM(rLegM, pv, darkGray);

  var rFootM = new Matrix4(rLegBase);
  rFootM.translate(0.05, -0.3, 0);
  rFootM.scale(0.15, 0.03, 0.12);
  drawCubeM(rFootM, pv, yellow);


  var lLegM = new Matrix4();
  lLegM.setTranslate(0.05, -0.3, -0.1);
  lLegM.scale(0.08, 0.25, 0.08);
  drawCubeM(lLegM, pv, darkGray);

  var lFootM = new Matrix4();
  lFootM.setTranslate(0.1, -0.425, -0.1);
  lFootM.scale(0.15, 0.03, 0.12);
  drawCubeM(lFootM, pv, yellow);
}


function tick() {
  g_time = Date.now();
  var t = g_time * 0.001;

  if (g_animating) {
    g_neckBend = 10 + Math.sin(t * 2.0) * 15;
    g_headTilt = Math.sin(t * 1.5) * 10;
    g_tailFan  = 60 + Math.sin(t * 1.0) * 40;
    g_feather1 = Math.sin(t * 3.0) * 20;
    g_feather2 = Math.sin(t * 3.0 + Math.PI) * 20;
    g_rightLeg = Math.sin(t * 4.0) * 20;
  }

  if (g_lightAnimOn) {
    g_lightAngle = t * 0.8;
    document.getElementById('slLightAngle').value = (g_lightAngle * 180 / Math.PI) % 360;
  }

  renderScene();
  g_animId = requestAnimationFrame(tick);
}




function toggleLighting() {
  g_lightingOn = !g_lightingOn;
  var b = document.getElementById('btnLighting');
  b.textContent = ' Lighting: ' + (g_lightingOn ? 'ON' : 'OFF');
  b.className = g_lightingOn ? 'active' : '';
}

function toggleNormals() {
  g_normalsOn = !g_normalsOn;
  var b = document.getElementById('btnNormals');
  b.textContent = ' Normals VIZ: ' + (g_normalsOn ? 'ON' : 'OFF');
  b.className = g_normalsOn ? 'active' : '';
}

function toggleLight1() {
  g_light1On = !g_light1On;
  var b = document.getElementById('btnLight1');
  b.textContent = 'Point Light: ' + (g_light1On ? 'ON' : 'OFF');
  b.className = g_light1On ? 'active' : '';
}

function toggleLight2() {
  g_light2On = !g_light2On;
  var b = document.getElementById('btnLight2');
  b.textContent = 'Spot Light: ' + (g_light2On ? 'ON' : 'OFF');
  b.className = g_light2On ? 'active' : '';
}

function toggleLightAnim() {
  g_lightAnimOn = !g_lightAnimOn;
  var b = document.getElementById('btnLightAnim');
  b.textContent = 'Auto-Orbit: ' + (g_lightAnimOn ? 'ON' : 'OFF');
  b.className = g_lightAnimOn ? 'active' : '';
}

function toggleAnimation() {
  g_animating = !g_animating;
  var b = document.getElementById('animateBtn');
  b.textContent = g_animating ? '⏹ Stop Animation' : '▶ Start Animation';
  b.className = g_animating ? 'active' : '';
}

function resetPose() {
  g_tailFan = 60;
  g_neckBend = 10;
  g_headTilt = 0;
  g_rightLeg = 0;
  g_feather1 = 0;
  g_feather2 = 0;
  document.getElementById('tailFan').value  = 60;
  document.getElementById('neckBend').value = 10;
  document.getElementById('headTilt').value = 0;
  document.getElementById('rightLeg').value = 0;
}




function loadOBJFile(evt) {
  var file = evt.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    parseOBJ(e.target.result, file.name);
  };
  reader.readAsText(file);
}

function parseOBJ(text, name) {
  var verts   = [];
  var normals = [];
  var posArr  = [];
  var normArr = [];

  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var t = lines[i].trim().split(/\s+/);

    if (t[0] === 'v') {
      verts.push([+t[1], +t[2], +t[3]]);
    } else if (t[0] === 'vn') {
      normals.push([+t[1], +t[2], +t[3]]);
    } else if (t[0] === 'f') {
      
      var fv = [];
      for (var j = 1; j < t.length; j++) {
        var p = t[j].split('/');
        fv.push({ v: +p[0] - 1, n: p[2] ? +p[2] - 1 : -1 });
      }

      for (var j = 1; j < fv.length - 1; j++) {
        var tri = [fv[0], fv[j], fv[j + 1]];

        
        var p0 = verts[fv[0].v];
        var p1 = verts[fv[j].v];
        var p2 = verts[fv[j + 1].v];
        var e1 = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]];
        var e2 = [p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2]];
        var fn = [
          e1[1]*e2[2] - e1[2]*e2[1],
          e1[2]*e2[0] - e1[0]*e2[2],
          e1[0]*e2[1] - e1[1]*e2[0]
        ];
        var fl = Math.sqrt(fn[0]*fn[0] + fn[1]*fn[1] + fn[2]*fn[2]) || 1;
        fn = [fn[0]/fl, fn[1]/fl, fn[2]/fl];

        for (var k = 0; k < 3; k++) {
          var fvert = tri[k];
          posArr.push(verts[fvert.v][0], verts[fvert.v][1], verts[fvert.v][2]);
          if (fvert.n >= 0 && normals.length > 0) {
            normArr.push(normals[fvert.n][0], normals[fvert.n][1], normals[fvert.n][2]);
          } else {
            normArr.push(fn[0], fn[1], fn[2]);
          }
        }
      }
    }
  }


  var maxV = 0;
  for (var i = 0; i < posArr.length; i++) {
    maxV = Math.max(maxV, Math.abs(posArr[i]));
  }
  if (maxV > 0) {
    for (var i = 0; i < posArr.length; i++) posArr[i] /= maxV;
  }

  var pb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posArr), gl.STATIC_DRAW);

  var nb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normArr), gl.STATIC_DRAW);

  g_objBuf    = { posBuf: pb, normBuf: nb };
  g_objCount  = posArr.length / 3;
  g_objLoaded = true;

  document.getElementById('objInfo').textContent =
    '✓ ' + name + ' | ' + g_objCount.toLocaleString() + ' verts loaded';
}