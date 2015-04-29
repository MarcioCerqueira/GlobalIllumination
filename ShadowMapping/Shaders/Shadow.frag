uniform sampler2D shadowMap;
uniform sampler2D edgeMap;
uniform sampler2D meshTexturedColor;
uniform mat4 lightMV;
uniform mat4 lightP;
uniform mat4 mQuantization;
uniform mat4 mQuantizationInverse;
uniform vec4 tQuantization;
varying vec3 N;
varying vec3 v;  
varying vec4 shadowCoord;
varying vec2 uvTexture;
varying vec3 meshColor;
varying vec3 lv;
varying vec3 ln;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform mat4 lightMVPInv;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int bilinearPCF;
uniform int tricubicPCF;
uniform int VSM;
uniform int ESM;
uniform int EVSM;
uniform int MSM;
uniform int naive;
uniform int zNear;
uniform int zFar;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int useAdaptiveDepthBias;
uniform mat4 MVP;
uniform mat4 lightMVP;

vec4 phong()
{

   vec4 light_ambient = vec4(0.1, 0.1, 0.1, 1);
   vec4 light_specular = vec4(0.1, 0.1, 0.1, 1);
   vec4 light_diffuse = vec4(0.5, 0.5, 0.5, 1);
   float shininess = 60.0;

   vec3 L = normalize(lightPosition.xyz - v);   
   vec3 E = normalize(-v); // we are in Eye Coordinates, so EyePos is (0,0,0)  
   vec3 R = normalize(-reflect(L, N));  
 
   //calculate Ambient Term:  
   vec4 Iamb = light_ambient;    

   //calculate Diffuse Term:  
   vec4 Idiff = light_diffuse * max(dot(N,L), 0.0);    
   
   // calculate Specular Term:
   vec4 Ispec = light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);

   vec4 sceneColor;
   if(useTextureForColoring == 1)
      sceneColor = texture2D(meshTexturedColor, uvTexture);	
   else if(useMeshColor == 1)
      sceneColor = vec4(meshColor.r, meshColor.g, meshColor.b, 1);
   else
	  sceneColor = gl_FrontLightModelProduct.sceneColor;
   
   return sceneColor + Iamb + Idiff + Ispec;  

}

float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
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

   vec2 texSize = vec2(textureSize(sampler, 0));
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
	int illuminationCount = 0;
	int eachAxis = 5;
	int numberOfSamples = eachAxis * eachAxis;
	float offset = (float(eachAxis) - 1.0) * 0.5;
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
				illuminationCount++;
			count++;

		}
	}

	if(illuminationCount == 0)
		return 0.0;
	if(illuminationCount == numberOfSamples)
		return 1.0;

	return float(illuminationCount)/float(numberOfSamples);
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

	float c = 300.0;
	float e2 = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).x;
	e2 = exp(c * e2);

	normalizedShadowCoord.z = linearize(normalizedShadowCoord.z);
	float e1 = exp(-c * normalizedShadowCoord.z);
	
	return clamp(e1 * e2, 0.0, 1.0);

}


float exponentialVarianceShadowMapping(vec3 normalizedShadowCoord)
{

	float c = 150.0;
	
	float positiveMoment1 = exp(c * texture2D(shadowMap, vec2(normalizedShadowCoord.st)).x);
	float positiveMoment2 = exp(c * texture2D(shadowMap, vec2(normalizedShadowCoord.st)).y);
	float negativeMoment1 = -exp(-c * texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z);
	float negativeMoment2 = -exp(-c * texture2D(shadowMap, vec2(normalizedShadowCoord.st)).w);

	float positiveDistanceFromLight = linearize(normalizedShadowCoord.z);
	
	float positiveDistanceFromLightMoment1 = exp(c * positiveDistanceFromLight);
	float negativeDistanceFromLightMoment1 = -exp(-c * positiveDistanceFromLight);

	float pos = chebyshevUpperBound(vec2(positiveMoment1, positiveMoment2), positiveDistanceFromLightMoment1);
	float neg = chebyshevUpperBound(vec2(negativeMoment1, negativeMoment2), negativeDistanceFromLightMoment1);

	return min(pos, neg);

}

float hamburger4MSM(vec3 normalizedShadowCoord)
{

	vec3 z, c, d;
	vec4 b = texture2D(shadowMap, vec2(normalizedShadowCoord.st));
	b = mQuantizationInverse * (b - tQuantization);
	
	//Hack
	b.y = b.x * b.x;
	b.z = b.x * b.x * b.x;
	b.w = b.x * b.x * b.x * b.x;

	float bias = 0.00003;
	
	z.x = linearize(normalizedShadowCoord.z);
	b = (1.0 - bias) * b + bias * vec4(0.5, 0.5, 0.5, 0.5);
	d = vec3(1.0, z.x, z.x * z.x);

	//Use Cholesky decomposition (LDLT) to solve c
	float L10 = b.x;
	float L20 = b.y;
	float D11 = b.y - L10 * L10;
	float L21 = (b.z - L20 * L10)/D11;
	float D22 = b.w - L20 * L20 - L21 * L21 * D11;
	
	float y0 = d.x;
	float y1 = d.y - L10 * y0;
	float y2 = d.z - L20 * y0 - L21 * y1;

	y1 /= D11;
	y2 /= D22;
	
	c.z = y2;
	c.y = y1 - L21 * c.z;
	c.x = y0 - L10 * c.y - L20 * c.z;	

	// Solve the quadratic equation c[0]+c[1]*z+c[2]*z^2 to obtain solutions z[1] and z[2]
	float p = c.y/c.z;
	float q = c.x/c.z;
	float D = ((p*p)/4.0)-q;
	float r = sqrt(D);
	z.y = -(p/2.0)-r;
	z.z = -(p/2.0)+r;
	
	if(z.x <= z.y)
		return 1.0;
	else if(z.x <= z.z)
		return (1.0 - clamp((z.x * z.z - b.x * (z.x + z.z) + b.y)/((z.z - z.y) * (z.x - z.y)), 0.0, 1.0));
	else 
		return (1.0 - clamp(1.0 - (z.y * z.z - b.x * (z.y + z.z) + b.y)/((z.x - z.y) * (z.x - z.z)), 0.0, 1.0));
	
}

/*
float adaptiveDepthBias(vec3 normalizedShadowCoord)
{

	vec2 smBufferRes;
	smBufferRes.x = 640;
	smBufferRes.y = 480;

	vec2 delta;
	delta.x = 1.0 / smBufferRes.x;
	delta.y = 1.0 / smBufferRes.y;

	float viewBound = zNear * tan( 45*float( 3.141592653589793238462643 )/360.0f );
	// Locate corresponding light space shadow map grid center
    vec2 index = floor( vec2(normalizedShadowCoord.x * smBufferRes.x, normalizedShadowCoord.y * smBufferRes.y) );
    vec2 nlsGridCenter = delta*(index + vec2(0.5)); // Normalized eye space grid center --- [0,1]
    vec2 lsGridCenter = viewBound*( 2.0*nlsGridCenter - vec2(1.0) );
    
	// Light ray direction in light space
    vec3 lsGridLineDir = normalize( vec3(lsGridCenter, -zNear) ); // Light space grid line direction    
    
	// Locate the potential occluder for the shading fragment
    float ls_t_hit = dot(ln, lv.xyz) / dot(ln, lsGridLineDir);
    vec3  ls_hit_p = ls_t_hit * lsGridLineDir;
   
    // Normalized depth value in shadow map
	float SMDepth = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;
	float A = lightP[2][2];
    float B = lightP[3][2];    
    float adaptiveDepthBias = 0.5*pow(1.0 - A - 2.0*SMDepth, 2)*0.0001 / B; 
	
	// Use the intersection point as new look up point
    vec4 lsPotentialoccluder = lightP * vec4(ls_hit_p, 1.0);
    lsPotentialoccluder      = lsPotentialoccluder/lsPotentialoccluder.w;
    lsPotentialoccluder      = 0.5 * lsPotentialoccluder + vec4(0.5, 0.5, 0.5, 0.0);
   
    float actualDepth = min(lsPotentialoccluder.z, normalizedShadowCoord.z);
    float actualBias  = adaptiveDepthBias;
    return actualDepth + actualBias;

}
*/

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1;

	if(max(dot(N2,L), 0.0) == 0) 
		return 0.0;
	else
		return 1.0;

}

void main()
{	

	vec4 color = phong();
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	//if(useAdaptiveDepthBias == 1) 
		//normalizedShadowCoord.z = adaptiveDepthBias(normalizedShadowCoord);

	float shadow = 1.0;
	shadow = computePreEvaluationBasedOnNormalOrientation();

	if(shadowCoord.w > 0.0 && shadow == 1.0) {

		if(naive == 1) {
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
			shadow = (normalizedShadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		} else if(VSM == 1)
			shadow = varianceShadowMapping(normalizedShadowCoord.xyz);
		else if(ESM == 1)
			shadow = exponentialShadowMapping(normalizedShadowCoord.xyz);
		else if(EVSM == 1)
			shadow = exponentialVarianceShadowMapping(normalizedShadowCoord.xyz);
		else if(MSM == 1)
			shadow = hamburger4MSM(normalizedShadowCoord.xyz);
		else
			shadow = PCF(normalizedShadowCoord.xyz);
		
	}

	gl_FragColor = shadow * color;

}