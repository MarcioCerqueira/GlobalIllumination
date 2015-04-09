varying vec4 shadowCoord;
attribute vec3 vertex;
uniform mat4 MVP;
uniform mat4 lightMVP;

void main(void)
{

   shadowCoord = lightMVP * vec4(vertex, 1);
   gl_Position = MVP  * vec4(vertex, 1);

}