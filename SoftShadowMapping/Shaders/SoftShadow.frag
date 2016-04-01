uniform sampler2D shadowMap;
uniform sampler2D SATShadowMap;
uniform sampler2D hierarchicalShadowMap;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec4 momentTranslationVector;
uniform mat4 momentInverseRotationMatrix;
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
uniform int ESSM;
uniform int MSSM;
uniform int SAT;

vec4 phong(float shadow)
{

	vec4 light_ambient = vec4(0.4, 0.4, 0.4, 1);
    vec4 light_specular = vec4(0.25, 0.25, 0.25, 1);
    vec4 light_diffuse = vec4(0.5, 0.5, 0.5, 1);
    float shininess = 10.0;
	float specShadow = shadow - shadowIntensity;

    vec3 L = normalize(lightPosition.xyz - v);   
    vec3 E = normalize(-v); // we are in Eye Coordinates, so EyePos is (0,0,0)  
    vec3 R = normalize(-reflect(L, N));  
 
    //calculate Ambient Term:  
    vec4 Iamb = light_ambient;    

    //calculate Diffuse Term:  
    vec4 Idiff = light_diffuse * max(dot(N,L), 0.0);    
   
    // calculate Specular Term:
    vec4 Ispec = specShadow * light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);

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
   
	return shadow * sceneColor * (Idiff + Ispec + Iamb);  
   
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

vec3 computeMomentDepthsFromMSM(vec4 moments, vec3 normalizedShadowCoord)
{

	vec3 z, c, d;
	float bias = 0.00003;
	vec4 b = momentInverseRotationMatrix * (moments - momentTranslationVector);
	b = (1.0 - bias) * b + bias * vec4(0.5, 0.5, 0.5, 0.5);
	
	z.x = linearize(normalizedShadowCoord.z);
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
	
	return z;

}

vec3 computeWeightsFromMSM(vec4 moments, vec3 z)
{

	vec3 w;
	float bias = 0.00003;
	vec4 b = momentInverseRotationMatrix * (moments - momentTranslationVector);
	b = (1.0 - bias) * b + bias * vec4(0.5, 0.5, 0.5, 0.5);
	
	w.x = (z.y * z.z - b.x * (z.y + z.z) + b.y)/((z.x - z.y) * (z.x - z.z));
	w.y = (z.x * z.z - b.x * (z.x + z.z) + b.y)/((z.z - z.y) * (z.x - z.y));
	w.z = 1.0f - w.x - w.y;
	return w;

}

float computeShadowIntensityFromMSM(vec4 moments, vec3 z)
{

	float bias = 0.00003;
	vec4 b = momentInverseRotationMatrix * (moments - momentTranslationVector);
	b = (1.0 - bias) * b + bias * vec4(0.5, 0.5, 0.5, 0.5);
	
	if(z.x <= z.y)
		return 1.0;
	else if(z.x <= z.z)
		return clamp((1.0 - clamp((z.x * z.z - b.x * (z.x + z.z) + b.y)/((z.z - z.y) * (z.x - z.y)), 0.0, 1.0)), shadowIntensity, 1.0);
	else 
		return clamp((1.0 - clamp(1.0 - (z.y * z.z - b.x * (z.y + z.z) + b.y)/((z.x - z.y) * (z.x - z.z)), 0.0, 1.0)), shadowIntensity, 1.0);
	
}


float computeAverageBlockerDepthBasedOnPCF(vec4 normalizedShadowCoord) 
{

	float averageDepth = 0.0;
	int numberOfBlockers = 0;
	float blockerSearchWidth = float(lightSourceRadius)/float(shadowMapWidth);
	float stepSize = 2.0 * blockerSearchWidth/float(blockerSearchSize);
	float filterWidth = (blockerSearchSize - 1.0) * 0.5;
	
	for(int h = -filterWidth; h <= filterWidth; h++) {
		for(int w = -filterWidth; w <= filterWidth; w++) {
			
			float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h) * blockerSearchWidth/filterWidth)).z;
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
	float filterWidth = (blockerSearchSize - 1.0) * 0.5;
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
 
		for(int h = -filterWidth; h <= filterWidth; h++)
			for(int w = -filterWidth; w <= filterWidth; w++)
				moments += recombinePrecision(texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h) * blockerSearchWidth/filterWidth))).xy;
				
		moments.xy /= float(blockerSearchSize * blockerSearchSize);

	}
	
	moments.xy += 0.5;
	
	float averageDepth = moments.x;
	float probability = chebyshevUpperBound(moments, zunocc);
	float zocc = nonLinearize((averageDepth - probability * zunocc)/(1.0 - probability));
	if(probability > 0.99) zocc = 1.0;
	return zocc;

}

float computeAverageBlockerDepthBasedOnESM(vec4 normalizedShadowCoord)
{
	
	float blockerSearchWidth = float(lightSourceRadius)/float(shadowMapWidth);
	float stepSize = 2.0 * blockerSearchWidth/float(blockerSearchSize);
	float filterWidth = (blockerSearchSize - 1.0) * 0.5;
	
	float averageDepth = 0.0;
	float averageExponential = 0.0;
	float zunocc = 0.0;
	float zocc = 0.0;
	float c = 80.0;
	float probability = 0.0;
	vec3 sum = vec3(0.0);

	if(SAT == 1) {
 
		float div = 2.0 * blockerSearchWidth/stepSize;
		float SATFilterSize = div / 2.0;

		float xmax = normalizedShadowCoord.x + (div) * stepSize;
		float xmin = normalizedShadowCoord.x - (div + 1.0) * stepSize;
		float ymax = normalizedShadowCoord.y + (div) * stepSize;
		float ymin = normalizedShadowCoord.y - (div + 1.0) * stepSize;
	
		vec3 A = texture2D(SATShadowMap, vec2(xmin, ymin)).xyz;
		vec3 B = texture2D(SATShadowMap, vec2(xmax, ymin)).xyz;
		vec3 C = texture2D(SATShadowMap, vec2(xmin, ymax)).xyz;
		vec3 D = texture2D(SATShadowMap, vec2(xmax, ymax)).xyz;
		vec3 sum = (D + A - B - C)/float(SATFilterSize * SATFilterSize);
		
		averageDepth = sum.x;
		averageExponential = sum.y;
		zunocc = sum.z;

	} else {

		for(int h = -filterWidth; h <= filterWidth; h++)
			for(int w = -filterWidth; w <= filterWidth; w++)
				sum += texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h) * blockerSearchWidth/filterWidth)).xyz;	
		
		averageDepth = sum.x / float(blockerSearchSize * blockerSearchSize);
		averageExponential = sum.y / float(blockerSearchSize * blockerSearchSize);
		zunocc = sum.z / float(blockerSearchSize * blockerSearchSize);

	}

	probability = exp(-c * linearize(normalizedShadowCoord.z)) * averageExponential;
	if(probability > 0.91) return 1.0;
	zocc = (averageDepth - exp(-c * linearize(normalizedShadowCoord.z)) * zunocc)/(1.0 - probability);
	return nonLinearize(zocc);
	
}

float computeAverageBlockerDepthBasedOnMSM(vec4 normalizedShadowCoord) 
{

	float bias = 0.01;
	float averageDepth = 0.0;
	float blockerSearchWidth = float(lightSourceRadius)/float(shadowMapWidth);
	float stepSize = 2.0 * blockerSearchWidth/float(blockerSearchSize);
	float filterWidth = (blockerSearchSize - 1.0) * 0.5;
	vec4 moments = vec4(0.0);
	vec3 depths = vec3(0.0);
	vec3 weights = vec3(0.0);
	float sum = 0.0;
	
	if(SAT == 1) {
 
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
		moments = (D + A - B - C)/float(SATFilterSize * SATFilterSize);
	
	} else {

		for(int h = -filterWidth; h <= filterWidth; h++)
			for(int w = -filterWidth; w <= filterWidth; w++)
				moments += texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h) * blockerSearchWidth/filterWidth));
		
		moments /= float(blockerSearchSize * blockerSearchSize);

	}

	depths = computeMomentDepthsFromMSM(moments, normalizedShadowCoord);
	weights = 1.0 - computeWeightsFromMSM(moments, depths);
	
	if(depths.x > depths.y) {
		averageDepth += weights.y * depths.y;
		sum += weights.y;
	}
		
	if(depths.x > depths.z) {
		averageDepth += weights.z * depths.z;
		sum += weights.z;
	}

	averageDepth += bias * depths.x;
	sum += bias;
	
	if(sum > 1.0 - bias) 
		return 1.0;
	else 
		return nonLinearize(averageDepth/sum);
	
}

float computePenumbraWidth(float averageDepth, float distanceToLight)
{

	if(averageDepth < 0.99)
		return 0.0;

	float penumbraWidth = ((distanceToLight - averageDepth)/averageDepth) * float(lightSourceRadius);
	return (float(zNear) * penumbraWidth)/distanceToLight;
	
}

float PCF(float penumbraWidth, vec4 normalizedShadowCoord)
{

	float illuminationCount = 0.0;
	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
	float filterWidth = (kernelSize - 1.0) * 0.5;
		
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;

	for(int h = -filterWidth; h <= filterWidth; h++) {
		for(int w = -filterWidth; w <= filterWidth; w++) {
			
			float distanceFromLight = texture2D(shadowMap, normalizedShadowCoord.xy + vec2(w, h) * penumbraWidth/filterWidth).z;
			if(normalizedShadowCoord.z <= distanceFromLight) illuminationCount++;
			else illuminationCount += shadowIntensity;
				
		}
	}
		
	return illuminationCount/float(kernelSize * kernelSize);

}

float VSM(float penumbraWidth, vec4 normalizedShadowCoord)
{

	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
	float filterWidth = (kernelSize - 1.0) * 0.5;
	
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

		for(int h = -filterWidth; h <= filterWidth; h++)
			for(int w = -filterWidth; w <= filterWidth; w++)
				moments += recombinePrecision(texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h) * penumbraWidth/filterWidth))).xy;
			
		moments /= float(kernelSize * kernelSize);
	
	}

	moments.xy += 0.5;
	return clamp(mix(chebyshevUpperBound(moments, linearize(normalizedShadowCoord.z)), 1.0, shadowIntensity), 0.0, 1.0);

}

float ESM(float penumbraWidth, vec4 normalizedShadowCoord)
{

	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
	float filterWidth = (kernelSize - 1.0) * 0.5;

	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;
	
	float c = 80.0;
	float averageExponential = 0.0;
	
	if(SAT == 1) {

		float div = 2.0 * penumbraWidth/stepSize;
		float SATFilterSize = div / 2.0;

		float xmax = normalizedShadowCoord.x + (div) * stepSize;
		float xmin = normalizedShadowCoord.x - (div + 1.0) * stepSize;
		float ymax = normalizedShadowCoord.y + (div) * stepSize;
		float ymin = normalizedShadowCoord.y - (div + 1.0) * stepSize;
	
		float A = texture2D(SATShadowMap, vec2(xmin, ymin)).y;
		float B = texture2D(SATShadowMap, vec2(xmax, ymin)).y;
		float C = texture2D(SATShadowMap, vec2(xmin, ymax)).y;
		float D = texture2D(SATShadowMap, vec2(xmax, ymax)).y;
		averageExponential = (D + A - B - C)/float(SATFilterSize * SATFilterSize);

	} else {

		for(int h = -filterWidth; h <= filterWidth; h++)
			for(int w = -filterWidth; w <= filterWidth; w++)
				averageExponential += texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h) * penumbraWidth/filterWidth)).y;
		
		averageExponential /= float(kernelSize * kernelSize);
	
	}
	
	float distanceFromLight = texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy)).x + 0.0001;
	float visibility = exp(-c * linearize(normalizedShadowCoord.z)) * averageExponential;
	visibility = clamp(visibility, shadowIntensity, 1.0);
	
	//Returns 1.0 for "non-planarity" kernel
	if(distanceFromLight > linearize(normalizedShadowCoord.z) && visibility == shadowIntensity)
		return 1.0;
	else
		return visibility;

}

float MSM(float penumbraWidth, vec4 normalizedShadowCoord)
{

	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
	float filterWidth = (kernelSize - 1.0) * 0.5;
	
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;
	
	vec4 moments = vec4(0.0);
	vec3 depths = vec3(0.0);

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
		moments = (D + A - B - C)/float(SATFilterSize * SATFilterSize);

	} else {

		for(int h = -filterWidth; h <= filterWidth; h++)
			for(int w = -filterWidth; w <= filterWidth; w++)
				moments += texture2D(SATShadowMap, vec2(normalizedShadowCoord.xy + vec2(w, h) * penumbraWidth/filterWidth));
	
		moments /= float(kernelSize * kernelSize);
	
	}

	depths = computeMomentDepthsFromMSM(moments, normalizedShadowCoord);
	return computeShadowIntensityFromMSM(moments, depths);

}

float computeVisibilityFromHSM(vec4 normalizedShadowCoord) 
{

	float mipLevel = float(shadowMapWidth)/1024.0 + 0.5;
	if(shadowMapWidth > 1024) mipLevel = 1.75;
	vec2 minMax = texture2DLod(hierarchicalShadowMap, normalizedShadowCoord.xy, mipLevel).xy;
	
	if(normalizedShadowCoord.z <= minMax.x) return 1.0;
	else if(normalizedShadowCoord.z > minMax.y) return shadowIntensity;
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

	float visibility = computeVisibilityFromHSM(normalizedShadowCoord);
	if(visibility == shadowIntensity || visibility == 1.0)
		return visibility;

	float averageDepth = computeAverageBlockerDepthBasedOnVSM(normalizedShadowCoord);
	float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z);
	return VSM(penumbraWidth, normalizedShadowCoord);

}

float exponentialSoftShadowMapping(vec4 normalizedShadowCoord)
{
		
	float averageDepth = computeAverageBlockerDepthBasedOnESM(normalizedShadowCoord);
	float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z);
	return ESM(penumbraWidth, normalizedShadowCoord);
	
}

float momentSoftShadowMapping(vec4 normalizedShadowCoord)
{

	float averageDepth = computeAverageBlockerDepthBasedOnMSM(normalizedShadowCoord);
	float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z);
	return MSM(penumbraWidth, normalizedShadowCoord);
	
}

void main()
{	

	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	float shadow = computePreEvaluationBasedOnNormalOrientation();
	
	if(shadowCoord.w > 0.0 && shadow == 1.0) {
	
		if(PCSS == 1)
			shadow = percentageCloserSoftShadows(normalizedShadowCoord);
		else if(SAVSM == 1)
			shadow = summedAreaVarianceShadowMapping(normalizedShadowCoord);
		else if(VSSM == 1)
			shadow = varianceSoftShadowMapping(normalizedShadowCoord);
		else if(ESSM == 1)
			shadow = exponentialSoftShadowMapping(normalizedShadowCoord);
		else if(MSSM == 1)
			shadow = momentSoftShadowMapping(normalizedShadowCoord);
		
	}

	gl_FragColor = phong(shadow);

}