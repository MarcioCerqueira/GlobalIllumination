uniform sampler2D shadowMap;
uniform sampler2D edgeMap;
varying vec3 N;
varying vec3 v;  
varying vec4 shadowCoord;
varying vec4 shadowCord;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform mat4 lightMVPInv;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int bilinearPCF;
uniform int tricubicPCF;
uniform int poissonPCF;
uniform int edgePCF;
uniform int VSM;
uniform int ESM;
uniform int EVSM;
uniform int naive;
uniform int zNear;
uniform int zFar;

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

float linearize(float depth) {

	depth = (2.0 * zNear) / (zFar + zNear - depth * (zFar - zNear));
	return depth;

}

vec4 cubic(float v){

    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0/6.0);

}


vec4 textureBicubic(sampler2D sampler, vec2 texCoords){

   vec2 texSize = textureSize(sampler, 0);
   vec2 invTexSize = 1.0 / texSize;
   
   texCoords = texCoords * texSize - 0.5;
	
   vec2 fxy = fract(texCoords);
   texCoords -= fxy;

   vec4 xcubic = cubic(fxy.x);
   vec4 ycubic = cubic(fxy.y);

   vec4 c = texCoords.xxyy + vec2(-0.5, +1.5).xyxy;
    
   vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
   vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;
    
   offset *= invTexSize.xxyy;
    
   vec4 sample0 = texture(sampler, offset.xz);
   vec4 sample1 = texture(sampler, offset.yz);
   vec4 sample2 = texture(sampler, offset.xw);
   vec4 sample3 = texture(sampler, offset.yw);

   float sx = s.x / (s.x + s.y);
   float sy = s.z / (s.z + s.w);

   return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);

}

float PCF(vec3 normalizedShadowCoord)
{

	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	float illuminationCount = 0;
	float eachAxis = 5;
	float numberOfSamples = eachAxis * eachAxis;
	float offset = (eachAxis - 1) * 0.5;
	float distanceFromLight;

	int count = 0;
	illuminationCount = 0;

	for(float w = -offset; w <= offset; w++) {
		for(float h = -offset; h <= offset; h++) {
		
			if(tricubicPCF == 1)
				distanceFromLight = textureBicubic(shadowMap, vec2(normalizedShadowCoord.s + w * incrWidth, normalizedShadowCoord.t + h * incrHeight)).z;
			if(bilinearPCF == 1)
				distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.s + w * incrWidth, normalizedShadowCoord.t + h * incrHeight)).z;
			if(normalizedShadowCoord.z <= distanceFromLight)
				illuminationCount += 1;
			count++;

		}
	}

	if(illuminationCount == 0)
		return 0.0;
	if(illuminationCount == numberOfSamples)
		return 1.0;

	return illuminationCount/numberOfSamples;
}

float chebyshevUpperBound(vec2 moments, float distanceFromLight)
{
	
	if (distanceFromLight <= moments.x)
		return 1.0;
	
	float variance = moments.y - (moments.x * moments.x);
	
	float d = distanceFromLight - moments.x;
	float p_max = variance / (variance + d*d);
	p_max = (p_max - 0.2) / (1.0 - 0.2);
	return clamp(p_max, 0.0, 1.0);

}

float varianceShadowMapping(vec3 normalizedShadowCoord)
{
	
	vec2 moments = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).xy;
	normalizedShadowCoord.z = linearize(normalizedShadowCoord.z);
	return chebyshevUpperBound(moments, normalizedShadowCoord.z);

}

float exponentialShadowMapping(vec3 normalizedShadowCoord)
{

	float e2 = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).x;
	normalizedShadowCoord.z = linearize(normalizedShadowCoord.z);
	
	float c = 1280.0;
	float e1 = exp(-c * normalizedShadowCoord.z);
	
	return (e1 * e2);

}


float exponentialVarianceShadowMapping(vec3 normalizedShadowCoord)
{

	float positiveMoment1 = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).x;
	float positiveMoment2 = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).y;
	float negativeMoment1 = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;
	float negativeMoment2 = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).w;

	float positiveDistanceFromLight = linearize(normalizedShadowCoord.z);
	
	float c = 640.0;
	float positiveDistanceFromLightMoment1 = exp(c * positiveDistanceFromLight);
	float negativeDistanceFromLightMoment1 = -exp(-c * positiveDistanceFromLight);

	float pos = chebyshevUpperBound(vec2(positiveMoment1, positiveMoment2), positiveDistanceFromLightMoment1);
	float neg = chebyshevUpperBound(vec2(negativeMoment1, negativeMoment2), negativeDistanceFromLightMoment1);

	return min(pos, neg);
}

void main()
{	

	vec4 color = phong();
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	float shadow = 1.0;

	if(shadowCoord.w > 0.0) {

		if(naive == 1) {
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
			shadow = (normalizedShadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		} else if(VSM == 1)
			shadow = varianceShadowMapping(normalizedShadowCoord.xyz);
		else if(ESM == 1)
			shadow = exponentialShadowMapping(normalizedShadowCoord.xyz);
		else if(EVSM == 1)
			shadow = exponentialVarianceShadowMapping(normalizedShadowCoord.xyz);
		else
			shadow = PCF(normalizedShadowCoord.xyz);
			
		
	}

	gl_FragColor = vec4(shadow, shadow, shadow, 1.0);

}