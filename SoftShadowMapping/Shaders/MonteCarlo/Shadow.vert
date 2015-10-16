varying vec3 N;
varying vec3 v;
varying vec4 shadowCoord;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat4 MV;
uniform mat3 normalMatrix;
attribute vec3 vertex;
attribute vec3 normal;

void main(void)
{

   v = vec3(MV * vec4(vertex, 1));
   N = normalize(normalMatrix * normal);
   shadowCoord = lightMVP * vec4(vertex, 1);

   gl_Position = MVP  * vec4(vertex, 1);
   gl_FrontColor = gl_Color;
	
}