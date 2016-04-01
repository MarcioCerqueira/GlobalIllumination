uniform sampler2D hardShadowMap;
uniform sampler2D shadowMap;
uniform sampler2D vertexMap;
uniform mat4 lightMVP;
uniform float shadowIntensity;
uniform float sigmaColor;
uniform float sigmaSpace;
uniform int kernelSize;
uniform int blockerSearchSize;
uniform int lightSourceRadius;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int windowWidth;
uniform int windowHeight;
uniform int SSPCSS;
uniform int SSSM;
varying vec2 f_texcoord;

float computeAverageBlockerDepthBasedOnSSPCSS() {

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

	for(float w = -blockerSearch.x; w <= blockerSearch.x; w += stepSize.x) {
		
		shadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(w, 0.0))).rg;
			
		if(shadow.r == shadowIntensity) {
			
			space = w * w;
			color = (value - shadow.g) * (value - shadow.g);
			weight = exp(-(space * invSigmaSpace + color * invSigmaColor));
			averageDepth += weight * shadow.g;
			numberOfBlockers += weight;

		}

	}

	if(numberOfBlockers == 0)
		return 1.0;
	else
		return averageDepth / numberOfBlockers;

}

vec2 computeAverageBlockerDepthBasedOnSSSM() {

	float averageDepth = 0.0;
	float numberOfBlockers = 0;
	vec2 blockerSearch = vec2(lightSourceRadius)/vec2(shadowMapWidth, shadowMapHeight);
	vec2 stepSize = 2.0 * blockerSearch/float(blockerSearchSize);
	vec2 shadow = vec2(0.0);
	vec4 vertex = texture2D(vertexMap, f_texcoord);
	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
		
	for(float w = -blockerSearch.x; w <= blockerSearch.x; w += stepSize.x) {
		
		float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.xy + vec2(w, 0.0))).z;
		if(normalizedShadowCoord.z > distanceFromLight) {
			averageDepth += distanceFromLight;
			numberOfBlockers++;
		}

	}

	return vec2(averageDepth, numberOfBlockers);

}

void main()
{	

	vec3 shadow = texture2D(hardShadowMap, f_texcoord.xy).rgb;	
	
	if(shadow.r > 0.0) {

		if(SSPCSS == 1) {
			float averageDepth = computeAverageBlockerDepthBasedOnSSPCSS();
			gl_FragColor = vec4(shadow.r, averageDepth, 0.0, 1.0);
		} else if(SSSM == 1) {
			vec2 blockerSearchBuffer = computeAverageBlockerDepthBasedOnSSSM();
			gl_FragColor = vec4(shadow.r, blockerSearchBuffer, 1.0);
		}

	} else {

		gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	
	}

}