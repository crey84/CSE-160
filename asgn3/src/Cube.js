

class Cube {
    constructor() {
        this.modelMatrix = new Matrix4();
        this.color = [1, 1, 1, 1];
        this.textureNum = -1; 
    }
    
    setColor(r, g, b, a) {
        this.color = [r, g, b, a];
        return this;
    }
    
    setTexture(num) {
        this.textureNum = num;
        return this;
    }
    
    render(gl, a_Position, a_UV, u_ModelMatrix, u_UseTexture, u_WhichTexture, u_Color) {
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
        
       
        if (this.textureNum >= 0) {
            gl.uniform1i(u_UseTexture, 1);
            gl.uniform1i(u_WhichTexture, this.textureNum);
        } else {
            gl.uniform1i(u_UseTexture, 0);
            gl.uniform4fv(u_Color, this.color);
        }
        
        
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
}


function initCubeBuffers(gl) {
    
    var vertices = new Float32Array([
     
        -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,
        -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
        
        -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5, -0.5,
        -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5, -0.5,
      
        -0.5,  0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,  0.5,  0.5,  0.5,  0.5,  0.5, -0.5,
        
        -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, -0.5,  0.5,
        -0.5, -0.5, -0.5,  0.5, -0.5,  0.5, -0.5, -0.5,  0.5,
      
         0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5,  0.5,
         0.5, -0.5, -0.5,  0.5,  0.5,  0.5,  0.5, -0.5,  0.5,
        
        -0.5, -0.5, -0.5, -0.5, -0.5,  0.5, -0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5, -0.5,  0.5,  0.5, -0.5,  0.5, -0.5
    ]);
    
  
    var uvs = new Float32Array([
      
        0, 0,  1, 0,  1, 1,  0, 0,  1, 1,  0, 1,
      
        0, 0,  0, 1,  1, 1,  0, 0,  1, 1,  1, 0,
       
        0, 0,  0, 1,  1, 1,  0, 0,  1, 1,  1, 0,
       
        0, 0,  1, 0,  1, 1,  0, 0,  1, 1,  0, 1,
       
        0, 0,  0, 1,  1, 1,  0, 0,  1, 1,  1, 0,
     
        0, 0,  1, 0,  1, 1,  0, 0,  1, 1,  0, 1
    ]);
    
 
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create vertex buffer');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    

    var uvBuffer = gl.createBuffer();
    if (!uvBuffer) {
        console.log('Failed to create UV buffer');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    
    var a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get a_UV');
        return -1;
    }
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    return 36; 
}
