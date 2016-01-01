uniform mat4 MVP;
attribute vec3 vertex;
attribute vec3 normal;
uniform mat3 normalMatrix;
varying vec4 GBufferNormal;
varying vec4 GBufferVertex;

void main(void)
{

	gl_Position = MVP * vec4(vertex, 1);
	GBufferNormal = vec4(normal, 1);
	GBufferVertex = vec4(vertex, 1);

}