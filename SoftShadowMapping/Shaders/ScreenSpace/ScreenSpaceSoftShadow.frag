uniform sampler2D normalMap;
uniform sampler2D hardShadowMap;
uniform mat3 normalMatrix;
uniform float shadowIntensity;
uniform float sigmaColor;
uniform float sigmaSpace;
uniform int kernelSize;
uniform int blockerSearchSize;
uniform int lightSourceRadius;
uniform int windowWidth;
uniform int windowHeight;
uniform int SSPCSS;
uniform int SSABSS;
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
	float sigma = 1.0;

	for(float h = -penumbraWidth; h <= penumbraWidth; h += stepSize) {
		
		shadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(0.0, h))).r;

		if(shadow > 0.0) {

			space = h * h;
			color = (value - shadow) * (value - shadow);
			if(SSABSS == 1) sigma = normalize(normalMatrix * texture2D(normalMap, f_texcoord.xy).xyz).z * 1000.0;
			weight = exp(-(space * invSigmaSpace + color * invSigmaColor)/sigma);
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
		
		shadow.r = bilateralShadowFiltering();
		gl_FragColor = vec4(shadow.r, shadow.r, shadow.r, 1.0);

	} else {

		gl_FragColor = vec4(shadowIntensity, shadowIntensity, shadowIntensity, 1.0);
	
	}

}