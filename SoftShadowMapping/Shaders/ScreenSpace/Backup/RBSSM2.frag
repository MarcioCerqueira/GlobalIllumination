uniform sampler2D hardShadowMap;
uniform sampler2D hierarchicalShadowMap;
uniform sampler2D shadowMap;
uniform sampler2D vertexMap;
uniform mat4 lightMVP;
uniform mat4 inverseLightMVP;
uniform mat4 MVP;
varying vec4 shadowCoord;
varying vec3 N;
varying vec3 v;
varying vec3 meshColor;
varying vec3 uvTexture;
uniform vec3 lightPosition;
uniform vec2 shadowMapStep;
uniform float shadowIntensity;
uniform float depthThreshold;
uniform int zNear;
uniform int zFar;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int maxSearch;
uniform int blockerSearchSize;
uniform int kernelSize;
uniform int lightSourceRadius;
varying vec2 f_texcoord;
float newDepth;

float compressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return -2.0 - ((0.5 - normalizedDiscontinuity) * 2.0);

}

float decompressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return (0.5 - ((normalizedDiscontinuity + 2.0) * -1.0)/2.0);

}

vec4 getDisc(vec4 normalizedLightCoord, float distanceFromLight) 
{

	vec4 dir = vec4(0.0, 0.0, 0.0, 0.0);
	
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

float smoothONDS(vec4 lightCoord, vec4 normalizedDiscontinuity, vec4 discontinuity, vec2 subCoord)
{

	if(discontinuity.b == 0.0) {

		//If discontinuity in both axes (corner)
		if(discontinuity.r > 0.0 && discontinuity.g > 0.0) {
			
			//Compute dominant axis - Evaluate if there is discontinuity in the closest neighbours
			lightCoord.x -= ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
			bool horizontal = getDisc(lightCoord, vec2(1.0, 0.0), 0.0);
		
			lightCoord.x += ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
			lightCoord.y += ((0.5 - discontinuity.g) * 8.0 - 1) * shadowMapStep.y;
			bool vertical = getDisc(lightCoord, vec2(0.0, 1.0), 0.0);

			//If dominant axis is x-axis - Disable discontinuity in y-axis
			if(horizontal && !vertical) {
		
				discontinuity.r = 0.0;
		
			//If dominant axis is y-axis - Disable discontinuity is x-axis
			} else if(!horizontal && vertical) {

				discontinuity.g = 0.0;
		
			//If there is no dominant axis
			} else if(!horizontal && !vertical) {

				//If bottom discontinuity
				if(discontinuity.g == 0.5) return clamp((1.0 - normalizedDiscontinuity.x) - (subCoord.y - 1.0), 0.0, 1.0);
				//If top discontinuity
				else if(discontinuity.g == 0.25) return clamp((1.0 - normalizedDiscontinuity.x) + subCoord.y, 0.0, 1.0);

			} else {

				float a, b;

				//If left and bottom discontinuities
				if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
					a = mix(1.0 - subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - (1.0 - subCoord.y)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				//If left and top discontinuities
				} else if(discontinuity.r == 0.5 && discontinuity.g == 0.25) {

					a = mix(subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				//If right and bottom discontinuities
				} else if(discontinuity.r == 0.25 && discontinuity.g == 0.5) {

					a = mix(1.0 - subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - (1.0 - subCoord.y)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - (1.0 - subCoord.x)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				//If right and top discontinuities
				} else if(discontinuity.r == 0.25 && discontinuity.g == 0.25) {
			
					a = mix(subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - (1.0 - subCoord.x)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				}

			}

		}

		//If positive discontinuity only in x-axis
		if(normalizedDiscontinuity.x <= -2.0) return mix(1.0 - subCoord.y, subCoord.y, step(discontinuity.g, 0.25));

		//If positive discontinuity only in y-axis
		if(normalizedDiscontinuity.y <= -2.0) return mix(subCoord.x, 1.0 - subCoord.x, step(discontinuity.r, 0.25));
		
		//If discontinuity only in y-axis
		if(discontinuity.g > 0.0) {
	
			//If bottom discontinuity
			if(discontinuity.g == 0.5) return clamp((1.0 - subCoord.y) - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);
			//If top discontinuity
			else return clamp(subCoord.y - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);
		
		}

		//If discontinuity only in x-axis
		if(discontinuity.r > 0.0) {
		
			//If left discontinuity
			if(discontinuity.r == 0.5) return clamp(subCoord.x - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);
			//If right discontinuity
			else return clamp((1.0 - subCoord.x) - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);

		}

	//For exiting discontinuity
	} else {

		//If discontinuity in both axes (corner)
		if(discontinuity.r > 0.0 && discontinuity.g > 0.0) {
			
			//Compute dominant axis - Evaluate if there is discontinuity in the closest neighbours
			lightCoord.x += ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
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

				//If bottom discontinuity
				if(discontinuity.g == 0.5) return clamp(subCoord.y - (1.0 - normalizedDiscontinuity.x), 0.0, 1.0);
				//If top discontinuity
				else if(discontinuity.g == 0.25) return clamp((1.0 - subCoord.y) - (1.0 - normalizedDiscontinuity.x), 0.0, 1.0);

			//If there are two dominant axis
			} else {
			
				float a, b;
				//If left and bottom discontinuities
				if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
					a = mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);

				//If left and top discontinuities
				} else if(discontinuity.r == 0.5 && discontinuity.g == 0.25) {

					a = mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);

				//If right and bottom discontinuities
				} else if(discontinuity.r == 0.25 && discontinuity.g == 0.5) {

					a = mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);

				//If right and top discontinuities
				} else if(discontinuity.r == 0.25 && discontinuity.g == 0.25) {
			
					a = mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);

				}

			}	

		}

		//If positive discontinuity only in x-axis
		if(normalizedDiscontinuity.x <= -2.0) return mix(subCoord.y, 1.0 - subCoord.y, step(discontinuity.g, 0.25));

		//If positive discontinuity only in y-axis
		if(normalizedDiscontinuity.y <= -2.0) return mix(1.0 - subCoord.x, subCoord.x, step(discontinuity.r, 0.25));
		
		//If discontinuity only in y-axis
		if(discontinuity.g > 0.0) {
	
			//If bottom discontinuity
			if(discontinuity.g == 0.5) return clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0);
			//If top discontinuity
			else return clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0);

		}

		//If discontinuity only in x-axis
		if(discontinuity.r > 0.0) {
		
			//If left discontinuity
			if(discontinuity.r == 0.5) return clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0);
			//If right discontinuity
			else return clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0);

		}

	}
	
	return 1.0 - discontinuity.b;

}

vec4 computeDiscontinuity(vec4 normalizedLightCoord, float distanceFromLight) 
{

	float center = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0;	
	float discType = 1.0 - center;
	vec4 dir = getDisc(normalizedLightCoord, distanceFromLight);
	vec4 disc = abs(dir - center);
	vec2 color = (2.0 * disc.xz + disc.yw)/4.0;
	return vec4(color, discType, 1.0);		
		
}

float computeAverageBlockerDepthBasedOnPCF(vec4 normalizedShadowCoord) 
{

	float averageDepth = 0.0;
	int numberOfBlockers = 0;
	float blockerSearchWidth = float(lightSourceRadius)/float(shadowMapWidth);
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
	return (float(zNear) * penumbraWidth)/distanceToLight;
	
}

float computeVisibilityFromHSM(vec4 normalizedShadowCoord) 
{

	vec2 minMax = texture2DLod(hierarchicalShadowMap, normalizedShadowCoord.xy, 1.2).xy;
	
	if(normalizedShadowCoord.z <= minMax.x) return 1.0;
	else if(normalizedShadowCoord.z > minMax.y) return shadowIntensity;
	else return 0.555;
	
}

float RBSSM(float penumbraWidth, vec4 normalizedShadowCoord)
{

	int count = 0;
	float illuminationCount = 0.0;
	float distanceFromLight = 0.0;
	float fill = 0.0;
	float shadow = 0.0;
	float filterWidth = (kernelSize - 1.0) * 0.5;
	float prevIllum = 0.0;
	vec4 normalizedLightCoord = vec4(0.0);
	vec4 discontinuity = vec4(0.0);
	vec4 prevDiscontinuity = vec4(0.0);
	vec4 discontinuitySpace = vec4(0.0);
	vec4 normalizedDiscontinuity = vec4(0.0);
	vec2 subCoord = vec2(0.0);
	
	for(int h = -filterWidth; h <= filterWidth; h++) {
		for(int w = -filterWidth; w <= filterWidth; w++) {
			
			normalizedLightCoord = vec4(normalizedShadowCoord.xy + vec2(w, h) * penumbraWidth/filterWidth, normalizedShadowCoord.zw);
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.xy).z;		
			discontinuity = computeDiscontinuity(normalizedLightCoord, distanceFromLight);
			subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));

			if(discontinuity.r == 0.75 || discontinuity.g == 0.75) {
				
				illuminationCount += 1.0 - discontinuity.b;
				
			} else if (discontinuity.r > 0.0 || discontinuity.g > 0.0) {
				
				if(discontinuity.b == 1.0) {

					discontinuitySpace = orientateDS(normalizedLightCoord, discontinuity, subCoord);
					normalizedDiscontinuity = normalizeDS(normalizedLightCoord, discontinuity, subCoord, discontinuitySpace);
					fill = smoothONDS(normalizedLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
					fill = mix(fill, 1.0, shadowIntensity);
					illuminationCount += fill;
					
				} else {
				
					normalizedLightCoord.z = distanceFromLight;
					vec4 world = inverseLightMVP * normalizedLightCoord;
					vec4 camera = MVP * world;
					camera /= camera.w;
					camera.xy += 0.5;
					//camera.xy = (camera.xy + 1.0) * 0.5;
					illuminationCount += texture2D(hardShadowMap, camera.xy).r;
					
				}

			} else {
			
				shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
				illuminationCount += shadow;
		
			}

			count++;

		}
	}
	
	return illuminationCount/float(kernelSize * kernelSize);

}

vec4 revectorizationBasedShadowMappingSmoothing(vec4 normalizedShadowCoord) 
{
	
	float visibility = computeVisibilityFromHSM(normalizedShadowCoord);
	if(visibility == shadowIntensity || visibility == 1.0) 
		return visibility;
	
	float averageDepth = computeAverageBlockerDepthBasedOnPCF(normalizedShadowCoord);
	float penumbraWidth = computePenumbraWidth(averageDepth, normalizedShadowCoord.z);
	
	float stepSize = 2.0 * penumbraWidth/float(kernelSize);
	if(stepSize <= 0.0 || stepSize >= 1.0)
		return 1.0;
	
	return RBSSM(penumbraWidth, normalizedShadowCoord);

}

void main()
{	

	vec3 shadow = texture2D(hardShadowMap, f_texcoord.xy).rgb;	
	
	if(shadow.r > 0.0) {
		
		vec4 vertex = texture2D(vertexMap, f_texcoord);
		vec4 shadowCoord = lightMVP * vertex;
		vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
		shadow.r = revectorizationBasedShadowMappingSmoothing(normalizedShadowCoord);
		gl_FragColor = vec4(shadow.r, shadow.r, shadow.r, 1.0);
	
	} else {

		gl_FragColor = vec4(shadowIntensity, shadowIntensity, shadowIntensity, 1.0);
	
	}
	
}
