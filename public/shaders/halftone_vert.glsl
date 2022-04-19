varying vec3 normalInterp;
varying vec3 vertPos;
varying vec3 viewVec;

void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
    vertPos = vec3(vertPos4) / vertPos4.w;
    normalInterp = normalMatrix * normal;
    viewVec = cameraPosition - position;
}
