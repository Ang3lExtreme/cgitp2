import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, mult, rotate, rotateX } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as SPHERE from '../../libs/objects/sphere.js';



function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    //let mProjection = ortho(-1*aspect,aspect, -1,0.5,0,3);
    //let mView = lookAt([1, 1, 1], [0, 0, 0], [0, 1, 0]);
    let mProjection = ortho(-1*aspect,aspect, -1, 1,0.01,3);
    let mView = lookAt([2, 1.2, 1], [0, 0.5, 0], [0, 1, 0]);

    let zoom =2.5;

    /** Model parameters */
  
    let engine = false;
    let rotor = 0;
    let velocity = 0;
    let baseHeli = 0.009;
    let leanAngle = 0;
    let goFoward = 0;
    let drop = false;
    let time = 0;
    let boxY = 0;
    let boxX = 0;



    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case '1':
                // Front view
                mView = lookAt([0,0.6,1], [0,0.6,0], [0,1,0]);
                break;
            case '2':
                // Top view
                mView = lookAt([0,1.6,0],  [0,0.6,0], [0,0,-1]);
                break;
            case '3':
                // Right view
                mView = lookAt([1, 0.6, 0.], [0, 0.6, 0], [0, 1, 0]);
                break;
            case '4':
                mView = lookAt([2, 1.2, 1], [0, 0.6, 0], [0, 1, 0]);
                break;
            case 'w':
                mode = gl.LINES; 
                console.log("Wireframe mode");
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case '+':
                zoom /= 1.1;
                break;
            case '-':
                zoom *= 1.1;
                break;
            //case up arrow key engine start
            case 'ArrowUp':
                engine = true;
                if(baseHeli < 3){
                baseHeli+=0.01;
                boxY=baseHeli;
                }
                console.log("engine start");
                break;
            //case down arrow key engine stop
            case 'ArrowDown':
                if(baseHeli > 0.009){
                baseHeli-=0.009;
                boxY=baseHeli;
                console.log("baseHeli",baseHeli)
                }
                else{
                    engine = false;
                }
                console.log("engine stop");
                break;
            //case left arrow lean helicopter to front until 30 degrees
            case 'ArrowLeft':
                if(leanAngle <= 30 && engine == true){
                    
                    leanAngle+=1;
                    goFoward-=0.05;
                    boxX=goFoward-0.1;
                    
                    console.log("leanAngle",leanAngle)
                    console.log("goFoward",goFoward)
                }
                break;
            //case right arrow lean helicopter to back until 0 degrees
            case 'ArrowRight':
                if(leanAngle >= 0 && engine == true ){
                    leanAngle-=1;
                    //goFoward=0;
                   // goFoward-=0.1;
                   console.log("leanAngle",leanAngle)
                }
                break;
            //case spacebar drop a box from helicopter
            case ' ':
                console.log("spacebar");
                drop = true;
                break;



        }
    }

    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    CUBE.init(gl);
    CYLINDER.init(gl);
    SPHERE.init(gl);

    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-aspect*zoom,aspect*zoom, -zoom, zoom,0.01,3);
    }

    function uploadProjection()
    {
        uploadMatrix("mProjection", mProjection);
    }

    function uploadModelView()
    {
        uploadMatrix("mModelView", modelView());
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }



    function base()
    {
        pushMatrix()
        multScale([4, 0.05, 4]);
        multTranslation([0, 0, 0]);
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5,0.5,0.5,1.0]);
        uploadModelView();
        //paint the base of the helicopter with a color black
        CUBE.draw(gl, program, mode);
        popMatrix();
       
    }

    function helicopter(){
        
        multRotationY(velocity);
        multRotationZ(leanAngle);
        multTranslation([goFoward, baseHeli, 0]);
        multScale([0.5, 0.5, 0.5]);
        pushMatrix();
        multTranslation([0,0.6,0]);
        multScale([1.5,0.5,1]);
        //paint the body of the helicopter with a color red
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 0, 0,1.0]);
        uploadModelView();
        
        SPHERE.draw(gl, program, mode);
        popMatrix();
        //draw the legs ot the helicopter using a cube
        pushMatrix();
        multTranslation([0.5,0.35,0.2]);
        multRotationX(-30);
        multScale([0.05,0.5,0.05]);
        //paint the legs of the helicopter with a color gray
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5, 0.5, 0.5,1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.5,0.35,-0.2]);
        multRotationX(30);
        multScale([0.05,0.5,0.05]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.5,0.35,0.2]);
        multRotationX(-30);
        multScale([0.05,0.5,0.05]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.5,0.35,-0.2]);
        multRotationX(30);
        multScale([0.05,0.5,0.05]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the cubes that connect the legs to the body
        pushMatrix();
        multTranslation([0,0.138,0.32]);
        multRotationZ(90);
        multRotationY(30);
        multScale([0.02,1,0.05]);
        //paint the cylinder that connects the legs to the body with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0,0.138,-0.32]);
        multRotationZ(90);
        multRotationY(-30);
        multScale([0.02,1,0.05]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        //draw the tail of the helicopter using a cylinder
        pushMatrix();
        multTranslation([1,0.65,0]);
        multRotationX(90);
        multScale([1.6,0.1,0.1]);
        //paint the tail of the helicopter with a color red
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 0, 0,1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();

        //draw the end of the tail using a sphere
        pushMatrix();
        multTranslation([1.75,0.73,0]);
        multRotationZ(150);
        multScale([0.15,0.2,0.02]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();

        pushMatrix();

        //draw the helices in the tail of the helicopter using a cylinder
        pushMatrix();
        multTranslation([1.8,0.78,0.05]);
        multRotationX(90);
        multRotationY(rotor);
        multScale([0.05,0.09,0.05]);
        //paint the rotor of the helicopter with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        //draw the helices in the tail of the helicopter using a Sphere
        pushMatrix();
        multTranslation([1.8,0.78,0.09]);
        multRotationZ(rotor);

        multScale([0.3,0.05,0.01]);
        //paint the rotor of the helicopter with a color blue
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0, 0, 1,1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        //draw the helices in the tail of the helicopter using a cylinder
        pushMatrix();
        multTranslation([1.8,0.78,0.09]);
        multRotationZ(rotor);
        multScale([0.05,0.3,0.01]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();

        popMatrix();








        //rotate the helicopter while the engine is on
        multRotationY(rotor);
        pushMatrix();
        //draw the rotor of the helicopter using a cylinder
        multTranslation([0,-0.1,0]);
        pushMatrix();
        multTranslation([0,0.8,0]);
        multScale([0.1,0.5,0.1]);
        //paint the rotor of the helicopter with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        //draw the helices of the helicopter using a cylinder
        pushMatrix();
        multTranslation([0,1.045,0]);
        multRotationZ(90);
        multScale([0.01,2.5,0.1]);
        //paint the rotor of the helicopter with a color blue
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0, 0, 1,1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        //draw the other helices of the helicopter using a cylinder
        pushMatrix();
        multTranslation([0,1.045,0]);
        multRotationZ(90);
        multRotationX(90);
        multScale([0.01,2.5,0.1]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        popMatrix();
    }

    function building(){
        //draw the base of the building using a cube
        pushMatrix();
        multTranslation([0,1,0]);
        multScale([1,2.5,1]);
        //paint the base of the building with a color gray 
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5, 0.5, 0.9,1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the top of the building using a cube
        pushMatrix();
        multTranslation([0,2,0]);
        multScale([0.7,2,0.7]);
        //paint the top of the building with a color gray
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw other top of the building using a cube
        pushMatrix();
        multTranslation([0,2.7,0]);
        multScale([0.35,2,0.35]);
        //paint the top of the building with a color gray
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the top of the building using a cube
        pushMatrix();
        multTranslation([0,3.4,0]);
        multScale([0.15,0.7,0.15]);
        //paint the top of the building with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    

        //make a loop to draw the windows on the building with 15 cubes
      var wh=0;
        var ww=0;
      //  for(i=0;i<3;i++){
          for(var k=0;k<3;k++){
            for(var j=0;j<6;j++){
                pushMatrix();
                multTranslation([0.3-ww,0.05+wh,0]);
                multScale([0.2,0.2,1.1]);
                gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
                wh+=0.4;
                
                }
                ww+=0.3;
                wh=0;
          }
    
          var wh2=0;
          var ww2=0;
      //  for(i=0;i<3;i++){
          for(var k=0;k<3;k++){
            for(var j=0;j<6;j++){
                pushMatrix();
                multTranslation([0,0.05+wh2,-0.3+ww2]);
                multScale([1.1,0.2,0.2]);
                gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
                wh2+=0.4;
                
                }
                ww2+=0.3;
                wh2=0;
          }

          //draw windows on the top of the building using a cube with a loop
            var wh3=0;
            var ww3=0;
            for(var k=0;k<2;k++){
                for(var j=0;j<2;j++){
                    pushMatrix();
                    multTranslation([0.15-ww3,2.4+wh3,0]);
                    multScale([0.2,0.2,0.85]);
                    gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
                    popMatrix();
                    wh3+=0.4;
                    
                    }
                    ww3+=0.3;
                    wh3=0;
                }
            
            var wh4=0;
            var ww4=0;
            for(var k=0;k<2;k++){
                for(var j=0;j<2;j++){
                    pushMatrix();
                    multTranslation([0,2.4+wh4,-0.15+ww4]);
                    multScale([0.85,0.2,0.2]);
                    gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0,1.0]);
                    uploadModelView();
                    CUBE.draw(gl, program, mode);
                    popMatrix();
                    wh4+=0.4;
                        
                }
                ww4+=0.3;
                wh4=0;
            }
           
       
    }

    function buildings(){
        pushMatrix();
        multTranslation([1.1,0.15,-1.5]);
        multScale([0.5,0.5,0.5]);
        uploadModelView();
        building();
        popMatrix();
        pushMatrix();
        multTranslation([-1.2,0.15,1.5]);
        multScale([0.5,0.5,0.5]);
        uploadModelView();
        building();
        popMatrix();
        pushMatrix();
        multTranslation([1.2,0.15,1.5]);
        multScale([0.5,0.5,0.5]);
        uploadModelView();
        building();
        popMatrix();
        pushMatrix();
        multTranslation([-1.2,0.15,-1.5]);
        multScale([0.5,0.5,0.5]);
        uploadModelView();
        building();
        popMatrix();
    }

    function moon(){
        pushMatrix();
        multTranslation([0,0,0]);
        multScale([0.1,0.1,0.1]);
        uploadModelView();
        pushMatrix();
        multTranslation([-10,30,30]);
        multScale([5,5,5]);
        //paint color of moon with color gray
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5,0.5,0.5,1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        popMatrix();
    }

   function road(){
        pushMatrix();
        multTranslation([0,0,0]);
        multScale([4.1,0.09,1]);
        uploadModelView();
        //paint color of road with color black
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0,0,0,1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the 3 lines on the road using a cube loop
        var wh=0;
        for(var k=0;k<4;k++){
            pushMatrix();
            multTranslation([0+wh,0.05,0]);
            multScale([0.4,0.01,0.1]);
            gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1,1,1,1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
            popMatrix();
            wh+=0.6;
        }
        wh=0;
        for(var k=0;k<4;k++){
            pushMatrix();
            multTranslation([0-wh,0.05,0]);
            multScale([0.4,0.01,0.1]);
            gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1,1,1,1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
            popMatrix();
            wh+=0.6;
        }
   
    }

    function dropbox(){
        //drop a box from the helicopter if engine is on and box fall with gravity for 5 seconds
        if(engine==true&&time<5&&boxY>-0.5){
            
            time+=0.005;
            //apply gravity on boxY v0t−gt22
            let g = 9.80665;
            let v0 = 0;

            boxY += v0*time - 0.5*g*time*time;
           pushMatrix();
           multRotationY(velocity);

           multRotationZ(leanAngle)
              multTranslation([boxX,boxY+0.1,0]);
                multScale([0.2,0.2,0.2]);
                //paint color of box with color yellow
                gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1,1,0,1.0]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
          
            
        }
        //if box fall for 5 seconds, reset the box to the helicopter
        else{
        time=0;
        boxY=baseHeli;
        boxX=goFoward;
        drop=false;
        }
        
    }
    
 


    
    

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        // Send the mProjection matrix to the GLSL program
        mProjection = ortho(-aspect*zoom,aspect*zoom, -zoom, zoom,0,5);
        uploadProjection(mProjection);


        // Load the ModelView matrix with the Worl to Camera (View) matrix
        loadMatrix(mView);

        

        
        // Draw the base for the scene
        pushMatrix();
        
        base();
        //draw 4 houses
        buildings();
        //draw the sun
        moon();
        //draw road
        road();

        if(engine){
            //rotate the helicopter while the engine is on
            rotor += 20;
            if(rotor > 360){
                rotor = 0;
            }
            velocity += 0.3;
        }
        if(baseHeli === 0.009){
            engine = false;
        }
        //paint the helicopter color gray
        
        
        if(drop){
            dropbox();
        }
        
        helicopter();
    
        
        popMatrix();
       





           

    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))