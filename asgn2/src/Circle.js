// Circle.js

class Circle {
  constructor(position, color, size, segments) {
    this.position = position;   // [x,y]
    this.color = color;         // [r,g,b,a]
    this.size = size;           // number
    this.segments = segments;   // integer
  }

  render() {
    const [cx, cy] = this.position;

    // Convert size slider into clip-space radius
    const r = this.size / 200; // same scaling style as triangle brush

    gl.uniform4f(
      u_FragColor,
      this.color[0], this.color[1], this.color[2], this.color[3]
    );

    // Draw circle as triangles around center
    const step = (2 * Math.PI) / this.segments;
    for (let i = 0; i < this.segments; i++) {
      const a0 = i * step;
      const a1 = (i + 1) * step;

      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);

      drawTriangle([
        cx, cy,
        x0, y0,
        x1, y1
      ]);
    }
  }
}
