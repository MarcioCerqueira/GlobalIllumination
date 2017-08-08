uniform sampler2D shadowMap;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform sampler2D hierarchicalShadowMap;
varying vec2 f_texcoord;
uniform mat4 MV;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat4 inverseLightMVP;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform vec2 shadowMapStep;
uniform float shadowIntensity;
uniform float depthThreshold;
uniform int width;
uniform int height;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int maxSearch;
uniform int blockerSearchSize;
uniform int kernelSize;
uniform int lightSourceRadius;
uniform int SSEDTSSM;
float newDepth;

float compressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return -2.0 - ((0.5 - normalizedDiscontinuity) * 2.0);

}

float decompressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return (0.5 - ((normalizedDiscontinuity + 2.0) * -1.0)/2.0);

}

bool getDisc(vec4 normalizedLightCoord, vec2 dir, float discType)
{

	float distanceFromLight;
			
	if(dir.x == 0.0) {
		
		normalizedLightCoord.x -= shadowMapStep.x;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		bool isLeftUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
		if(isLeftUmbra) return true;

		normalizedLightCoord.x += 2.0 * shadowMapStep.x;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		bool isRightUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
		if(isRightUmbra) return true;

		normalizedLightCoord.x -= shadowMapStep.x;

	}

	if(dir.y == 0.0) {
	
		normalizedLightCoord.y += shadowMapStep.y;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		bool isBottomUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
		if(isBottomUmbra) return true;

		normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		bool isTopUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
		if(isTopUmbra) return true;

	}

	return false;

	
}

bool getDisc(vec4 normalizedLightCoord, vec2 dir, vec4 discType)
{

	float distanceFromLight;
	vec4 relativeCoord = normalizedLightCoord;
	newDepth = normalizedLightCoord.z;

	if(dir.x == 0.0) {
		
		if(discType.r == 0.5 || discType.r == 0.75) {
			
			relativeCoord.x = normalizedLightCoord.x - shadowMapStep.x;
			distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
			bool isLeftUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
			if((isLeftUmbra && discType.b == 0.0) || (!isLeftUmbra && discType.b == 1.0)) return true;
			
		}

		if(discType.r == 0.75 || discType.r == 0.25) {

			relativeCoord.x = normalizedLightCoord.x + shadowMapStep.x;
			distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
			bool isRightUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
			if((isRightUmbra && discType.b == 0.0) || (!isRightUmbra && discType.b == 1.0)) return true;
			
		}

	}

	if(dir.y == 0.0) {
	
		if(discType.g == 0.5 || discType.g == 0.75) {
				
			relativeCoord.y = normalizedLightCoord.y + shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
			bool isBottomUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
			if((isBottomUmbra && discType.b == 0.0) || (!isBottomUmbra && discType.b == 1.0)) return true;
			
		}

		if(discType.g == 0.75 || discType.g == 0.25) {
			
			relativeCoord.y = normalizedLightCoord.y - shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
			bool isTopUmbra = (normalizedLightCoord.z <= distanceFromLight) ? false : true; 
			if((isTopUmbra && discType.b == 0.0) || (!isTopUmbra && discType.b == 1.0)) return true;
			
		}

	}

	return false;

	
}


float computeDiscontinuityLength(vec4 inputDiscontinuity, vec4 lightCoord, vec2 dir, int maxSearch, vec2 subCoord)
{

	vec4 centeredLightCoord = lightCoord;
	
	float foundEdgeEnd = 0.0;
	bool hasDisc = false;
	
	if(dir.x == 0.0 && inputDiscontinuity.r == 0.0 && inputDiscontinuity.g != 0.0) return -1.0;
	if(dir.y == 0.0 && inputDiscontinuity.r != 0.0 && inputDiscontinuity.g == 0.0) return -1.0;
	
	float dist = 1.0;

	vec2 shadowMapDiscontinuityStep = dir * shadowMapStep;
	centeredLightCoord.xy += shadowMapDiscontinuityStep;
	
	for(int it = 0; it < maxSearch; it++) {
		
		float distanceFromLight = texture2D(shadowMap, centeredLightCoord.st).z;

		//To solve incorrect shadowing due to depth accuracy, we use a depth threshold/bias
		if(abs(centeredLightCoord.z - distanceFromLight) < depthThreshold && inputDiscontinuity.b == 0.0)
			centeredLightCoord.z -= depthThreshold;

		float center = (centeredLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		bool isCenterUmbra = !bool(center);
		
		if(isCenterUmbra) {

			foundEdgeEnd = 1.0;
			break;
		
		} else {

		    hasDisc = getDisc(centeredLightCoord, dir, inputDiscontinuity);
			if(!hasDisc) break;
		
		}

		dist++;
		centeredLightCoord.xy += shadowMapDiscontinuityStep;
		
	}
	
	return mix(-dist, dist, foundEdgeEnd);

}

float normalizeDiscontinuitySpace(vec2 dir, int maxSearch, float subCoord) {

	//If negative discontinuity in both sides, do not fill
	if(dir.x < 0.0 && dir.y < 0.0)
		return -1.0;
	
	float edgeLength = min(abs(dir.x) + abs(dir.y) - 1.0, float(maxSearch));
	float normalizedDiscontinuity = 1.0 - max(dir.x, dir.y)/edgeLength;
	
	//If positive discontinuity in both sides, we must handle the sub-coord addition in a different way
	//If subCoord < 0.5 return x; else return y;
	if(dir.x == dir.y)
		normalizedDiscontinuity += mix(subCoord/edgeLength, (1.0 - subCoord)/edgeLength, step(0.5, subCoord));
	//If left or down, add (1.0 - subCoord) 
	else if(dir.x == max(dir.x, dir.y))
		normalizedDiscontinuity += (1.0 - subCoord)/edgeLength;
	else
		normalizedDiscontinuity += subCoord/edgeLength;

	//If positive discontinuity in both sides
	if(dir.x > 0.0 && dir.y > 0.0)
		return compressPositiveDiscontinuity(normalizedDiscontinuity);
	else
		return normalizedDiscontinuity;

}

vec4 orientateDS(vec4 lightCoord, vec4 discontinuity, vec2 subCoord)
{
	
	float left = computeDiscontinuityLength(discontinuity, lightCoord, vec2(-1, 0), maxSearch, subCoord);
	float right = computeDiscontinuityLength(discontinuity, lightCoord, vec2(1, 0), maxSearch, subCoord);
	float down = computeDiscontinuityLength(discontinuity, lightCoord, vec2(0, -1), maxSearch, subCoord);
	float up = computeDiscontinuityLength(discontinuity, lightCoord, vec2(0, 1), maxSearch, subCoord);
	return vec4(left, right, down, up);

}

vec4 normalizeDS(vec4 lightCoord, vec4 discontinuity, vec2 subCoord, vec4 dir)
{

	vec4 normalizedDiscontinuityCoord = vec4(0.0);
	normalizedDiscontinuityCoord.x = normalizeDiscontinuitySpace(vec2(dir.x, dir.y), maxSearch, subCoord.x);
	normalizedDiscontinuityCoord.y = normalizeDiscontinuitySpace(vec2(dir.z, dir.w), maxSearch, subCoord.y);
	return normalizedDiscontinuityCoord;

}

/* 
type mix(x, y, step(a, b)):
	if(b < a)
		return x;
	else
		return y;
*/

float clipONDS(vec4 lightCoord, vec4 normalizedDiscontinuity, vec4 discontinuity, vec2 subCoord)
{

	//If negative discontinuity on both directions, do not clip the ONDS
	if(normalizedDiscontinuity.x == -1.0 && normalizedDiscontinuity.y == -1.0) 
		return 1.0;
	
	//If positive discontinuity, clip all the ONDS
	if(normalizedDiscontinuity.x <= -2.0 || normalizedDiscontinuity.y <= -2.0)
		return 0.0;
	//if(normalizedDiscontinuity.x <= -2.0) normalizedDiscontinuity.x = abs(normalizedDiscontinuity.x) - 2.0;
	//if(normalizedDiscontinuity.y <= -2.0) normalizedDiscontinuity.y = abs(normalizedDiscontinuity.y) - 2.0;


	//Otherwise
	float a = mix(step(normalizedDiscontinuity.y, subCoord.x), step(normalizedDiscontinuity.y, 1.0 - subCoord.x), step(discontinuity.r, 0.25));
	float b = mix(step(normalizedDiscontinuity.x, 1.0 - subCoord.y), step(normalizedDiscontinuity.x, subCoord.y), step(discontinuity.g, 0.25));
	return min(a, b);	

}

vec4 getDisc(vec4 normalizedLightCoord, float distanceFromLight) 
{

	vec4 dir = vec4(0.0, 0.0, 0.0, 0.0);
	//x = left; y = right; z = bottom; w = top
	
	normalizedLightCoord.x -= shadowMapStep.x;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.x = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	normalizedLightCoord.x += 2.0 * shadowMapStep.x;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.y = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	normalizedLightCoord.x -= shadowMapStep.x;
	normalizedLightCoord.y += shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.z = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.w = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	return dir;

}

vec4 computeDiscontinuity(vec4 normalizedLightCoord, float distanceFromLight) 
{

	float discType = 0.0;
	float center = 1.0;
	vec4 dir = getDisc(normalizedLightCoord, distanceFromLight);
	vec4 disc = abs(dir - center);
	vec2 color = (2.0 * disc.xz + disc.yw)/4.0;
	return vec4(color, discType, 1.0);		
		
}

float computeShadowFromSMSR(vec4 normalizedLightCoord) 
{
	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	
	if(shadow == 1.0) {

		vec4 discontinuity = computeDiscontinuity(normalizedLightCoord, distanceFromLight);
		vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
		
		if(discontinuity.r == 0.75 || discontinuity.g == 0.75)
			return shadowIntensity;
	
		if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {

			vec4 discontinuitySpace = orientateDS(normalizedLightCoord, discontinuity, subCoord);
			vec4 normalizedDiscontinuity = normalizeDS(normalizedLightCoord, discontinuity, subCoord, discontinuitySpace);
			float fill = clipONDS(normalizedLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
			fill = mix(fill, 1.0, shadowIntensity);
			return fill;

		} else {

			return 1.0;
			
		}

		
	} else {

		return shadowIntensity;

	}

}

float computePreEvaluationBasedOnNormalOrientation(vec4 vertex, vec4 normal)
{

	vertex = MV * vertex;
	normal.xyz = normalize(normalMatrix * normal.xyz);

	vec3 L = normalize(lightPosition.xyz - vertex.xyz);   
	
	if(!bool(normal.w))
		normal.xyz *= -1;

	if(max(dot(normal.xyz,L), 0.0) == 0) 
		return shadowIntensity;
	else
		return 1.0;

}

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

float computeScreenSpacePenumbraWidth(float averageDepth, float distanceToLight, vec4 vertex)
{

	if(averageDepth < 0.99)
		return 0.0;

	float deye = -(MV * vertex).z/150.0;
	float dscreen = 1.0/(2.0 * tan(45.0/2.0));
	float penumbraWidth = ((distanceToLight - averageDepth)/averageDepth) * float(lightSourceRadius);
	return dscreen * penumbraWidth/deye;
	
}

float RPCF(float shadow, float penumbraWidth, vec4 normalizedLightCoord)
{

	float centralShadow = (shadow == shadowIntensity) ? 0.0 : 1.0;
	float illuminationCount = centralShadow;
	
	vec4 neighbourNormalizedLightCoord = vec4(normalizedLightCoord.xy + vec2(1.0, 1.0) * penumbraWidth, normalizedLightCoord.zw);
	//float distanceFromLight = texture2D(shadowMap, neighbourNormalizedLightCoord.st).z;		
	//float neighbourShadow = (neighbourNormalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	float neighbourShadow = computeShadowFromSMSR(neighbourNormalizedLightCoord);	
	neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
	illuminationCount += neighbourShadow;

	neighbourNormalizedLightCoord = vec4(normalizedLightCoord.xy + vec2(-1.0, -1.0) * penumbraWidth, normalizedLightCoord.zw);
	//distanceFromLight = texture2D(shadowMap, neighbourNormalizedLightCoord.st).z;		
	//neighbourShadow = (neighbourNormalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	neighbourShadow = computeShadowFromSMSR(neighbourNormalizedLightCoord);	
	neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
	illuminationCount += neighbourShadow;

	neighbourNormalizedLightCoord = vec4(normalizedLightCoord.xy + vec2(-1.0, 1.0) * penumbraWidth, normalizedLightCoord.zw);
	//distanceFromLight = texture2D(shadowMap, neighbourNormalizedLightCoord.st).z;		
	//neighbourShadow = (neighbourNormalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	neighbourShadow = computeShadowFromSMSR(neighbourNormalizedLightCoord);	
	neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
	illuminationCount += neighbourShadow;

	neighbourNormalizedLightCoord = vec4(normalizedLightCoord.xy + vec2(1.0, -1.0) * penumbraWidth, normalizedLightCoord.zw);
	//distanceFromLight = texture2D(shadowMap, neighbourNormalizedLightCoord.st).z;		
	//neighbourShadow = (neighbourNormalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	neighbourShadow = computeShadowFromSMSR(neighbourNormalizedLightCoord);	
	neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
	illuminationCount += neighbourShadow;
	
	return illuminationCount/float(5.0);

}

float computeVisibilityFromHSM(vec4 normalizedShadowCoord) 
{

	float mipLevel = float(shadowMapWidth)/1024.0 + 0.5;
	if(shadowMapWidth > 1024) mipLevel = 1.75;
	vec2 minMax = texture2DLod(hierarchicalShadowMap, normalizedShadowCoord.xy, 1.5).xy;
	
	if(normalizedShadowCoord.z <= minMax.x) return 1.0;
	else if(normalizedShadowCoord.z > minMax.y) return 0.0;
	else return 0.5;
	
}

void main()
{	

	/*
	vec4 vertex = texture2D(vertexMap, f_texcoord);	
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 normal = texture2D(normalMap, f_texcoord);
	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedLightCoord = shadowCoord / shadowCoord.w;
	vec4 normalizedCameraCoord = vec4(gl_FragCoord.x/float(width), gl_FragCoord.y/float(height), gl_FragCoord.z, 1.0);
	float shadow = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	float preEvaluatedShadow = shadow;
	float visibility = 0.0;

	if(shadow == 1.0) {
	
		visibility = 0.5;//computeVisibilityFromHSM(normalizedLightCoord);
		
		if(visibility == 0.5) {

			//float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
			//shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
			shadow = computeShadowFromSMSR(normalizedLightCoord, normalizedCameraCoord);	
			float averageDepth = computeAverageBlockerDepthBasedOnPCF(normalizedLightCoord);
			if(SSEDTSSM == 0.0) {
				float penumbraWidth = computePenumbraWidth(averageDepth, normalizedLightCoord.z);
				visibility = RPCF(shadow, penumbraWidth, normalizedLightCoord);
				if(visibility != 0.0 && visibility != 1.0) visibility = 0.5;//penumbraWidth;
			} else {
				float penumbraWidth = computeScreenSpacePenumbraWidth(averageDepth, normalizedLightCoord.z, vertex);
				visibility = penumbraWidth;
			}

		}
		
	}

	vec4 position = MVP * vertex;
	float depth = position.z/position.w;
	depth = depth * 0.5 + 0.5;
	
	gl_FragData[0] = vec4(shadow, depth, preEvaluatedShadow, visibility);
	gl_FragData[1] = position;
	//gl_FragColor = vec4(visibility, 0.0, 0.0, 1.0);
	*/

	vec4 vertex = texture2D(vertexMap, f_texcoord);	
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 normal = texture2D(normalMap, f_texcoord);
	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedLightCoord = shadowCoord / shadowCoord.w;
	float shadow = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	float preEvaluatedShadow = shadow;
	
	vec4 position = MVP * vertex;
	float depth = position.z/position.w;
	depth = depth * 0.5 + 0.5;
	

	if(shadow == 1.0) shadow = computeShadowFromSMSR(normalizedLightCoord);
	gl_FragColor = vec4(shadow, depth, preEvaluatedShadow, 0.0);
	
}
