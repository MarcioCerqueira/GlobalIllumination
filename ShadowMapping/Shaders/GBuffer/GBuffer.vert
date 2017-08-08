uniform mat4 MVP;
attribute vec3 vertex;
attribute vec3 normal;
attribute vec3 color;
attribute vec3 uv;
uniform mat3 normalMatrix;
varying vec4 GBufferNormal;
varying vec4 GBufferVertex;
varying vec3 GBufferTextureCoordinates;
varying vec3 GBufferColor;

void main(void)
{

	gl_Position = MVP * vec4(vertex, 1);
	gl_FrontColor = gl_Color;

	GBufferNormal = vec4(normal, 1);
	GBufferVertex = vec4(vertex, 1);
	GBufferTextureCoordinates = uv;
	GBufferColor = color;
	
}