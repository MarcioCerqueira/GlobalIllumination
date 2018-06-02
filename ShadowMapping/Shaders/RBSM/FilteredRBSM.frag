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

vec4 getDisc(vec4 normalizedLightCoord, vec2 shadowMapStep, float distanceFromLight, bool breakForUmbra, bool breakForNoUmbra) 
{

	vec4 dir = vec4(0.0, 0.0, 0.0, 0.0);
	//x = left; y = right; z = bottom; w = top
	if(breakForNoUmbra)
		dir = vec4(1.0, 1.0, 1.0, 1.0);

	normalizedLightCoord.x -= shadowMapStep.x;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.x = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if((breakForUmbra && dir.x == 1.0) || (breakForNoUmbra && dir.x == 0.0)) return dir;

	normalizedLightCoord.x += 2.0 * shadowMapStep.x;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.y = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if((breakForUmbra && dir.y == 1.0) || (breakForNoUmbra && dir.y == 0.0)) return dir;
	
	normalizedLightCoord.x -= shadowMapStep.x;
	normalizedLightCoord.y += shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.z = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if((breakForUmbra && dir.z == 1.0) || (breakForNoUmbra && dir.z == 0.0)) return dir;

	normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.w = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if((breakForUmbra && dir.w == 1.0) || (breakForNoUmbra && dir.w == 0.0)) return dir;

	return dir;

}

bool getDisc(vec4 normalizedLightCoord, vec2 dir, float discType)
{

	float distanceFromLight;
			
	if(dir.x == 0.0) {
		
		normalizedLightCoord.x -= shadowMapStep.x;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		float left = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		if(abs(left - discType) == 0.0) return true;

		normalizedLightCoord.x += 2.0 * shadowMapStep.x;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		float right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		if(abs(right - discType) == 0.0) return true;

		normalizedLightCoord.x -= shadowMapStep.x;

	}

	if(dir.y == 0.0) {
	
		normalizedLightCoord.y += shadowMapStep.y;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		float bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		if(abs(bottom - discType) == 0.0) return true;

		normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
		distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
		float top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		if(abs(top - discType) == 0.0) return true;

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
			//Solving incorrect shadowing due to numerical accuracy
			if(discType.b == 1.0) {
				if(abs(normalizedLightCoord.z - distanceFromLight) < depthThreshold) {
					normalizedLightCoord.z -= depthThreshold;
					newDepth = normalizedLightCoord.z;
				}
			}
			float left = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			if(abs(left - discType.b) == 0.0) return true;
			
		}

		if(discType.r == 0.75 || discType.r == 0.25) {

			relativeCoord.x = normalizedLightCoord.x + shadowMapStep.x;
			distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
			//Solving incorrect shadowing due to numerical accuracy
			if(discType.b == 1.0) {
				if(abs(normalizedLightCoord.z - distanceFromLight) < depthThreshold) {
					normalizedLightCoord.z -= depthThreshold;
					newDepth = normalizedLightCoord.z;
				}
			}
			float right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			if(abs(right - discType.b) == 0.0) return true;
			
		}

	}

	if(dir.y == 0.0) {
	
		if(discType.g == 0.5 || discType.g == 0.75) {
				
			relativeCoord.y = normalizedLightCoord.y + shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
			//Solving incorrect shadowing due to numerical accuracy
			if(discType.b == 1.0) {
				if(abs(normalizedLightCoord.z - distanceFromLight) < depthThreshold) {
					normalizedLightCoord.z -= depthThreshold;
					newDepth = normalizedLightCoord.z;
				}
			}
			float bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			if(abs(bottom - discType.b) == 0.0) return true;
		
		}

		if(discType.g == 0.75 || discType.g == 0.25) {
			
			relativeCoord.y = normalizedLightCoord.y - shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
			//Solving incorrect shadowing due to numerical accuracy
			if(discType.b == 1.0) {
				if(abs(normalizedLightCoord.z - distanceFromLight) < depthThreshold) {
					normalizedLightCoord.z -= depthThreshold;
					newDepth = normalizedLightCoord.z;
				}
			}
			float top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			if(abs(top - discType.b) == 0.0) return true;
			
		}

	}

	return false;

	
}

float computeDiscontinuityLength(vec4 inputDiscontinuity, vec4 lightCoord, vec2 dir, int maxSearch, float subCoord)
{

	vec4 centeredLightCoord = lightCoord;
	float foundEdgeEnd = 0.0;
	bool hasDisc = false;
	float dist = 0.0;
	vec2 shadowMapDiscontinuityStep = dir * shadowMapStep;
	centeredLightCoord.xy += shadowMapDiscontinuityStep;
	
	for(int it = 0; it < maxSearch; it++) {
		
		float distanceFromLight = texture2D(shadowMap, centeredLightCoord.st).z;

		//To solve incorrect shadowing due to depth accuracy, we use a depth threshold/bias
		if(inputDiscontinuity.b == 0.0)
			if(abs(centeredLightCoord.z - distanceFromLight) < depthThreshold)
				centeredLightCoord.z -= depthThreshold;

		float center = (centeredLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		
		if(abs(center - inputDiscontinuity.b) == 0.0) {

			//We disable exiting discontinuities if the neighbour entering discontinuity is in all the directions
			//We disable entering discontinuities if the neighbour exiting discontinuity is in all the directions
			hasDisc = getDisc(centeredLightCoord, vec2(0.0, 0.0), inputDiscontinuity.b);
			
			if(!hasDisc) foundEdgeEnd = 0.0;
			else foundEdgeEnd = 1.0;
			
			break;
		
		} else {

		    hasDisc = getDisc(centeredLightCoord, dir, inputDiscontinuity);
			if(!hasDisc) break;
		
		}

		dist++;
		centeredLightCoord.xy += shadowMapDiscontinuityStep;
		
		//For exiting discontinuity, we deal with incorrect shadowing in a different way.
		//The limited accuracy of the shadow map affects only the shadow test for regions which are illuminated by the light source.
		//Therefore, we use the depth threshold only during discontinuity evaluation (getDisc) and update the current depth later on.
		if(inputDiscontinuity.b == 1.0) 
			centeredLightCoord.z = newDepth;
	
	}
	
	return mix(-(dist + (1.0 - subCoord)), dist + (1.0 - subCoord), foundEdgeEnd);

}

float estimateRelativePosition(vec2 dir, int maxSearch, float shadow) {

	float T = 1;
	if(dir.x < 0.0 && dir.y < 0.0) T = 0;
	if(dir.x > 0.0 && dir.y > 0.0) T = -2;
	
	float edgeLength = min(abs(dir.x) + abs(dir.y), float(maxSearch));
	return (T * abs(max(T * dir.x, T * dir.y)))/edgeLength;

}

vec4 orientateDS(vec4 lightCoord, vec4 discontinuity, vec2 subCoord)
{
	
	float left = computeDiscontinuityLength(discontinuity, lightCoord, vec2(-1, 0), maxSearch, (1.0 - subCoord.x));
	float right = computeDiscontinuityLength(discontinuity, lightCoord, vec2(1, 0), maxSearch, subCoord.x);
	float down = computeDiscontinuityLength(discontinuity, lightCoord, vec2(0, -1), maxSearch, (1.0 - subCoord.y));
	float up = computeDiscontinuityLength(discontinuity, lightCoord, vec2(0, 1), maxSearch, subCoord.y);
	return vec4(left, right, down, up);

}

vec2 estimateRelativePosition(vec4 dir, float shadow)
{

	vec2 r;
	r.x = estimateRelativePosition(vec2(dir.x, dir.y), maxSearch, shadow);
	r.y = estimateRelativePosition(vec2(dir.z, dir.w), maxSearch, shadow);
	return r;

}

float revectorizeShadow(vec2 r, float shadow)
{

	if(r.x * r.y < 0) return (1.0 - shadow) + (2 * shadow - 1) * max(r.x, r.y);
	else if(r.x * r.y == 0.0) return shadow;
	else return clamp(((1.0 - shadow) + (2 * shadow - 1) * (r.x + r.y)), 0.0, 1.0);
	
}

vec4 computeDiscontinuity(vec4 normalizedLightCoord, float distanceFromLight) 
{

	float center = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 			
	float discType = 1.0 - center;
	vec4 dir = getDisc(normalizedLightCoord, shadowMapStep, distanceFromLight, false, false);	
	vec4 disc = abs(dir - center);
	vec2 color = (2.0 * disc.xz + disc.yw)/4.0;
	return vec4(color, discType, 1.0);		
		
}

float computeShadowFromSMSR(vec4 normalizedLightCoord)
{
	
	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	vec4 discontinuity = computeDiscontinuity(normalizedLightCoord, distanceFromLight);
	vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
	float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			
	if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {
		
		if(discontinuity.r == 0.75 && discontinuity.g == 0.75) return mix(1.0 - shadow, 1.0, shadowIntensity);
		vec4 discontinuitySpace = orientateDS(normalizedLightCoord, discontinuity, subCoord);
		vec2 r = estimateRelativePosition(discontinuitySpace, shadow);
		return mix(revectorizeShadow(r, shadow), 1.0, shadowIntensity);
		
	} else return mix(shadow, 1.0, shadowIntensity);
	
}

float computeShadowFromAccurateRPCF(vec4 normalizedLightCoord) 
{
	
	float shadow;
	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	float illuminationCount = 0.0;
	float offset = float(penumbraSize);
	float stepSize = 2 * offset/float(kernelOrder);
	float distanceFromLight;
	int count = 0;
	
	for(float w = -offset; w <= offset; w += stepSize) {
		for(float h = -offset; h <= offset; h += stepSize) {
			
			vec4 sampleLightCoord = vec4(normalizedLightCoord.x + w * incrWidth, normalizedLightCoord.y + h * incrHeight, normalizedLightCoord.zw);
			distanceFromLight = texture2D(shadowMap, sampleLightCoord.xy).z;
			float shadow = (sampleLightCoord.z <= distanceFromLight) ? 1.0 : 0.0;
			vec4 discontinuity = computeDiscontinuity(sampleLightCoord, distanceFromLight);
				
			if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {

				vec2 subCoord = fract(vec2(sampleLightCoord.x * float(shadowMapWidth), sampleLightCoord.y * float(shadowMapHeight)));
				vec4 discontinuitySpace = orientateDS(sampleLightCoord, discontinuity, subCoord);
				vec2 r = estimateRelativePosition(discontinuitySpace, shadow);
				illuminationCount += mix(revectorizeShadow(r, shadow), 1.0, shadowIntensity);;

			} else {
				
				shadow = mix(shadow, 1.0, shadowIntensity);
				illuminationCount += shadow;

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

		//if(SMSR == 1 || EDTSM == 1) shadow = computeShadowFromSMSR(normalizedLightCoord);
		//else shadow = computeShadowFromAccurateRPCF(normalizedLightCoord);
		shadow = computeShadowFromAccurateRPCF(normalizedLightCoord);

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
