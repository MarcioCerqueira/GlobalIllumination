uniform sampler2D shadowMap;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
varying vec2 f_texcoord;
uniform mat4 MV;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform vec2 shadowMapStep;
uniform float shadowIntensity;
uniform float depthThreshold;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int maxSearch;
uniform int RPCFPlusSMSR;
uniform int SMSR;
uniform int EDTSM;
uniform int kernelOrder;
uniform int penumbraSize;
float newDepth;

vec4 computeDiscontinuity(vec4 shadowCoord) 
{

	vec4 dir = vec4(0.0, 0.0, 0.0, 0.0);
	//x = left; y = right; z = bottom; w = top
	
	shadowCoord.x -= shadowMapStep.x;
	float distanceFromLight = texture2D(shadowMap, shadowCoord.st).z;
	dir.x = (shadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	shadowCoord.x += 2.0 * shadowMapStep.x;
	distanceFromLight = texture2D(shadowMap, shadowCoord.st).z;
	dir.y = (shadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	shadowCoord.x -= shadowMapStep.x;
	shadowCoord.y += shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, shadowCoord.st).z;
	dir.z = (shadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	shadowCoord.y -= 2.0 * shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, shadowCoord.st).z;
	dir.w = (shadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	return abs(dir - 1.0);

}

float computeRelativeDistance(vec4 shadowCoord, vec2 dir, float c)
{

	vec4 tempShadowCoord = shadowCoord;
	float foundSilhouetteEnd = 0.0;
	float distance = 0.0;
	vec2 step = dir * shadowMapStep;
	tempShadowCoord.xy += step;
	
	for(int it = 0; it < maxSearch; it++) {
		
		float distanceFromLight = texture2D(shadowMap, tempShadowCoord.st).z;

		//To solve incorrect shadowing due to depth accuracy, we use a depth threshold/bias
		if(abs(tempShadowCoord.z - distanceFromLight) < depthThreshold)
			tempShadowCoord.z -= depthThreshold;

		float center = (tempShadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		bool isCenterUmbra = !bool(center);
		
		if(isCenterUmbra) {
			foundSilhouetteEnd = 1.0;
			break;
		} else {
			vec4 d = computeDiscontinuity(tempShadowCoord);
			if((d.r + d.g + d.b + d.a) == 0.0) break;
		}

		distance++;
		tempShadowCoord.xy += step;
		
	}
	
	distance = distance + (1.0 - c);
	return mix(-distance, distance, foundSilhouetteEnd);

}

vec4 computeRelativeDistance(vec4 shadowCoord, vec2 c)
{
	
	float dl = computeRelativeDistance(shadowCoord, vec2(-1, 0), (1.0 - c.x));
	float dr = computeRelativeDistance(shadowCoord, vec2(1, 0), c.x);
	float db = computeRelativeDistance(shadowCoord, vec2(0, -1), (1.0 - c.y));
	float dt = computeRelativeDistance(shadowCoord, vec2(0, 1), c.y);
	return vec4(dl, dr, db, dt);

}

float normalizeRelativeDistance(vec2 dist) {

	float T = 1;
	if(dist.x < 0.0 && dist.y < 0.0) T = 0;
	if(dist.x > 0.0 && dist.y > 0.0) T = -2;
	
	float length = min(abs(dist.x) + abs(dist.y), float(maxSearch));
	return abs(max(T * dist.x, T * dist.y))/length;

}

vec2 normalizeRelativeDistance(vec4 dist)
{

	vec2 r;
	r.x = normalizeRelativeDistance(vec2(dist.x, dist.y));
	r.y = normalizeRelativeDistance(vec2(dist.z, dist.w));
	return r;

}

float revectorizeShadow(vec2 r)
{

	if((r.x * r.y > 0) && (1.0 - r.x > r.y)) return shadowIntensity;
	else return 1.0;

}

float computeShadowFromSMSR(vec4 shadowCoord) 
{

	float distanceFromLight = texture2D(shadowMap, shadowCoord.st).z;		
	float shadow = (shadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if(shadow == 0.0) return shadowIntensity;
	
	vec4 d = computeDiscontinuity(shadowCoord);
	if((d.r + d.g + d.b + d.a) == 0.0) return 1.0;
	else if((d.r + d.g) == 2.0 || (d.b + d.a) == 2.0) return shadowIntensity;

	vec2 c = fract(vec2(shadowCoord.x * float(shadowMapWidth), shadowCoord.y * float(shadowMapHeight)));
	vec4 dist = computeRelativeDistance(shadowCoord, c);
	vec2 r = normalizeRelativeDistance(dist);
	return revectorizeShadow(r);

}

float computeShadowFromRPCF(vec4 normalizedLightCoord) 
{
	
	float shadow;
	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	float illuminationCount = 0.0;
	float offset = float(penumbraSize);
	float stepSize = 2 * offset/float(kernelOrder);
	float distanceFromLight;
	vec4 discontinuity = vec4(0.0);
	int count = 0;
	
	for(float w = -offset; w <= offset; w += stepSize) {
		for(float h = -offset; h <= offset; h += stepSize) {
			
			distanceFromLight = texture2D(shadowMap, vec2(normalizedLightCoord.s + w * incrWidth, normalizedLightCoord.t + h * incrHeight)).z;
			float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity;
			
			if(shadow == 1.0) {
				
				vec4 sampleLightCoord = vec4(normalizedLightCoord.x + w * incrWidth, normalizedLightCoord.y + h * incrHeight, normalizedLightCoord.zw);
				vec4 d = computeDiscontinuity(sampleLightCoord);
				
				if(d.r == 0.0 && d.g == 0.0) {
						
					illuminationCount++;

				} else {

					vec2 subCoord = fract(vec2(sampleLightCoord.x * float(shadowMapWidth), sampleLightCoord.y * float(shadowMapHeight)));
					vec4 discontinuitySpace = computeRelativeDistance(sampleLightCoord, subCoord);
					vec2 r = normalizeRelativeDistance(discontinuitySpace);
					illuminationCount += revectorizeShadow(r);

				}

			} else {

				illuminationCount += shadowIntensity;

			}

			count++;

		}
				
	}
	
	shadow = illuminationCount/float(count);
	return shadow;
	
}

float computePreEvaluationBasedOnNormalOrientation(vec4 vertex, vec4 normal)
{

	vertex = MV * vertex;
	normal.xyz = normalize(normalMatrix * normal.xyz);

	vec3 L = normalize(lightPosition.xyz - vertex.xyz);   
	
	if(!bool(normal.w)) normal.xyz *= -1;

	if(max(dot(normal.xyz,L), 0.0) == 0) return shadowIntensity;
	else return 1.0;

}

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);	
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 normal = texture2D(normalMap, f_texcoord);
	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedLightCoord = shadowCoord / shadowCoord.w;
	float shadow = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	float preEvaluatedShadow = shadow;

	if(shadow == 1.0) {

		if(SMSR == 1 || EDTSM == 1) shadow = computeShadowFromSMSR(normalizedLightCoord);	
		else shadow = computeShadowFromRPCF(normalizedLightCoord);
		
	}

	if(SMSR == 1 || RPCFPlusSMSR == 1) {
		
		gl_FragData[0] = vec4(shadow, 0.0, 0.0, 1.0);

	} else { 

		vec4 position = MVP * vertex;
		float depth = position.z/position.w;
		depth = depth * 0.5 + 0.5;
		
		gl_FragData[0] = vec4(shadow, depth, preEvaluatedShadow, 1.0);
		gl_FragData[1] = position;

	}

}
