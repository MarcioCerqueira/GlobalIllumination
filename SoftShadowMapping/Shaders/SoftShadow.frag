uniform sampler2D shadowMap;
uniform sampler2D SATShadowMap;
uniform sampler2D hierarchicalShadowMap;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
varying vec4 shadowCoord;
varying vec3 N;
varying vec3 v;  
varying vec3 uvTexture;
varying vec3 meshColor;
uniform vec3 lightPosition;
uniform float shadowIntensity;
uniform float accFactor;
uniform int zNear;
uniform int zFar;
uniform int windowWidth;
uniform int windowHeight;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int blockerSearchSize;
uniform int kernelSize;
uniform int lightSourceRadius;
uniform int PCSS;
uniform int SAVSM;
uniform int VSSM;
uniform int SAT;

vec4 phong()
{

	vec4 light_ambient = vec4(0.4, 0.4, 0.4, 1);
    vec4 light_specular = vec4(0.25, 0.25, 0.25, 1);
    vec4 light_diffuse = vec4(0.5, 0.5, 0.5, 1);
    float shininess = 10.0;

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
   
    if(useTextureForColoring == 1) {
		if(uvTexture.b > 0.99 && uvTexture.b < 1.001)
			sceneColor = texture2D(texture0, vec2(uvTexture.rg));
		else if(uvTexture.b > 1.999 && uvTexture.b < 2.001)
			sceneColor = texture2D(texture1, vec2(uvTexture.rg));	
		else if(uvTexture.b > 2.999 && uvTexture.b < 3.001)
			sceneColor = texture2D(texture2, vec2(uvTexture.rg));
		else
			sceneColor = vec4(meshColor.r, meshColor.g, meshColor.b, 1);
	} else if(useMeshColor == 1)
		sceneColor = vec4(meshColor.r, meshColor.g, meshColor.b, 1);
	else
		sceneColor = gl_FrontLightModelProduct.sceneColor;
   
	return sceneColor * (Idiff + Ispec + Iamb);  
   
}

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1;

	if(max(dot(N2,L), 0.0) == 0.0) 
		return shadowIntensity;
	else
		return 1.0;

}

float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

float nonLinearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = -(2.0 * n - depth * (f + n))/(depth * (f - n));
	return depth;

}

vec2 recombinePrecision(vec4 value)  
{  
	/*
	float factorInv = 1.0 / 256.0;  
	return vec2(value.zw * factorInv + value.xy);  
	*/
	return value.xy;
} 

float chebyshevUpperBound(vec2 moments, float distanceToLight)
{
	
	if (distanceToLight <= moments.x)
		return 1.0;

	float variance = moments.y - (moments.x * moments.x);
	float d = distanceToLight - moments.x;
	float p_max = variance / (variance + d*d);
	float p = distanceToLight <= moments.x;
	p_max = max(p, p_max);
	return p_max;

}

float computeAverageBlockerDepthBasedOnPCF(vec4 normalizedShadowCoord) 
{

	float averageDepth = 0.0;
	int numberOfBlockers = 0;
	float blockerSearchWidth = float(lightSourceRadius)/float(shadowMapWidth);
	float stepSize = 2.0 * blockerSearchWidth/float(blockerSearchSize);

	for(float w = -blockerSearchWidth; w <= blockerSearchWidth; w += stepSize) {
		for(float h = -blockerSearchWidth; h <= blockerSearchWidth; h += stepSize) {
		
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h))).z;
			if(normalizedShadowCoord.z > distanceFromLight) {
				averageDepth += distanceFromLight;
				numberOfBlockers++;
			}
				
		}
	}

	if(numberOfBlockers == 0)
		return 1.0;
	else
		return averageDepth / float(numberOfBlockers);
	
}

float computeAverageBlockerDepthBasedOnVSM(vec4 normalizedShadowCoord) 
{

	float blockerSearchWidth = float(lightSourceRadius)/float(shadowMapWidth);
	float stepSize = 2.0 * blockerSearchWidth/float(blockerSearchSize);
	float zunocc = linearize(normalizedShadowCoord.z);
	vec2 moments = vec2(0.0);

	if(SAT == 1) {
 
		//float mipLevel = log2(blockerSearchWidth * shadowMapWidth);
		//moments = recombinePrecision(texture2DLod(SATShadowMap, normalizedShadowCoord.xy, mipLevel)).xy;
 
		float div = 2.0 * blockerSearchWidth/stepSize;
		float SATFilterSize = div / 2.0;

		float xmax = normalizedShadowCoord.x + (div) * stepSize;
		float xmin = normalizedShadowCoord.x - (div + 1.0) * stepSize;
		float ymax = normalizedShadowCoord.y + (div) * stepSize;
		float ymin = normalizedShadowCoord.y - (div + 1.0) * stepSize;
	
		vec4 A = texture2D(SATShadowMap, vec2(xmin, ymin));
		vec4 B = texture2D(SATShadowMap, vec2(xmax, ymin));
		vec4 C = texture2D(SATShadowMap, vec2(xmin, ymax));
		vec4 D = texture2D(SATShadowMap, vec2(xmax, ymax));
		moments = recombinePrecision((D + A - B - C)/float(SATFilterSize * SATFilterSize)).xy;

	} else {
 
		int count = 0;

		for(float w = -blockerSearchWidth; w <= blockerSearchWidth; w += stepSize) {
			for(float h = -blockerSearchWidth; h <= blockerSearchWidth; h += stepSize) {
 
				moments += recombinePrecision(texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h)))).xy;
				count++;

			}
		}

		moments.xy /= count;

	}
	
	moments.xy += 0.5;
	
	float averageDepth = moments.x;
	float probability = chebyshevUpperBound(moments, zunocc);
	float zocc = nonLinearize((averageDepth - probability * zunocc)/(1.0 - probability));
	if(probability > 0.99) zocc = 1.0;
	return zocc;

}

float computePenumbraWidth(float averageDepth, float distanceToLight)
{

	float penumbraWidth = ((distanceToLight - averageDepth)/averageDepth) * float(lightSourceRadius);
	return (float(zNear) * penumbraWidth)/distanceToLight;
	
}

float PCF(float penumbraWidth, vec4 normalizedShadowCoord)
{

	float illuminationCount = 0.0;
	int count = 0;
	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
		
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;
		
	for(float w = -penumbraWidth; w <= penumbraWidth; w += stepSize) {
		for(float h = -penumbraWidth; h <= penumbraWidth; h += stepSize) {
		
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h))).z;
			if(normalizedShadowCoord.z <= distanceFromLight)
				illuminationCount++;
			else
				illuminationCount += shadowIntensity;
			count++;
				
		}
	}
		
	return illuminationCount/float(count);

}

float VSM(float penumbraWidth, vec4 normalizedShadowCoord)
{

	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
	
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;
	
	vec2 moments = vec2(0.0);
	
	if(SAT == 1) {

		float div = 2.0 * penumbraWidth/stepSize;
		float SATFilterSize = div / 2.0;

		float xmax = normalizedShadowCoord.x + (div) * stepSize;
		float xmin = normalizedShadowCoord.x - (div + 1.0) * stepSize;
		float ymax = normalizedShadowCoord.y + (div) * stepSize;
		float ymin = normalizedShadowCoord.y - (div + 1.0) * stepSize;
	
		vec4 A = texture2D(SATShadowMap, vec2(xmin, ymin));
		vec4 B = texture2D(SATShadowMap, vec2(xmax, ymin));
		vec4 C = texture2D(SATShadowMap, vec2(xmin, ymax));
		vec4 D = texture2D(SATShadowMap, vec2(xmax, ymax));
		moments = recombinePrecision((D + A - B - C)/float(SATFilterSize * SATFilterSize)).xy;

	} else {

		int count = 0;

		for(float w = -penumbraWidth; w <= penumbraWidth; w += stepSize) {
			for(float h = -penumbraWidth; h <= penumbraWidth; h += stepSize) {
		
				moments += recombinePrecision(texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h)))).xy;
				count++;

			}
		}
	
		moments /= count;
	
	}

	moments.xy += 0.5;
	return clamp(mix(chebyshevUpperBound(moments, linearize(normalizedShadowCoord.z)), 1.0, shadowIntensity), 0.0, 1.0);

}

float computeVisibilityFromHSM(float penumbraWidth, vec4 normalizedShadowCoord) 
{

	float mipLevel = log2(penumbraWidth * float(shadowMapWidth));
	vec2 minMax = recombinePrecision(texture2DLod(hierarchicalShadowMap, normalizedShadowCoord.xy, mipLevel)).xy + 0.5;
	
	if(normalizedShadowCoord.z <= nonLinearize(minMax.x)) return 1.0;
	else return 0.555;

}

float percentageCloserSoftShadows(vec4 normalizedShadowCoord)
{

	float averageDepth = computeAverageBlockerDepthBasedOnPCF(normalizedShadowCoord);
	float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z);
	return PCF(penumbraWidth, normalizedShadowCoord);
	
}

float summedAreaVarianceShadowMapping(vec4 normalizedShadowCoord)
{

	float averageDepth = computeAverageBlockerDepthBasedOnPCF(normalizedShadowCoord);
	float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z);
	return VSM(penumbraWidth, normalizedShadowCoord);
	
}

float varianceSoftShadowMapping(vec4 normalizedShadowCoord)
{

	float averageDepth = computeAverageBlockerDepthBasedOnVSM(normalizedShadowCoord);
	float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z);
	float visibility = computeVisibilityFromHSM(penumbraWidth, normalizedShadowCoord);
	if(visibility != shadowIntensity && visibility != 1.0)
		visibility = VSM(penumbraWidth, normalizedShadowCoord);
	
	return visibility;
	
}

void main()
{	

	vec4 color = phong();
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;

	float shadow = computePreEvaluationBasedOnNormalOrientation();
	
	if(shadowCoord.w > 0.0 && shadow == 1.0) {
	
		if(PCSS == 1)
			shadow = percentageCloserSoftShadows(normalizedShadowCoord);
		else if(SAVSM == 1)
			shadow = summedAreaVarianceShadowMapping(normalizedShadowCoord);
		else if(VSSM == 1)
			shadow = varianceSoftShadowMapping(normalizedShadowCoord);
			
	}

	gl_FragColor = shadow * color;

}