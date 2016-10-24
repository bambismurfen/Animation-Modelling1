/**
 * Authors:
 * Andreas Andersson n9795383
 * Li-Fu Hsu n9380418
 */

var gl;
var index=0;
var storeIndex=0;
var wingFlap=true;
var moveX=0.0, moveY=0.0, moveZ=0.0;
var moveSpeed=0.0;
var program;
var modelList=[];

//Buffers
var leftWingBuffer, leftLegBuffer, leftArmBuffer,leftEarBuffer,
    rightWingBuffer, rightLegBuffer, rightArmBuffer, rightEarBuffer,
    bellyBuffer, eyesMouthBuffer;

//Indexes/Enums
var leftWing=0, leftLeg=1, leftArm=2, leftEar=3, rightWing=4,
    rightLeg=5, rightArm=6, rightEar=7, belly=8, eyesMouth=9;

var numNodes = 10;
var theta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //All the angles for the joints
var stack = [];
var figure = [];

var projectionMatrix;
var modelViewMatrix;
var instanceMatrix;
var modelViewMatrixLoc;

var fall=false;
var rise=false;
var translateBelly=[3];


//Init tree nodes:
for( var i=0; i<numNodes; i++){ figure[i] = createNode(null, null, null, null);}

//Scene graph, sibling(the other leg ie.)
function createNode(transform, render, sibling, child){
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child
    };
    return node;
}

function initNodes(Id) {

    var m = mat4();

    switch (Id) {

        case belly:
            //Translate, Rotate and then create node.
            m = translate(translateBelly); //store as vec3 or vec4 instead
            m =  mult(m, rotate(theta[belly], 0, 1, 0));
            figure[belly] = createNode(m, drawBelly, null, eyesMouth); //Set render calls and child.
            break;

        case eyesMouth:
            m = mult(m, rotate(theta[eyesMouth], 0, 1, 0));
            figure[eyesMouth] = createNode(m, drawEyesAndMouth, leftEar, null);
            break;


        case leftWing:
            m = mult(m, rotate(theta[leftWing], 1, 1, 0));
            figure[leftWing] = createNode(m, drawLeftWing, rightWing, null);
            break;

        case leftEar:
            m = mult(m, rotate(theta[leftEar], 0, 1, 0));
            figure[leftEar] = createNode(m, drawLeftEar, rightEar, null);
            break;

        case leftArm:
            m = mult(m, rotate(theta[leftArm], 0, 1, 0));
            figure[leftArm] = createNode(m, drawLeftArm, rightArm, null);
            break;

        case leftLeg:
            m = mult(m, rotate(theta[leftLeg], 0, 1, 0));
            figure[leftLeg] = createNode(m, drawLeftLeg, rightLeg, null);
            break;

        case rightWing:
            m = mult(m, rotate(theta[rightWing], 1, 1, 0));
            figure[rightWing] = createNode(m, drawRightWing, leftArm, null);
            break;

        case rightEar:
            m = mult(m, rotate(theta[rightEar], 0, 1, 0));
            figure[rightEar] = createNode(m, drawRightEar, leftWing, null);
            break;

        case rightArm:
            m = mult(m, rotate(theta[rightArm], 0, 1, 0));
            figure[rightArm] = createNode(m, drawRightArm, leftLeg, null);
            break;

        case rightLeg:
            m = mult(m, rotate(theta[rightLeg], 0, 1, 0));
            figure[rightLeg] = createNode(m, drawRightLeg, null, null);
            break;
    }

}

function traverse(Id) {

    if(Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
    if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
    if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function render() {
    //Clear canvas.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    wingFlapping();

    if(fall && moveY >-1){
        moveSpeed=0;
        moveY-=0.02;
    }
    else{
        fall=false;
    }

    if(rise && moveY <0){
        moveSpeed=0;
        moveY+=0.02;
    }
    else{
        rise=false;
    }

        //translate the movement vector (matrix)
        //multiply with the rotation?


            // if (moveZ>-50 &&((theta[belly] > 0 && theta[belly] < 180) || ( theta[belly] <= -180))) {
            //     moveZ -= moveSpeed;
            // }
            // else if(moveZ<7){
            //     moveZ += moveSpeed;
            // }
            //
            // if((moveX < 2)&& (theta[belly] >-90 && theta[belly] < 90 ) ||
            //     (theta[belly] < -270 || theta[belly] > 270 )){
            //     moveX+=moveSpeed;
            // }
            // else if(moveX > -2){
            //     moveX-=moveSpeed;
            // }



    translateBelly[0]= (Math.cos((theta[belly]*(Math.PI/180)))*moveSpeed);
    translateBelly[1]= 0;
    translateBelly[2]=(Math.tan((theta[belly]*(Math.PI/180)))*moveSpeed);



    // moveX += moveSpeed * Math.cos(.25) - moveZ * Math.sin(.25);
    // moveZ += moveSpeed * Math.cos(.25) + moveX * Math.sin(.25);
    // moveX= Math.cos((theta[belly]*Math.PI/180));
    // radians = degrees * (pi/180)
    // moveY= Math.sin((theta[belly]/360)+moveSpeed);
    // moveZ=Math.tan((theta[belly]/360));
    // moveZ+=;
    initNodes(belly);

    traverse(belly);

    requestAnimFrame( render );
}

function bindBufferAndPointer(buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.vertexAttribPointer(
        program.positionAttribute, 3, gl.FLOAT, gl.FALSE,
        Float32Array.BYTES_PER_ELEMENT * 6, 0);

}

function wingFlapping(){

    if (wingFlap && theta[leftWing] <=20){
        theta[leftWing]+=1;
        theta[rightWing]-=1;
    }
    else if (wingFlap){
        wingFlap=false;
    }

    if (!wingFlap && theta[leftWing] >= -20){
        theta[leftWing]-=1;
        theta[rightWing]+=1;
    }
    else if(!wingFlap){
        wingFlap=true;
    }

    initNodes(leftWing);
    initNodes(rightWing);

}

function init() {

    console.log("Init:"+modelList[8].vertexCount);
    //Bind and set up Canvas.
    var canvas = document.getElementById('canvas');

    gl = WebGLUtils.setupWebGL( canvas );
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    aspect =  canvas.width/canvas.height;

    gl.enable(gl.DEPTH_TEST);
    //Init Webgl with shaders
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram(program);

    instanceMatrix = mat4();
    projectionMatrix = ortho(-3.0,3.0,-3.0, 3.0,-3.0,3.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    
    createModelBuffers();
    //Bind position from variable in HTML to Webgl.
    program.positionAttribute = gl.getAttribLocation(program, 'pos');
    gl.enableVertexAttribArray(program.positionAttribute);
    //Set position to variable.

    for(i=0; i<modelList.length; i++) {initNodes(i);}


    render();

}

function loadMeshData(string) {
    var lines = string.split("\n");
    var positions = [];
    var normals = [];
    var vertices = [];

    for ( var i = 0 ; i < lines.length ; i++ ) {
        var parts = lines[i].trimRight().split(' ');
        if ( parts.length > 0 ) {
            switch(parts[0]) {
                case 'v':  positions.push(
                    vec3.fromValues(
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ));
                    break;
                case 'vn':
                    normals.push(
                        vec3.fromValues(
                            parseFloat(parts[1]),
                            parseFloat(parts[2]),
                            parseFloat(parts[3])));
                    break;
                case 'f': {
                    var f1 = parts[1].split('/');
                    var f2 = parts[2].split('/');
                    var f3 = parts[3].split('/');
                    Array.prototype.push.apply(
                        vertices, positions[parseInt(f1[0]) - 1]);
                    Array.prototype.push.apply(
                        vertices, normals[parseInt(f1[2]) - 1]);
                    Array.prototype.push.apply(
                        vertices, positions[parseInt(f2[0]) - 1]);
                    Array.prototype.push.apply(
                        vertices, normals[parseInt(f2[2]) - 1]);
                    Array.prototype.push.apply(
                        vertices, positions[parseInt(f3[0]) - 1]);
                    Array.prototype.push.apply(
                        vertices, normals[parseInt(f3[2]) - 1]);
                    break;
                }
            }
        }
    }
    console.log("Loaded mesh with " + (vertices.length / 6) + " vertices");

    return {
        primitiveType: 'TRIANGLES',
        vertices: new Float32Array(vertices),
        vertexCount: vertices.length / 6,
        material: {ambient: 0.2, diffuse: 0.5, shininess: 10.0}
    };
}

function storeMesh(mesh){
    modelList.push(mesh);
    console.log("storeMesh:"+modelList[storeIndex++].vertexCount);
}

function loadMesh(filename) {
    $.ajax({
        url: filename,
        dataType: 'text',
        async:false
    }).done(function(data) {
        storeMesh(loadMeshData(data));
        console.log("model-List ["+index+"]:"+modelList[index++].vertexCount);
    }).fail(function() {
        alert('Failed to retrieve [' + filename + "]");
    });
}

function load(){

    //Left part of body
    loadMesh('../Resources/left_wing.obj');    //index 0
    loadMesh('../Resources/left_leg.obj');
    loadMesh('../Resources/left_arm.obj');
    loadMesh('../Resources/left_ear.obj');     //index 3
    //Right part of body
    loadMesh('../Resources/right_wing.obj');   //index 4
    loadMesh('../Resources/right_leg.obj');
    loadMesh('../Resources/right_arm.obj');
    loadMesh('../Resources/right_ear.obj');    //index 7
    //Belly, eyes and mouth.
    loadMesh('../Resources/body.obj');         //index 8
    loadMesh('../Resources/eyes_and_mouth.obj');   //index 9
    console.log("model-List load ["+5+"]:"+modelList[5].vertexCount);


}

$(document).ready(function() {
    load();
    init();


    // loadMesh('http://hygienspelet.se/triangles');
});
