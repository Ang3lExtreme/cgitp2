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

    let mProjection = ortho(-1*aspect,aspect, -1, 1,0.01,);
    let mView = lookAt([1, 1, 1], [0, 0, 0], [0, 1, 0]);

    let zoom = 1.5;

    /** Model parameters */
  
    let engine = false;
    let rotor = 0;
    let baseHeli = -0.009;


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
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case 'p':
                ag = Math.min(0.050, ag + 0.005);
                break;
            case 'o':
                ag = Math.max(0, ag - 0.005);
                break;
            case 'q':
                rg += 1;
                break;
            case 'e':
                rg -= 1;
                break;
            case 'w':
                rc = Math.min(120, rc+1);
                break;
            case 's':
                rc = Math.max(-120, rc-1);
                break;
            case 'a':
                rb -= 1;
                break;
            case 'd':
                rb += 1;
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
                baseHeli+=0.01;
                console.log("engine start");
                break;
            //case down arrow key engine stop
            case 'ArrowDown':
                if(baseHeli >= -0.009){
                baseHeli-=0.01;
                }
                else{
                    engine = false;
                }
                console.log("engine stop");
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
        multScale([3, 0.05, 3]);
        multTranslation([0, 0, 0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
       
    }

    function helicopter(){
        multTranslation([0, baseHeli, 0]);
        multScale([0.3, 0.3, 0.3]);
        pushMatrix();
        multTranslation([0,0.6,0]);
        multScale([1.5,0.5,1]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        //draw the legs ot the helicopter using a cube
        pushMatrix();
        multTranslation([0.5,0.35,0.2]);
        multRotationX(-30);
        multScale([0.05,0.5,0.05]);
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
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        //draw the helices in the tail of the helicopter using a Sphere
        pushMatrix();
        multTranslation([1.8,0.78,0.09]);
        multRotationZ(rotor);

        multScale([0.3,0.05,0.01]);
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
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        //draw the helices of the helicopter using a cylinder
        pushMatrix();
        multTranslation([0,1.045,0]);
        multRotationZ(90);
        multScale([0.01,2.5,0.1]);
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
        multTranslation([0,0.5,0]);
        multScale([1,1.5,1]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the top of the building using a cube
        pushMatrix();
        multTranslation([0,1.5,0]);
        multScale([0.5,2,0.5]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
   
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
        //draw 5 houses
        pushMatrix();
        multTranslation([1.1,0.15,-0.9]);
        multScale([0.5,0.5,0.5]);
        uploadModelView();
        building();
        popMatrix();

      
        
        if(engine){
            //rotate the helicopter while the engine is on
            rotor += 20;
            if(rotor > 360){
                rotor = 0;
            }
        }
        if(baseHeli === -0.009){
            engine = false;
        }
        helicopter();
      


        popMatrix();
       





           
                //draw the left wing


    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))