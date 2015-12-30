uniform sampler2D vertexMap;
uniform sampler2D hardShadowMap;
uniform mat4 lightMVP;
uniform mat4 MV;
uniform float shadowIntensity;
uniform float fov;
uniform float sigmaColor;
uniform float sigmaSpace;
uniform int kernelSize;
uniform int blockerSearchSize;
uniform int lightSourceRadius;
uniform int windowWidth;
uniform int windowHeight;
varying vec2 f_texcoord;

float computeAverageBlockerDepth() {

	float averageDepth = 0.0;
	float numberOfBlockers = 0;
	vec2 blockerSearch = vec2(lightSourceRadius)/vec2(windowWidth, windowHeight);
	vec2 stepSize = 2.0 * blockerSearch/float(blockerSearchSize);
	vec2 shadow = vec2(0.0);
	
	float space = 0.0;
	float color = 0.0;
	float value = texture2D(hardShadowMap, f_texcoord.xy).g;
	float weight = 0.0;
	float invSigmaColor = 0.5f / (sigmaColor * sigmaColor);
	float invSigmaSpace = 0.5f / (sigmaSpace * sigmaSpace);

	for(float h = -blockerSearch.y; h <= blockerSearch.y; h += stepSize.y) {
		
		shadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(0.0, h))).rg;
			
		if(shadow.r == shadowIntensity) {
			
			space = h * h;
			color = (value - shadow.g) * (value - shadow.g);
			weight = exp(-(space * invSigmaSpace + color * invSigmaColor));
			averageDepth += weight * shadow.g;
			numberOfBlockers += weight;

		}

	}

	if(numberOfBlockers == 0)
		return value;
	else
		return averageDepth / numberOfBlockers;

}

float computePenumbraWidth(float averageDepth, float distanceToLight, vec4 vertex) {
	
	if(averageDepth < 0.99) 
		return 0.0;

	float deye = -(MV * vertex).z/100.0;
	float dscreen = 1.0/(2.0 * tan(fov/2.0));
	float penumbraWidth = ((distanceToLight - averageDepth)/averageDepth) * float(lightSourceRadius);
	return dscreen * penumbraWidth/deye;

}

float bilateralFilter(float penumbraWidth) {

	float shadow = 0.0;
	float illuminationCount = 0.0;
	float count = 0.0;
	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
		
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;

	float space = 0.0;
	float color = 0.0;
	float value = texture2D(hardShadowMap, f_texcoord.xy).r;
	float weight = 0.0;
	float invSigmaColor = 0.5f / (sigmaColor * sigmaColor);
	float invSigmaSpace = 0.5f / (sigmaSpace * sigmaSpace);

	for(float w = -penumbraWidth; w <= penumbraWidth; w += stepSize) {
		
		shadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(w, 0.0))).r;

		if(shadow > 0.0) {

			space = w * w;
			color = (value - shadow) * (value - shadow);
			weight = exp(-(space * invSigmaSpace + color * invSigmaColor));
			illuminationCount += weight * shadow;
			count += weight;

		}

	}
		
	return illuminationCount/count;
	
}

void main()
{	

	vec2 shadow = texture2D(hardShadowMap, f_texcoord.xy).rg;	
	
	if(shadow.r > 0.0) {
	
		vec4 vertex = texture2D(vertexMap, f_texcoord);
		vec4 shadowCoord = lightMVP * vertex;
		vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	
		float averageDepth = computeAverageBlockerDepth();
		float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z, vertex);
		shadow.r = bilateralFilter(penumbraWidth);
		gl_FragColor = vec4(shadow.r, penumbraWidth, 0.0, 1.0);

	} else {

		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	
	}

}