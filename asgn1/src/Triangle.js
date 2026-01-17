// Triangle.js

function drawTriangle(vertices) {
  // vertices = [x1,y1, x2,y2, x3,y3]

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Triangles use buffered attribute
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

class Triangle {
  constructor(color, vertices) {
    this.color = color;
    this.vertices = vertices;
  }

  render() {
    gl.uniform4f(
      u_FragColor,
      this.color[0], this.color[1], this.color[2], this.color[3]
    );
    drawTriangle(this.vertices);
  }
}
