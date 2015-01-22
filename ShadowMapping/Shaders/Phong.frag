varying vec3 N;
varying vec3 v;  
uniform vec3 lightPosition;
uniform vec3 cameraPosition;

vec4 phong()
{

   vec4 light_ambient = vec4(0.1f, 0.1f, 0.1f, 1);
   vec4 light_specular = vec4(0.1f, 0.1f, 0.1f, 1);
   vec4 light_diffuse = vec4(0.9, 0.9, 0.9, 1);
   float shininess = 60.f;

   vec3 L = normalize(lightPosition.xyz - v);   
   vec3 E = normalize(-v); // we are in Eye Coordinates, so EyePos is (0,0,0)  
   vec3 R = normalize(-reflect(L, N));  
 
   //calculate Ambient Term:  
   vec4 Iamb = light_ambient;    

   //calculate Diffuse Term:  
   vec4 Idiff = light_diffuse * max(dot(N,L), 0.0);    
   
   // calculate Specular Term:
   vec4 Ispec = light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);

   return gl_FrontLightModelProduct.sceneColor + gl_Color + Iamb + Idiff + Ispec;  

}

void main (void)  
{  

   vec4 color = phong();
   gl_FragColor = color;
  
}