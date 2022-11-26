import
{
    buildProgramFromSources,
    loadShadersFromURLS,
    setupWebGL
}
from "../../libs/utils.js";
import
{
    ortho,
    lookAt,
    flatten,
    mult,
    rotate,
    rotateX,
    perspective
}
from "../../libs/MV.js";
import
{
    modelView,
    loadMatrix,
    multRotationX,
    multRotationY,
    multRotationZ,
    multScale,
    multTranslation,
    popMatrix,
    pushMatrix
}
from "../../libs/stack.js";
import
{
    GUI
}
from '../../libs/dat.gui.module.js';
import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as SPHERE from '../../libs/objects/sphere.js';

//AUTHOR: Frederico Luz nº 51162

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);
    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;
    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    let mProjection = ortho(-1 * aspect, aspect, -1, 1, 0.01, 3);
    let zoom = 2.5;

    /** Model parameters */

    let engine = false;
    let rotor = 0;
    let velocity = 0;
    let heliY = 0;
    let heliX = 1.7;
    let heliTime = 0;
    let leanAngle = 0;
    let drop = false;
    let canDropAgain = true;
    let time = 0;
    let boxTime = 0;
    let boxY = 0;
    let boxX = 0;
    let boxZ = 0;
    let vBoxY = 0;
    let vBoxX = 0;
    let reduceLean = false;
    let aceleration = 0;
    let increaseVelocity = false;
    let mov = 0;
    let firstperson = false;
    let start = new Date();

    let cameraController = {
        eyeX: 2,
        eyeY: 1.2,
        eyeZ: 1,

        atX: 0,
        atY: 0.5,
        atZ: 0,

        upX: 0,
        upY: 1,
        upZ: 0,

        getViewMatrix: function()
        {
            return lookAt([this.eyeX, this.eyeY, this.eyeZ], [this.atX, this.atY, this.atZ], [this.upX, this.upY, this.upZ]);
        },

        setValues: function(eyeX, eyeY, eyeZ, atX, atY, atZ, upX, upY, upZ)
        {
            this.eyeX = eyeX;
            this.eyeY = eyeY;
            this.eyeZ = eyeZ;
            this.atX = atX;
            this.atY = atY;
            this.atZ = atZ;
            this.upX = upX;
            this.upY = upY;
            this.upZ = upZ;

        }
    };

    let mView = lookAt([cameraController.eyeX, cameraController.eyeY, cameraController.eyeZ], [cameraController.atX, cameraController.atY, cameraController.atZ], [cameraController.upX, cameraController.upY, cameraController.upZ]);
    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeyup = function(e)
    {
        switch (e.key)
        {
            case "ArrowLeft":
                reduceLean = true;
                increaseVelocity = false;
                break;
        }
    }

    document.onkeydown = function(event)
    {
        switch (event.key)
        {
            case '1':
                // exonometric view
                cameraController.setValues(2, 1.2, 1, 0, 0.5, 0, 0, 1, 0);
                break;
            case '2':
                // front view
                cameraController.setValues(-1, 0.6, 0, 0, 0.6, 0, 0, 1, 0);
                break;
            case '3':
                // top view
                cameraController.setValues(0, 1.6, 0, 0, 0.6, 0, 0, 0, -1);
                break;
            case '4':
                // right view
                cameraController.setValues(0, 0.5, 5, 0, 0.2, -5, 0, 1, 0);
                break;
                //put camera on helicopter
            case '5':
                firstperson = !firstperson;
                break;
            case 'w':
                mode = gl.LINES;
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
                heliY < 3 ? heliY += 0.08 : heliY = 3;
                break;
                //case down arrow key engine stop
            case 'ArrowDown':
                if (heliY > 0.009)
                {
                    if (leanAngle >= 10 && heliY < 0.1)
                    {
                        heliY = heliY;
                    }
                    else
                    {
                        heliY -= 0.08;
                    }
                }
                else
                {
                    heliY = 0;
                    engine = false;
                }
                break;
                //case left arrow lean helicopter to front until 30 degrees
            case 'ArrowLeft':
                if (leanAngle <= 30 && engine == true && heliY >= 0.08)
                {
                    leanAngle += 1;
                    increaseVelocity = true;
                }
                break;
                //case right arrow lean helicopter to back until 0 degrees
            case 'ArrowRight':
                if (leanAngle >= 0 && engine == true)
                {
                    leanAngle -= 0.5;
                    increaseVelocity = false;
                    aceleration > 0 ? aceleration -= 0.01 : aceleration = 0;
                }
                break;
                //case spacebar drop a box from helicopter
            case ' ':
                if (canDropAgain == true)
                {
                    drop = true;
                    boxTime = time;
                    boxY = heliY;
                    boxX = heliX;
                    boxZ = mov;
                    vBoxY = 0;
                    vBoxX = velocity;
                }
                break;


        }
    }

    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.enable(gl.DEPTH_TEST); // Enables Z-buffer depth test

    CUBE.init(gl);
    CYLINDER.init(gl);
    SPHERE.init(gl);

    window.requestAnimationFrame(render);

    function setupGUI()
    {
        //manipulate the projection matrix
        let gui = new GUI();

        let eye = gui.addFolder("Eye");
        eye.add(cameraController, "eyeX", -5, 5, 0.1)
        eye.add(cameraController, "eyeY", -5, 5, 0.1)
        eye.add(cameraController, "eyeZ", -5, 5, 0.1)
        eye.open();

        let at = gui.addFolder("At");
        at.add(cameraController, "atX", -5, 5, 0.1)
        at.add(cameraController, "atY", -5, 5, 0.1)
        at.add(cameraController, "atZ", -5, 5, 0.1)
        at.open();

        let up = gui.addFolder("Up");
        up.add(cameraController, "upX", -5, 5, 0.1)
        up.add(cameraController, "upY", -5, 5, 0.1)
        up.add(cameraController, "upZ", -5, 5, 0.1)
        up.open();
    }

    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
        mProjection = ortho(-aspect * zoom, aspect * zoom, -zoom, zoom, 0.01, 3);
    }

    function uploadProjection()
    {
        uploadMatrix("mProjection", mProjection);
    }

    function uploadModelView()
    {
        uploadMatrix("mModelView", modelView());
    }

    function uploadMatrix(name, m)
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }



    function base()
    {
        pushMatrix()
        multScale([4, 0.05, 4]);
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5, 0.5, 0.5, 1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();

    }

    function helicopter()
    {

        // pushMatrix();
        multRotationY(mov);
        multTranslation([heliX, heliY, 0]);
        multRotationX(-leanAngle);
        multRotationY(-90)
        multScale([0.35, 0.35, 0.35]);
        pushMatrix();
        multTranslation([0, 0.6, 0]);
        multScale([1.5, 0.5, 1]);
        //paint the body of the helicopter with a color red
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 0, 0, 1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        //draw the legs ot the helicopter using a cube


        //multScale([0.05,0.5,0.05]);
        pushMatrix();
        multTranslation([0.5, 0.35, 0.2]);
        multRotationX(-30);
        multScale([0.05, 0.5, 0.05]);
        //paint the legs of the helicopter with a color gray
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5, 0.5, 0.5, 1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([0.5, 0.35, -0.2]);
        multRotationX(30);
        multScale([0.05, 0.5, 0.05]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([-0.5, 0.35, 0.2]);
        multRotationX(-30);
        multScale([0.05, 0.5, 0.05]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([-0.5, 0.35, -0.2]);
        multRotationX(30);
        multScale([0.05, 0.5, 0.05]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();

        //draw the cylinder that connect the legs to the body
        pushMatrix();
        multTranslation([0, 0.138, 0.32]);
        multRotationZ(90);
        multRotationY(30);
        multScale([0.1, 1.2, 0.09]);
        //paint the cylinder that connects the legs to the body with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([0, 0.138, -0.32]);
        multRotationZ(90);
        multRotationY(-30);
        multScale([0.1, 1.2, 0.09]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        //draw the tail of the helicopter using a cylinder
        pushMatrix();
        multTranslation([1, 0.65, 0]);
        multRotationX(90);
        multScale([1.6, 0.1, 0.1]);
        //paint the tail of the helicopter with a color red
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 0, 0, 1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();

        //draw the end of the tail using a sphere
        pushMatrix();
        multTranslation([1.75, 0.73, 0]);
        multRotationZ(150);
        multScale([0.15, 0.2, 0.02]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();

        //draw the helices in the tail of the helicopter using a cylinder
        pushMatrix();
        multTranslation([1.8, 0.78, 0.05]);
        multRotationX(90);
        multRotationY(rotor);
        multScale([0.05, 0.09, 0.05]);
        //paint the rotor of the helicopter with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        pushMatrix() //draw the helices in the tail of the helicopter using a Sphere
        multTranslation([1.8, 0.78, 0.09]);
        multRotationZ(rotor);
        pushMatrix();
        multScale([0.3, 0.05, 0.01]);
        //paint the rotor of the helicopter with a color blue
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0, 0, 1, 1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        //draw the helices in the tail of the helicopter using a cylinder
        pushMatrix();
        multScale([0.05, 0.3, 0.01]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        popMatrix();

        //rotate the helicopter while the engine is on
        multRotationY(rotor);
        multTranslation([0, -0.1, 0]);
        pushMatrix();
        //draw the rotor of the helicopter using a cylinder
        pushMatrix();
        multTranslation([0, 0.8, 0]);
        multScale([0.1, 0.5, 0.1]);
        //paint the rotor of the helicopter with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        //draw the helices of the helicopter using a cylinder
        multTranslation([0, 1.045, 0]);
        multRotationZ(90);
        pushMatrix();
        multScale([0.01, 2.5, 0.1]);
        //paint the rotor of the helicopter with a color blue
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0, 0, 1, 1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        //draw the other helices of the helicopter using a cylinder
        pushMatrix();
        multRotationX(90);
        multScale([0.01, 2.5, 0.1]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
    }

    function building()
    {
        //draw the base of the building using a cube
        pushMatrix();
        multTranslation([0, 1, 0]);
        multScale([1, 2.5, 1]);
        //paint the base of the building with a color gray 
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5, 0.5, 0.9, 1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the top of the building using a cube
        pushMatrix();
        multTranslation([0, 2, 0]);
        multScale([0.7, 2, 0.7]);
        //paint the top of the building with a color gray
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw other top of the building using a cube
        pushMatrix();
        multTranslation([0, 2.7, 0]);
        multScale([0.35, 2, 0.35]);
        //paint the top of the building with a color gray
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the top of the building using a cube
        pushMatrix();
        multTranslation([0, 3.4, 0]);
        multScale([0.15, 0.7, 0.15]);
        //paint the top of the building with a color yellow
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //make a loop to draw the windows on the building with 15 cubes
        var wh = 0;
        var ww = 0;
        //  for(i=0;i<3;i++){
        for (var k = 0; k < 3; k++)
        {
            for (var j = 0; j < 6; j++)
            {
                pushMatrix();
                multTranslation([0.3 - ww, 0.05 + wh, 0]);
                multScale([0.2, 0.2, 1.1]);
                gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
                wh += 0.4;
            }
            ww += 0.3;
            wh = 0;
        }
        var wh2 = 0;
        var ww2 = 0;

        for (var k = 0; k < 3; k++)
        {
            for (var j = 0; j < 6; j++)
            {
                pushMatrix();
                multTranslation([0, 0.05 + wh2, -0.3 + ww2]);
                multScale([1.1, 0.2, 0.2]);
                gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
                wh2 += 0.4;
            }
            ww2 += 0.3;
            wh2 = 0;
        }

        //draw windows on the top of the building using a cube with a loop
        var wh3 = 0;
        var ww3 = 0;
        for (var k = 0; k < 2; k++)
        {
            for (var j = 0; j < 2; j++)
            {
                pushMatrix();
                multTranslation([0.15 - ww3, 2.4 + wh3, 0]);
                multScale([0.2, 0.2, 0.85]);
                gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
                wh3 += 0.4;
            }
            ww3 += 0.3;
            wh3 = 0;
        }

        var wh4 = 0;
        var ww4 = 0;
        for (var k = 0; k < 2; k++)
        {
            for (var j = 0; j < 2; j++)
            {
                pushMatrix();
                multTranslation([0, 2.4 + wh4, -0.15 + ww4]);
                multScale([0.85, 0.2, 0.2]);
                gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
                wh4 += 0.4;
            }
            ww4 += 0.3;
            wh4 = 0;
        }


    }

    function buildings()
    {
        pushMatrix();
        multTranslation([1.77, 0.15, -1.7]);
        multScale([0.5, 0.5, 0.5]);
        uploadModelView();
        building();
        popMatrix();
        pushMatrix();
        multTranslation([-1.77, 0.15, 1.8]);
        multScale([0.5, 0.5, 0.5]);
        uploadModelView();
        building();
        popMatrix();
        pushMatrix();
        multTranslation([1.77, 0.15, 1.8]);
        multScale([0.5, 0.5, 0.5]);
        uploadModelView();
        building();
        popMatrix();
        pushMatrix();
        multTranslation([-1.77, 0.15, -1.7]);
        multScale([0.5, 0.5, 0.5]);
        uploadModelView();
        building();
        popMatrix();
    }

    function moon()
    {
        pushMatrix();
        multTranslation([0, 0, 0]);
        multScale([0.1, 0.1, 0.1]);
        uploadModelView();
        pushMatrix();
        multTranslation([-10, 30, 30]);
        multScale([5, 5, 5]);
        //paint color of moon with color gray
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0.5, 0.5, 0.5, 1.0]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        popMatrix();
    }

    function road()
    {
        pushMatrix();
        multTranslation([0, 0, 0]);
        multScale([4.1, 0.09, 1]);
        uploadModelView();
        //paint color of road with color black
        gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [0, 0, 0, 1.0]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        //draw the 3 lines on the road using a cube loop
        var wh = 0;
        for (var k = 0; k < 7; k++)
        {
            pushMatrix();
            multTranslation([-1.8 + wh, 0.05, 0]);
            multScale([0.4, 0.01, 0.1]);
            gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 1, 1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
            popMatrix();
            wh += 0.6;
        }

    }

    function dropbox()
    {
        //drop a box from the helicopter if engine is on and box fall with gravity for 5 seconds
        var timeToLive = Math.max((time - boxTime) / 1000, 5);
        if (engine && timeToLive <= 5)
        {
            canDropAgain = false;
            //apply gravity on boxY v0t−gt22
            let g = 10;

            if (boxY > 0.2)
            {
                let t = (time - boxTime) / 1000;
                boxY -= vBoxY * t + g * t * t / 2;
                boxY = Math.max(boxY, 0.2);
                boxZ += vBoxX + 0.1 * t;
            }
            else
            {
                boxY = 0.1;
            }
            pushMatrix();
            multRotationY(boxZ);
            multTranslation([boxX, boxY, 0]);
            multScale([0.1, 0.1, 0.1]);
            //paint color of box with color yellow
            gl.uniform4fv(gl.getUniformLocation(program, "uColor"), [1, 1, 0, 1.0]);
            uploadModelView();
            CUBE.draw(gl, program, mode);
            popMatrix();
        }
        else
        {
            boxX = heliX;
            boxY = heliY;
            vBoxY = 0;
            vBoxX = velocity;
            drop = false;
            canDropAgain = true;
        }
    }

    setupGUI();

    function render()
    {
        window.requestAnimationFrame(render);
        var now = new Date().getTime();
        time = now - start;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        // Send the mProjection matrix to the GLSL program
        mProjection = ortho(-aspect * zoom, aspect * zoom, -zoom, zoom, -7, 7);

        uploadProjection(mProjection);

        // Load the ModelView matrix with the Worl to Camera (View) matrix
        mView = cameraController.getViewMatrix();

        loadMatrix(mView);

        // Draw the base for the scene
        multTranslation([0, 0, 0]);
        pushMatrix();
        base();
        //draw 4 houses
        buildings();
        //draw the sun
        moon();
        //draw road
        road();
        if (engine)
        {
            //rotate the helicopter while the engine is on
            rotor > 360 ? rotor = 0 : rotor += 30;
        }
        heliY === 0 ? engine = false : null;
        if (reduceLean)
        {
            leanAngle = Math.max(leanAngle - 0.5, 0);
            leanAngle == 0 ? reduceLean = false : reduceLean = true;
        }
        if (increaseVelocity && engine)
        {
            if (velocity < 4)
            {
                velocity = velocity + aceleration * heliTime;
                heliTime += 0.01;
                aceleration < 3 ? aceleration += 0.005 : aceleration = 3;
            }
            mov += velocity;
        }
        else
        {
            if (velocity > 0 && engine)
            {
                velocity -= 0.1;
                mov += velocity;
            }
            else
            {
                velocity = 0;
                aceleration = 0;
                heliTime = 0;
            }
        }

        drop ? dropbox() : null;

        pushMatrix();
        helicopter();
        popMatrix();
        popMatrix();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders));
