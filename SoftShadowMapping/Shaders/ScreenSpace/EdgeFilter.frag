uniform sampler2D image;
uniform sampler2D shadowMap;
uniform sampler2D vertexMap;
uniform mat4 MV;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform float shadowIntensity;
uniform float fov;
uniform int width;
uniform int height;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int blockerSearchSize;
uniform int zNear;
uniform int zFar;
uniform int lightSourceRadius;
varying vec2 f_texcoord;

float computeAverageBlockerDepthBasedOnPCF(vec4 normalizedShadowCoord) 
{

	float averageDepth = 0.0;
	int numberOfBlockers = 0;
	float tempLightSourceRadius = 0.0;
	if(lightSourceRadius > 5.0) tempLightSourceRadius = lightSourceRadius;
	else tempLightSourceRadius = 24.0;
	float blockerSearchWidth = float(tempLightSourceRadius)/float(shadowMapWidth);
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



float computePenumbraWidth(float averageDepth, float distanceToLight)
{

	if(averageDepth < 0.99)
		return 0.0;

	float penumbraWidth = ((distanceToLight - averageDepth)/averageDepth) * float(lightSourceRadius);
	return (float(1.0) * penumbraWidth)/distanceToLight;
	
}


float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}


void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);	
	if(vertex.x == 0.0) discard;
	
	vec2 step, center;
	step.s = 1.0/float(width);
	step.t = 1.0/float(height);
	center.s = f_texcoord.s;
	center.t = f_texcoord.t;

	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedLightCoord = shadowCoord / shadowCoord.w;

	vec4 currentFragment = texture2D(image, center);
	float penumbraWidth = 0.0;
	if(currentFragment.r == shadowIntensity) {
		for(int y = -1; y <= 1; y++) {
			for(int x = -1; x <= 1; x++) {
				vec4 neighbourFragment = texture2D(image, vec2(center.s + x * step.s, center.t + y * step.t));
				if(currentFragment.r != neighbourFragment.r && abs(linearize(currentFragment.g) - linearize(neighbourFragment.g)) <= 0.0025 && neighbourFragment.b == 1.0) {
					float averageDepth = computeAverageBlockerDepthBasedOnPCF(normalizedLightCoord);
					penumbraWidth = computePenumbraWidth(averageDepth, normalizedLightCoord.z);
					y = 2;
					x = 2;
				}
			}	
		} 
	}

	vec4 position = MVP * vertex;
	float depth = position.z/position.w;
	depth = depth * 0.5 + 0.5;
	 
	gl_FragData[0] = vec4(currentFragment.rgb, penumbraWidth);
	gl_FragData[1] = position;

}