varying vec4 shadowCoord;
varying vec3 v;
varying vec3 N;
varying vec3 meshColor;
varying vec2 uvTexture;
attribute vec3 vertex;
attribute vec3 normal;
attribute vec3 color;
attribute vec2 uv;
uniform mat3 normalMatrix;
uniform mat4 MVP;
uniform mat4 MV;
uniform mat4 lightMVP;

void main(void)
{

   shadowCoord = lightMVP * vec4(vertex, 1);
   v = vec3(MV * vec4(vertex, 1));
   N = normalize(normalMatrix * normal);
   uvTexture = uv;
   meshColor = color;
   gl_Position = MVP  * vec4(vertex, 1);
   gl_FrontColor = gl_Color;

}