varying vec3 N;
varying vec3 v;  
varying vec4 position;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;

void main (void)  
{  

   gl_FragColor = gl_FrontLightModelProduct.sceneColor;
   
}