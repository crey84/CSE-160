// DrawTriangle.js (c) 2012 matsuda
let canvas;
let ctx;


function main() {
  canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return false;
  }

  ctx = canvas.getContext('2d');

  // Clear to black
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}


function drawVector(ctx, canvas, v, color) {
  const ox = canvas.width / 2;   // 200
  const oy = canvas.height / 2;  // 200
  const scale = 20;

  const x = ox + v.elements[0] * scale;
  const y = oy - v.elements[1] * scale; // flip y because canvas y goes down

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(x, y);   // <-- required
  ctx.stroke();
}

function handleDrawEvent() {
  // Clear canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read v1 inputs
  const v1x = parseFloat(document.getElementById("v1x").value);
  const v1y = parseFloat(document.getElementById("v1y").value);
  const v1 = new Vector3([v1x, v1y, 0]);

  // Read v2 inputs
  const v2x = parseFloat(document.getElementById("v2x").value);
  const v2y = parseFloat(document.getElementById("v2y").value);
  const v2 = new Vector3([v2x, v2y, 0]);

  // Draw both vectors
  drawVector(ctx, canvas, v1, "red");
  drawVector(ctx, canvas, v2, "blue");
}

function handleDrawOperationEvent() {
  // Clear canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read v1
  const v1x = parseFloat(document.getElementById("v1x").value);
  const v1y = parseFloat(document.getElementById("v1y").value);
  const v1 = new Vector3([v1x, v1y, 0]);

  // Read v2
  const v2x = parseFloat(document.getElementById("v2x").value);
  const v2y = parseFloat(document.getElementById("v2y").value);
  const v2 = new Vector3([v2x, v2y, 0]);

  // Draw originals
  drawVector(ctx, canvas, v1, "red");
  drawVector(ctx, canvas, v2, "blue");

  // Read operation + scalar
  const op = document.getElementById("op").value;
  const s = parseFloat(document.getElementById("scalar").value);

  if (op === "add") {
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(ctx, canvas, v3, "green");
  } else if (op === "sub") {
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(ctx, canvas, v3, "green");
  } else if (op === "mul") {
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    const v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.mul(s);
    v4.mul(s);
    drawVector(ctx, canvas, v3, "green");
    drawVector(ctx, canvas, v4, "green");
  } else if (op === "div") {
    const v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    const v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.div(s);
    v4.div(s);
    drawVector(ctx, canvas, v3, "green");
    drawVector(ctx, canvas, v4, "green");
  } else if (op === "magnitude") {
    console.log("||v1|| =", v1.magnitude());
    console.log("||v2|| =", v2.magnitude());

  } else if (op === "normalize") {
    const a = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    const b = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    a.normalize();
    b.normalize();
    drawVector(ctx, canvas, a, "green");
    drawVector(ctx, canvas, b, "green");
  } else if (op === "angle") {
  const angle = angleBetween(v1, v2);
  console.log("Angle between v1 and v2 =", angle, "degrees");

} else if (op === "area") {
  const area = areaTriangle(v1, v2);
  console.log("Triangle area =", area);
}
}

function angleBetween(v1, v2) {
  const dot = Vector3.dot(v1, v2);
  const m1 = v1.magnitude();
  const m2 = v2.magnitude();

  if (m1 === 0 || m2 === 0) return NaN;

  let cosAlpha = dot / (m1 * m2);

  // Clamp to avoid floating-point errors
  cosAlpha = Math.max(-1, Math.min(1, cosAlpha));

  const radians = Math.acos(cosAlpha);
  const degrees = radians * (180 / Math.PI);

  return degrees;
}


function areaTriangle(v1, v2) {
  const crossVec = Vector3.cross(v1, v2);
  const parallelogramArea = crossVec.magnitude();
  return parallelogramArea / 2;
}




