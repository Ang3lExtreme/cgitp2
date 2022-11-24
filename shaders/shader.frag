precision highp float;

varying vec3 fNormal;
varying vec4 fColor;

void main() {
    gl_FragColor = vec4(fColor);
}