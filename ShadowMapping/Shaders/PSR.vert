uniform mat4 MVP;
attribute vec3 vertex;

void main(void)
{

   gl_Position = MVP  * vec4(vertex, 1);
   gl_FrontColor = gl_Color;
	
}