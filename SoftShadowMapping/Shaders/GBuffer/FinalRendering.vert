varying vec3 N;
varying vec3 v;
varying vec3 uvTexture;
varying vec4 shadowCoord;
varying vec3 meshColor;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat4 MV;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
attribute vec3 vertex;
attribute vec3 normal;
attribute vec3 color;
attribute vec3 uv;

void main(void)
{

   v = vec3(MV * vec4(vertex, 1));   
   N = normalize(normalMatrix * normal);
   shadowCoord = lightMVP * vec4(vertex, 1);

   gl_Position = MVP  * vec4(vertex, 1);
   gl_FrontColor = gl_Color;
   uvTexture = uv;
   meshColor = color;
	
}