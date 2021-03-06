uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform sampler2D hardShadowMap;
uniform mat4 lightMVP;
uniform mat4 MV;
uniform mat3 normalMatrix;
uniform float shadowIntensity;
uniform float sigmaColor;
uniform float sigmaSpace;
uniform float filterThreshold;
uniform int kernelSize;
uniform int blockerSearchSize;
uniform int lightSourceRadius;
uniform int windowWidth;
uniform int windowHeight;
uniform int SSPCSS;
uniform int SSABSS;
uniform int SSSM;
uniform int SSRBSSM;
varying vec2 f_texcoord;

float bilateralShadowFiltering() {

	vec2 compressedValues = texture2D(hardShadowMap, f_texcoord.xy).rg;
	float shadow = 0.0;
	float illuminationCount = 0.0;
	float count = 0.0;
	float penumbraWidth = compressedValues.g;
	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
		
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;

	float space = 0.0;
	float color = 0.0;
	float value = compressedValues.r;
	float weight = 0.0;
	float invSigmaColor = 0.5f / (sigmaColor * sigmaColor);
	float invSigmaSpace = 0.5f / (sigmaSpace * sigmaSpace);
	float sigma = 1;

	for(float h = -penumbraWidth; h <= penumbraWidth; h += stepSize) {
		
		shadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(0.0, h))).r;

		if(shadow > 0.0) {

			space = h * h;
			color = (value - shadow) * (value - shadow);
			if(SSABSS == 1 || SSRBSSM == 1) sigma = normalize(normalMatrix * texture2D(normalMap, f_texcoord.xy).xyz).z * 1000.0;
			weight = exp(-(space * invSigmaSpace + color * invSigmaColor)/sigma);
			illuminationCount += weight * shadow;
			count += weight;

		}

	}
	
	return illuminationCount/count;
	
}

float linearize(float depth) {

	float n = float(1.0);
	float f = float(1000.0);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

float adjustColor(float centralColor, float currentColor, float centralDepth, float currentDepth) 
{

	if(currentColor == 0.0) return centralColor;
	else if(abs(linearize(currentDepth) - linearize(centralDepth)) >= 0.0025) return centralColor;
	else if(currentColor <= shadowIntensity && centralColor == 1.0) return centralColor;
	else if(currentColor == 1.0 && centralColor <= shadowIntensity) return centralColor;
	else return currentColor;
	
}

float meanShadowFiltering() {

	float illuminationCount = 0.0;
	float count = 0.0;
	vec4 color = texture2D(hardShadowMap, f_texcoord.xy);
	float penumbraWidth = color.b;
	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
		
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;

	
	for(float w = -penumbraWidth; w <= penumbraWidth; w += stepSize) {
		
		vec4 currentColor = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(w, 0.0)));
		currentColor.r = adjustColor(color.r, currentColor.r, color.g, currentColor.g);
		illuminationCount += currentColor.r;
		count++;

	}
		
	return illuminationCount/count;
	
}

float gaussianShadowFiltering()
{

	vec4 compressedValues = texture2D(hardShadowMap, f_texcoord.xy);
	vec4 shadow = 0.0;
	float penumbraWidth = compressedValues.g;
	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
	vec2 illuminationCount = compressedValues.ba;
	float invSigmaSpace = 0.5f / (sigmaSpace * sigmaSpace);
	float distance = -(MV * texture2D(vertexMap, f_texcoord.xy)).z;
	
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;
	
	for(float h = -penumbraWidth; h <= penumbraWidth; h += stepSize) {
		
		shadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(0.0, h)));
		float currentDistance = -(MV * texture2D(vertexMap, f_texcoord.xy + vec2(0.0, h))).z;
		
		if(abs(distance - currentDistance) < filterThreshold) {
			
			if(shadow.r > 0.0) {
				float weight = exp(-(h * h * invSigmaSpace));
				illuminationCount += weight * shadow.ba;
			}

		} else {
		
			for(float w = -penumbraWidth; w <= penumbraWidth; w += stepSize) {
				shadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(w, h)));
				if(shadow.r > 0.0) {
					float weight = exp(-(w * w * invSigmaSpace));
					illuminationCount.r += weight * shadow.r;
					illuminationCount.g += weight;
				}
			}

		}
	
	}

	return illuminationCount.r / illuminationCount.g;

}

void main()
{	

	vec2 shadow = texture2D(hardShadowMap, f_texcoord.xy).rg;	
	
	if(shadow.r > 0.0) {
		
		if(SSPCSS == 1 || SSABSS == 1 || SSRBSSM == 1)
			shadow.r = bilateralShadowFiltering();
		else if(SSSM == 1)
			shadow.r = gaussianShadowFiltering();
		//else if(SSRBSSM == 1)
		//	shadow.r = meanShadowFiltering();

		gl_FragColor = vec4(shadow.r, shadow.r, shadow.r, 1.0);

	} else {

		gl_FragColor = vec4(shadowIntensity, shadowIntensity, shadowIntensity, 1.0);
	
	}

}