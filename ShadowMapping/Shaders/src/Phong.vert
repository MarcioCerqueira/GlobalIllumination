varying vec3 N;
varying vec3 v;
uniform mat4 MVP;
uniform mat4 MV;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;

void main(void)
{

   v = vec3(MV * gl_Vertex);       
   N = normalize(normalMatrix * gl_Normal);

   gl_Position = ftransform();//MVP  * gl_Vertex;
   gl_FrontColor = gl_Color;

}
