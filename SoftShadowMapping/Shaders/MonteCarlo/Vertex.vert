uniform mat4 MVP;
attribute vec3 vertex;
varying vec4 data;

void main(void)
{

	gl_Position = MVP * vec4(vertex, 1);
	data = vec4(vertex, 1);

}