uniform sampler2D shadowMap;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
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
uniform int RPCFPlusSMSR;
uniform int SMSR;
uniform int kernelOrder;
uniform int penumbraSize;
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

	//If dual discontinuity
	if(discontinuity.r == 0.75 || discontinuity.g == 0.75)
		return 0.0;

	//If discontinuity in both axis (corner)
	if(discontinuity.r > 0.0 && discontinuity.g > 0.0) {

		//Compute dominant axis - Evaluate if there is discontinuity in the closest neighbours
		lightCoord.x -= ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
		bool horizontal = getDisc(lightCoord, vec2(1.0, 0.0), discontinuity.b);
		
		lightCoord.x += ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
		lightCoord.y += ((0.5 - discontinuity.g) * 8.0 - 1) * shadowMapStep.y;
		bool vertical = getDisc(lightCoord, vec2(0.0, 1.0), discontinuity.b);

		//If dominant axis is x-axis - Disable discontinuity in y-axis
		if(horizontal && !vertical) {
		
			discontinuity.r = 0.0;
		
		//If dominant axis is y-axis - Disable discontinuity is x-axis
		} else if(!horizontal && vertical) {

			discontinuity.g = 0.0;
			
		//If there is no dominant axis
		} else if(!horizontal && !vertical) {

			if(discontinuity.g == 0.5) return step(subCoord.y, 1.0 - normalizedDiscontinuity.x);
			else if(discontinuity.g == 0.25) return step(1.0 - subCoord.y, 1.0 - normalizedDiscontinuity.x);
			
		//If there are two dominant axis
		} else {
		
			float a = mix(step(normalizedDiscontinuity.y, subCoord.x), step(normalizedDiscontinuity.y, 1.0 - subCoord.x), step(discontinuity.r, 0.25));
			float b = mix(step(normalizedDiscontinuity.x, 1.0 - subCoord.y), step(normalizedDiscontinuity.x, subCoord.y), step(discontinuity.g, 0.25));
			return min(a, b);	

		}
		
	}
	
	//If discontinuity only in y-axis
	if(discontinuity.g > 0.0) {
		
		if(discontinuity.g == 0.5) return step(normalizedDiscontinuity.x, 1.0 - subCoord.y);
		else return step(normalizedDiscontinuity.x, subCoord.y);
		
	} 
	
	//If discontinuity only in x-axis
	if(discontinuity.r > 0.0) {
		
		if(discontinuity.r == 0.5) return step(normalizedDiscontinuity.y, subCoord.x);
		else return step(normalizedDiscontinuity.y, 1.0 - subCoord.x);
		
	}
	
	return 1.0;
	
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

float computeShadowFromSMSR(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
{
	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	
	if(shadow == 1.0) {

		vec4 discontinuity = computeDiscontinuity(normalizedLightCoord, distanceFromLight);
		vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
		
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

float computeShadowFromRPCF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
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
	
	//sum the results
	for(float w = -offset; w <= offset; w += stepSize) {
		for(float h = -offset; h <= offset; h += stepSize) {
			
			distanceFromLight = texture2D(shadowMap, vec2(normalizedLightCoord.s + w * incrWidth, normalizedLightCoord.t + h * incrHeight)).z;
			float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity;
			
			if(shadow == 1.0) {
				
				vec4 sampleLightCoord = vec4(normalizedLightCoord.x + w * incrWidth, normalizedLightCoord.y + h * incrHeight, normalizedLightCoord.zw);
				vec4 discontinuity = computeDiscontinuity(sampleLightCoord, distanceFromLight);
				
				if(discontinuity.r == 0.0 && discontinuity.g == 0.0) {
						
					illuminationCount++;

				} else {

					vec2 subCoord = fract(vec2(sampleLightCoord.x * float(shadowMapWidth), sampleLightCoord.y * float(shadowMapHeight)));
					vec4 discontinuitySpace = orientateDS(sampleLightCoord, discontinuity, subCoord);
					vec4 normalizedDiscontinuity = normalizeDS(sampleLightCoord, discontinuity, subCoord, discontinuitySpace);
					float fill = clipONDS(sampleLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
					fill = mix(fill, 1.0, shadowIntensity);
					illuminationCount += fill;

				}

			} else {

				illuminationCount += shadowIntensity;

			}

			count++;

		}
				
	}
	
	//use light sub coordinates to improve smoothness
	shadow = illuminationCount/float(count);
	return shadow;
	
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

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);	
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 normal = texture2D(normalMap, f_texcoord);
	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedLightCoord = shadowCoord / shadowCoord.w;
	vec4 normalizedCameraCoord = vec4(gl_FragCoord.x/float(width), gl_FragCoord.y/float(height), gl_FragCoord.z, 1.0);
	float shadow = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	
	if(shadow == 1.0) {

		if(SMSR == 1) shadow = computeShadowFromSMSR(normalizedLightCoord, normalizedCameraCoord);	
		else shadow = computeShadowFromRPCF(normalizedLightCoord, normalizedCameraCoord);
		
	}

	gl_FragColor = vec4(shadow, 0.0, 0.0, 1.0);

}
