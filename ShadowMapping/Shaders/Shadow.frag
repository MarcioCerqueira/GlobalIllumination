uniform sampler2D shadowMap;
varying vec3 N;
varying vec3 v;  
varying vec4 shadowCoord;
varying vec4 shadowCord;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform mat4 lightMVPInv;

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

float shadowIntensity(vec3 normalizedShadowCoord)
{

	float incrWidth = 1.0/1280.0;
	float incrHeight = 1.0/960.0;
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
	
	/*
	vec4 t = vec4(N.x, N.y, N.z, -N.x * v.x - N.y * v.y - N.z * v.z);
	vec4 tl = transpose(lightMVPInv) * t;

	illuminationCount = 0;
	for(float w = -1.5; w <= 1.5; w++) {
		for(float h = -1.5; h <= 1.5; h++) {
			float xl = normalizedShadowCoord.s + w * incrWidth;
			float yl = normalizedShadowCoord.t + h * incrHeight;
			float zl = (-tl.x/tl.z) * xl + (-tl.y/tl.z) * yl + (-tl.w/tl.z);
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.s + w * incrWidth, normalizedShadowCoord.t + h * incrHeight)).z;		
 			if(zl < distanceFromLight)
				illuminationCount += 1;
		}
	}
	*/

	return illuminationCount/numberOfSamples;

}

void main()
{	

	vec4 color = phong();
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	//normalizedShadowCoord.z += 0.0001; //depth bias GL_FRONT
	//normalizedShadowCoord.z -= 0.0000;
	float shadow = 1.0;
	float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
 			
	if(shadowCoord.w > 0.0)
		shadow = shadowIntensity(normalizedShadowCoord.xyz);
	
	gl_FragColor = shadow * color;
	//gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
	//gl_FragColor = vec4(normalizedShadowCoord.z, normalizedShadowCoord.z, normalizedShadowCoord.z, 1.0);
	//gl_FragColor = vec4(distanceFromLight, distanceFromLight, distanceFromLight, 1.0);

}