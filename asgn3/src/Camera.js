
class Camera {
    constructor() {
        
        this.fov = 60;
        this.eye = new Vector3([1, .5, 8]);  
        this.at = new Vector3([0, .5, 0]);   
        this.up = new Vector3([0, 1, 0]);     
        
        
        this.speed = 0.15;
        this.rotationSpeed = 2;
        this.mouseSensitivity = 0.2;
        
        
        this.velocityY = 0;
        this.gravity = 0.02;
        this.isGrounded = true;
        this.jumpStrength = 0.3;
        
       
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }
    
    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }
    
    updateProjectionMatrix() {
        let canvas = document.getElementById('webgl');
        this.projectionMatrix.setPerspective(
            this.fov,
            canvas.width / canvas.height,
            0.1,
            1000
        );
    }
    

    getForward() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.elements[1] = 0; 
        f.normalize();
        return f;
    }
    

    getRight() {
        let f = this.getForward();
        let r = new Vector3();
        r.set(this.up);
        r = this.cross(f, r);
        r.normalize();
        return r;
    }
  
    cross(a, b) {
        let result = new Vector3();
        result.elements[0] = a.elements[1] * b.elements[2] - a.elements[2] * b.elements[1];
        result.elements[1] = a.elements[2] * b.elements[0] - a.elements[0] * b.elements[2];
        result.elements[2] = a.elements[0] * b.elements[1] - a.elements[1] * b.elements[0];
        return result;
    }
    
    // Movement
    moveForward() {
        let f = this.getForward();
        f.mul(this.speed);
        this.eye.add(f);
        this.at.add(f);
    }
    
    moveBackward() {
        let f = this.getForward();
        f.mul(-this.speed);
        this.eye.add(f);
        this.at.add(f);
    }
    
    moveLeft() {
        let r = this.getRight();
        r.mul(-this.speed);
        this.eye.add(r);
        this.at.add(r);
    }
    
    moveRight() {
        let r = this.getRight();
        r.mul(this.speed);
        this.eye.add(r);
        this.at.add(r);
    }
    
    // Rotation 
    panLeft() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        let f_prime = rotationMatrix.multiplyVector3(f);
        
        this.at.set(this.eye);
        this.at.add(f_prime);
    }
    
    panRight() {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(-this.rotationSpeed, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        
        let f_prime = rotationMatrix.multiplyVector3(f);
        
        this.at.set(this.eye);
        this.at.add(f_prime);
    }
    
    // Mouse rotation
    mouseRotate(deltaX, deltaY) {
       
        if (deltaX !== 0) {
            let f = new Vector3();
            f.set(this.at);
            f.sub(this.eye);
            
            let angle = -deltaX * this.mouseSensitivity;
            let rotationMatrix = new Matrix4();
            rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
            
            let f_prime = rotationMatrix.multiplyVector3(f);
            
            this.at.set(this.eye);
            this.at.add(f_prime);
        }
        
        
        if (deltaY !== 0) {
            let f = new Vector3();
            f.set(this.at);
            f.sub(this.eye);
            
            let right = this.getRight();
            let angle = -deltaY * this.mouseSensitivity;
            
            let rotationMatrix = new Matrix4();
            rotationMatrix.setRotate(angle, right.elements[0], right.elements[1], right.elements[2]);
            
            let f_prime = rotationMatrix.multiplyVector3(f);
            
            
            let pitch = Math.asin(f_prime.elements[1] / Math.sqrt(
                f_prime.elements[0] * f_prime.elements[0] +
                f_prime.elements[1] * f_prime.elements[1] +
                f_prime.elements[2] * f_prime.elements[2]
            ));
            
            if (Math.abs(pitch) < Math.PI / 2 - 0.1) {
                this.at.set(this.eye);
                this.at.add(f_prime);
            }
        }
    }
    
  
    jump() {
        if (this.isGrounded) {
            this.velocityY = this.jumpStrength;
            this.isGrounded = false;
        }
    }
    
   
    applyGravity() {
        if (!this.isGrounded) {
            this.velocityY -= this.gravity;
            this.eye.elements[1] += this.velocityY;
            this.at.elements[1] += this.velocityY;
            
            
            if (this.eye.elements[1] <= .5) {
                this.eye.elements[1] = .5;
                this.at.elements[1] = .5 + (this.at.elements[1] - this.eye.elements[1]);
                this.velocityY = 0;
                this.isGrounded = true;
            }
        }
    }
    

    getBlockInFront(distance = 4) {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        f.mul(distance); 
        
        let targetPos = new Vector3();
        targetPos.set(this.eye);
        targetPos.add(f);
        
        return {
            x: Math.floor(targetPos.elements[0]),
            y: Math.floor(targetPos.elements[1]),
            z: Math.floor(targetPos.elements[2])
        };
    }

    raycastBlock(world, maxDistance = 10) {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye);
        f.normalize();
        
       
        let step = 0.1;
        for (let dist = 0; dist < maxDistance; dist += step) {
            let checkPos = new Vector3();
            checkPos.set(this.eye);
            
            let scaled = new Vector3();
            scaled.set(f);
            scaled.mul(dist);
            checkPos.add(scaled);
            
            let x = Math.floor(checkPos.elements[0]);
            let y = Math.floor(checkPos.elements[1]);
            let z = Math.floor(checkPos.elements[2]);
            
            
            if (x >= 0 && x < 32 && z >= 0 && z < 32 && y >= 0 && y < 10) {
                if (world[x] && world[x][z] && world[x][z][y]) {
                    
                    return { x, y, z, hit: true };
                }
            }
        }
        
        
        return { x: 0, y: 0, z: 0, hit: false };
    }
}
