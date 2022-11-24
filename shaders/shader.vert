uniform mat4 mModelView;
uniform mat4 mProjection;

attribute vec4 vPosition;
attribute vec3 vNormal;

varying vec3 fNormal;

varying vec4 fColor;
uniform vec4 uColor;

void main() {
    gl_Position = mProjection * mModelView * vPosition;
    fNormal = vNormal;
    fColor = uColor;
}