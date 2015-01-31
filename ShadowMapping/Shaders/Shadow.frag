uniform sampler2D shadowMap;
varying vec3 N;
varying vec3 v;  
varying vec4 shadowCoord;
varying vec4 shadowCord;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform mat4 lightMVPInv;
uniform int shadowMapWidth;
uniform int shadowMapHeight;

vec4 phong()
{

   vec4 light_ambient = vec4(0.1, 0.1, 0.1, 1);
   vec4 light_specular = vec4(0.1, 0.1, 0.1, 1);
   vec4 light_diffuse = vec4(0.9, 0.9, 0.9, 1);
   float shininess = 60;

   vec3 L = normalize(lightPosition.xyz - v);   
   vec3 E = normalize(-v); // we are in Eye Coordinates, so EyePos is (0,0,0)  
   vec3 R = normalize(-reflect(L, N));  
 
   //calculate Ambient Term:  
   vec4 Iamb = light_ambient;    

   //calculate Diffuse Term:  
   vec4 Idiff = light_diffuse * max(dot(N,L), 0.0);    
   
   // calculate Specular Term:
   vec4 Ispec = light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);

   return gl_FrontLightModelProduct.sceneColor + Iamb + Idiff + Ispec;  

}

float shadowIntensity(vec3 normalizedShadowCoord)
{

	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	float illuminationCount = 0;
	float numberOfSamples = 16;

	for(float w = -1.5; w <= 1.5; w++) {
		for(float h = -1.5; h <= 1.5; h++) {
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.s + w * incrWidth, normalizedShadowCoord.t + h * incrHeight)).z;	
			if(normalizedShadowCoord.z <= distanceFromLight)
				illuminationCount += 1;
		}
	}

	if(illuminationCount == 0)
		return 0.0;
	if(illuminationCount == numberOfSamples)
		return 1.0;

	return illuminationCount/numberOfSamples;
}

void main()
{	

	vec4 color = phong();
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	float shadow = 1.0;
	float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
			
	if(shadowCoord.w > 0.0)
		shadow = shadowIntensity(normalizedShadowCoord.xyz);
		
	gl_FragColor = shadow * color;
	//gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
	/*
	float n = 1.0; // camera z near
	float f = 250.0; // camera z far
	float d = (2.0 * n) / (f + n - normalizedShadowCoord.z * (f - n));
	gl_FragColor = vec4(d, d, d, 1.0);
	*/
	//gl_FragColor = vec4(normalizedShadowCoord.z, normalizedShadowCoord.z, normalizedShadowCoord.z, 1.0);
	//gl_FragColor = vec4(distanceFromLight, distanceFromLight, distanceFromLight, 1.0);

}