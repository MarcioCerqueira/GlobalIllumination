varying vec4 shadowCoord;
varying vec3 v;
varying vec3 N;
attribute vec3 vertex;
attribute vec3 normal;
uniform mat4 MVP;
uniform mat4 MV;
uniform mat4 lightMVP;
uniform mat3 normalMatrix;

void main(void)
{

   v = vec3(MV * vec4(vertex, 1));
   N = normalize(normalMatrix * normal);
   
   shadowCoord = lightMVP * vec4(vertex, 1);
   gl_Position = MVP  * vec4(vertex, 1);

}