varying vec3 N;
varying vec3 v;
varying vec2 uvTexture;
varying vec4 shadowCoord;
varying vec3 meshColor;
varying vec3 lv;
varying vec3 ln;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat4 lightMV;
uniform mat4 MV;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
attribute vec3 vertex;
attribute vec3 normal;
attribute vec3 color;
attribute vec2 uv;

void main(void)
{

   v = vec3(MV * vec4(vertex, 1));   
   lv = vec3(lightMV * vec4(vertex, 1));    
   ln = normalize(vec3(lightMV * vec4(normal, 1)));
   N = normalize(normalMatrix * normal);
   shadowCoord = lightMVP * vec4(vertex, 1);

   
   gl_Position = MVP  * vec4(vertex, 1);
   gl_FrontColor = gl_Color;
   uvTexture = uv;
   meshColor = color;
	
}