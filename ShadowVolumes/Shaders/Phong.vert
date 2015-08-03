varying vec3 N;
varying vec3 v;
varying vec3 meshColor;
varying vec3 uvTexture;
uniform mat4 MVP;
uniform mat4 MV;
uniform mat4 normalMatrix;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform int useHomogeneousCoordinates;
attribute vec3 vertex;
attribute vec3 normal;
attribute vec3 color;
attribute vec3 uv;

void main(void)
{

   v = vec3(MV * vec4(vertex, 1));       
   N = vec3(normalize(normalMatrix * vec4(normal, 1)));
   gl_Position = MVP * vec4(vertex, 1);
   
   meshColor = color;
   gl_FrontColor = gl_Color;
   uvTexture = uv;
  
}