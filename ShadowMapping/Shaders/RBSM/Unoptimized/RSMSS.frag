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
uniform int RPCFPlusRSMSS;
uniform int RSMSS;
uniform int kernelOrder;
uniform int penumbraSize;
float newDepth;

float compressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return -2.0 - ((0.5 - normalizedDiscontinuity) * 2.0);

}

float decompressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return (0.5 - ((normalizedDiscontinuity + 2.0) * -1.0)/2.0);

}

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

/*
if(abs(sample - disc.b) == 0.0)
is equivalent to 
if((disc.b == 1.0 && !isSampleUmbra) || (disc.b == 0.0 && isSampleUmbra))
*/

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

		//If negative entering discontinuity on both directions, do not clip the ONDS
		if(normalizedDiscontinuity.x == -1.0 && normalizedDiscontinuity.y == -1.0) 
			return 1.0;

		//If the entering discontinuity is in all the four directions, clip all the ONDS 
		if(discontinuity.r == 0.75 && discontinuity.g == 0.75)
			return 0.0;

		//If positive entering discontinuity on both directions and the discontinuity is in both sides of an axis
		if(normalizedDiscontinuity.x <= -2.0 && normalizedDiscontinuity.y <= -2.0 && (discontinuity.r == 0.75 || discontinuity.g == 0.75)) {

			//These booleans indicate where there is umbra	
			bool left = true;
			bool right = true;
			bool bottom = true;
			bool top = true;

			if(discontinuity.r == 0.75) {
		
				//Determine the discontinuity
				if(discontinuity.g == 0.0) {

					lightCoord.y += shadowMapStep.y;
					top = getDisc(lightCoord, vec2(0.0, 1.0), discontinuity.b);
					
					lightCoord.y -= 2.0 * shadowMapStep.y;
					bottom = getDisc(lightCoord, vec2(0.0, 1.0), discontinuity.b);
				
					//If the dual discontinuity (i.e. left-right) persists in the next neighbours (i.e. top-bottom), fill all the ONDS
					lightCoord.y += shadowMapStep.y;
					if(top && bottom) return 0.0;
				
					//According to the y-axis discontinuity, determine x-axis discontinuity
					lightCoord.y += mix(-shadowMapStep.y, shadowMapStep.y, step(1.0, float(top)));
					left = getDisc(lightCoord, vec2(0.0, 1.0), vec4(0.5, 0.0, 0.0, 0.0));
				
					right = !left;
				
				} else {
				
					if(discontinuity.g == 0.5) 
						top = false;
					else if(discontinuity.g == 0.25)
						bottom = false;
				
					lightCoord.y += ((0.5 - discontinuity.g) * 8.0 - 1) * shadowMapStep.y;
		
					left = getDisc(lightCoord, vec2(0.0, 1.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
					right = getDisc(lightCoord, vec2(0.0, 1.0), vec4(0.25, 0.0, 0.0, discontinuity.b));
				
					//If the dual discontinuity (i.e. left-right) persists in the next neighbour, check the exiting neighbours
					if(left && right) {
					
						if(normalizedDiscontinuity.y <= -2.0) 
							normalizedDiscontinuity.y = decompressPositiveDiscontinuity(normalizedDiscontinuity.y) + 0.5;
					
						float a = clamp(subCoord.x - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);
						float b = clamp((1.0 - subCoord.x) - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);
						float c = mix(1.0 - subCoord.y, subCoord.y, step(discontinuity.g, 1.0));
						return min(min(a, b), c);

					}
			
				}
			
			}

			if(discontinuity.g == 0.75) {

				if(discontinuity.r == 0.0) {

					lightCoord.x -= shadowMapStep.x;
					left = getDisc(lightCoord, vec2(1.0, 0.0), discontinuity.b);
					
					lightCoord.x += 2.0 * shadowMapStep.x;
					right = getDisc(lightCoord, vec2(1.0, 0.0), discontinuity.b);
				
					//If the dual discontinuity (i.e. top-bottom) persists in the next neighbours (i.e. left-right), fill all the ONDS
					lightCoord.x -= shadowMapStep.x;
					if(left && right) return 0.0;

					//According to the x-axis discontinuity, determine y-axis discontinuity
					lightCoord.x += mix(shadowMapStep.x, -shadowMapStep.x, step(1.0, float(left)));
				
					bottom = getDisc(lightCoord, vec2(0.0, 0.25), vec4(0.5, 0.0, 0.0, discontinuity.b));
					top = !bottom;

				} else {
		
					if(discontinuity.r == 0.5)
						right = false;
					else if(discontinuity.r == 0.25)
						left = false;
				
					lightCoord.x -= ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
		
					bottom = getDisc(lightCoord, vec2(1.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
					top = getDisc(lightCoord, vec2(1.0, 0.0), vec4(0.0, 0.25, 0.0, discontinuity.b));

					//If the dual discontinuity (i.e. top-bottom) persists in the next neighbour, clip all the ONDS
					if(bottom && top) {

						if(normalizedDiscontinuity.x <= -2.0) 
							normalizedDiscontinuity.x = decompressPositiveDiscontinuity(normalizedDiscontinuity.x) + 0.5;
					
						float a = clamp(subCoord.y - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);
						float b = clamp((1.0 - subCoord.y) - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);
						float c = mix(1.0 - subCoord.x, subCoord.x, step(discontinuity.r, 1.0));
						return min(min(a, b), c);
					
					}

				}

			}

			if(!left && !bottom)
				return clamp((1.0 - subCoord.x) - (1.0 - subCoord.y), 0.0, 1.0);
			else if(!right && !bottom) 
				return clamp(subCoord.x - (1.0 - subCoord.y), 0.0, 1.0);
			else if(!left && !top)
				return clamp((1.0 - subCoord.y) - subCoord.x, 0.0, 1.0);
			else if(!right && !top)
				return clamp((1.0 - subCoord.y) - (1.0 - subCoord.x), 0.0, 1.0);

		}

		if(discontinuity.r == 0.75 || discontinuity.g == 0.75) {

			//If entering left and right discontinuity
			if(discontinuity.r == 0.75 && discontinuity.g != 0.0) {
		
				//These booleans indicate where there is umbra
				bool left = true;
				bool right = true;
				float distanceFromLight; 

				//While umbra in all directions
				while(left && right) {
		
					lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
					left = getDisc(lightCoord, vec2(0.0, 1.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
					right = getDisc(lightCoord, vec2(0.0, 1.0), vec4(0.25, 0.0, 0.0, discontinuity.b));
					if(lightCoord.z > texture2D(shadowMap, lightCoord.xy).z) break; 
					
				}

				//If there is no umbra in the left or right..
				if(!left && !right)
					return clamp(1.0 - normalizedDiscontinuity.y, 0.0, 1.0);
		
				float sub = mix(1.0 - subCoord.y, subCoord.y, step(1.0, discontinuity.g));
				float a = mix(sub, clamp((1.0 - subCoord.x) - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0), step(1.0, float(right)));
				float b = mix(sub, clamp(subCoord.x - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0), step(1.0, float(left)));
			
				return min(a, b);

			}

			//If entering left and right discontinuity only
			if(discontinuity.r == 0.75 && discontinuity.g == 0.0) {
		
				//These booleans indicate where there is umbra
				bool topLeft = true;
				bool topRight = true;
				bool bottomLeft = true;
				bool bottomRight = true;

				//These booleans help us to find the discontinuity end
				bool topCenter = false;
				bool bottomCenter = false;
		
				vec4 topLightCoord = lightCoord;
				vec4 bottomLightCoord = lightCoord;

				float distanceFromLight;

				//While umbra in all directions
				while(topLeft && topRight && bottomLeft && bottomRight && (!topCenter || !bottomCenter)) {
	
					if(!topCenter) {
				
						topLightCoord.y += shadowMapStep.y;
						float center = (topLightCoord.z <= texture2D(shadowMap, topLightCoord.xy).z) ? 1.0 : 0.0; 
						topCenter = !bool(center);
					
						topLeft = getDisc(topLightCoord, vec2(0.0, 1.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
						topRight = getDisc(topLightCoord, vec2(0.0, 1.0), vec4(0.25, 0.0, 0.0, discontinuity.b));
				
					}

					if(!bottomCenter) {
			
						bottomLightCoord.y -= shadowMapStep.y;
						float center = (bottomLightCoord.z <= texture2D(shadowMap, bottomLightCoord.xy).z) ? 1.0 : 0.0; 
						bottomCenter = !bool(center);
				
						bottomLeft = getDisc(bottomLightCoord, vec2(0.0, 1.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
						bottomRight = getDisc(bottomLightCoord, vec2(0.0, 1.0), vec4(0.25, 0.0, 0.0, discontinuity.b));
				
					}

				}

				if(topCenter) {

					topLeft = true;
					topRight = true;

				}

				if(bottomCenter) {

					bottomLeft = true;
					bottomRight = true;

				}

				if(normalizedDiscontinuity.y <= -2.0) {

					normalizedDiscontinuity.y = decompressPositiveDiscontinuity(normalizedDiscontinuity.y) + 0.5;
					float a = clamp(subCoord.x - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);
					float b = clamp((1.0 - subCoord.x) - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);
			
					if(!bottomRight || !topRight)  return a;
					else if(!bottomLeft || !topLeft) return b;
					else return min(a, b);
			
				}

				//If, for top or bottom directions, there is no umbra in the left or right..
				if((!bottomRight && !bottomLeft) || (!topRight && !topLeft))
					return clamp(1.0 - normalizedDiscontinuity.y, 0.0, 1.0);
				//If there is no umbra only on the right
				else if(!bottomRight || !topRight)	
					return clamp(subCoord.x - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);
				//If there is no umbra only on the left
				else
					return clamp((1.0 - subCoord.x) - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0);

			}

			//If entering top and bottom discontinuity
			if(discontinuity.r != 0.0 && discontinuity.g == 0.75) {

				//These booleans indicate where there is umbra
				bool bottom = true;
				bool top = true;
				float distanceFromLight;

				//While umbra in all directions
				while(bottom && top) {	
		
					lightCoord.x -= ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
					bottom = getDisc(lightCoord, vec2(1.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
					top = getDisc(lightCoord, vec2(1.0, 0.0), vec4(0.0, 0.25, 0.0, discontinuity.b));
					if(lightCoord.z > texture2D(shadowMap, lightCoord.xy).z) break; 
					
				}
		
		
				//If there is no umbra in the bottom or top..
				if(!bottom && !top)
					return clamp(1.0 - normalizedDiscontinuity.x, 0.0, 1.0);

				float sub = mix(subCoord.x, 1.0 - subCoord.x, step(discontinuity.r, 0.25));
				float a = mix(sub, clamp(subCoord.y - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0), step(1.0, float(top)));
				float b = mix(sub, clamp((1.0 - subCoord.y) - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0), step(1.0, float(bottom)));

				return min(a, b);

			}

			//If entering top and bottom discontinuity only
			if(discontinuity.r == 0.0 && discontinuity.g == 0.75) {

				//These booleans indicate where there is umbra
				bool topLeft = true;
				bool topRight = true;
				bool bottomLeft = true;
				bool bottomRight = true;

				//These booleans help us to find the discontinuity end
				bool leftCenter = false;
				bool rightCenter = false;
				float center, distanceFromLight;

				vec4 leftLightCoord = lightCoord;
				vec4 rightLightCoord = lightCoord;

				//While umbra in all directions
				while(topLeft && topRight && bottomLeft && bottomRight && (!rightCenter || !leftCenter)) {

					if(!rightCenter) {
				
						rightLightCoord.x += shadowMapStep.x;
						center = (rightLightCoord.z <= texture2D(shadowMap, rightLightCoord.xy).z) ? 1.0 : 0.0; 
						rightCenter = !bool(center);
			
						bottomRight = getDisc(rightLightCoord, vec2(1.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
						topRight = getDisc(rightLightCoord, vec2(1.0, 0.0), vec4(0.0, 0.25, 0.0, discontinuity.b));

					}
		
					if(!leftCenter) {
				
						leftLightCoord.x -= shadowMapStep.x;
						center = (leftLightCoord.z <= texture2D(shadowMap, leftLightCoord.xy).z) ? 1.0 : 0.0; 
						leftCenter = !bool(center);
			
						bottomLeft = getDisc(leftLightCoord, vec2(1.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
						topLeft = getDisc(leftLightCoord, vec2(1.0, 0.0), vec4(0.0, 0.25, 0.0, discontinuity.b));
				
					}

				}

				if(rightCenter) {
			
					bottomRight = true;
					topRight = true;

				} 

				if(leftCenter) {

					topLeft = true;
					bottomLeft = true;

				}

				if(normalizedDiscontinuity.x <= -2.0) {

					normalizedDiscontinuity.x = decompressPositiveDiscontinuity(normalizedDiscontinuity.x) + 0.5;
					float a = clamp(subCoord.y - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);
					float b = clamp((1.0 - subCoord.y) - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);
			
					if(!bottomRight || !bottomLeft)  return a;
					else if(!topRight || !topLeft) return b;
					else return min(a, b);
			
				}

				//If, for left or right directions, there is no umbra in the top or bottom..
				if((!bottomRight && !topRight) || (!bottomLeft && !topLeft))
					return clamp(1.0 - normalizedDiscontinuity.x, 0.0, 1.0);
				//If there is no umbra only on the bottom
				else if(!bottomRight || !bottomLeft)	
					return clamp(subCoord.y - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);
				//If there is no umbra only on the top
				else
					return clamp((1.0 - subCoord.y) - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0);

			}

		}

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

		//If the exiting discontinuity is in all the four directions, do not clip the ONDS
		if(discontinuity.r == 0.75 && discontinuity.g == 0.75)
			return 1.0;
	
		if(discontinuity.r == 0.75 || discontinuity.g == 0.75) {

			//If exiting left and right discontinuity only
			if(discontinuity.r == 0.75 && discontinuity.g == 0.0) {
		
				vec4 referenceCoord = lightCoord;
				referenceCoord.x = lightCoord.x - shadowMapStep.x;
				bool left = getDisc(referenceCoord, vec2(0.0, 1.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
				referenceCoord.x = lightCoord.x + shadowMapStep.x;
				bool right = getDisc(referenceCoord, vec2(0.0, 1.0), vec4(0.25, 0.0, 0.0, discontinuity.b));
		
				float a = 0.0, b = 0.0;
		
				//If there is umbra on left and right
				if(left && right) {

					return clamp(normalizedDiscontinuity.y, 0.0, 1.0);
		
				} else if (left || right) {

					if(!left) return mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					else return mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));

				} else {

					int count = 0;
					int mult;
			
					while(!left && !right) {

						mult = (count / 2) + 1;

						if(mod(float(count), 2.0) == 0.0) referenceCoord.y = lightCoord.y + float(mult) * shadowMapStep.y;
						else referenceCoord.y = lightCoord.y - float(mult) * shadowMapStep.y;

						referenceCoord.x = lightCoord.x - shadowMapStep.x;
						left = getDisc(referenceCoord, vec2(1.0, 0.0), 0.0);
				
						referenceCoord.x = lightCoord.x + shadowMapStep.x;
						right = getDisc(referenceCoord, vec2(1.0, 0.0), 0.0);
				
						//Break if the sample is out of the shadow
						if(lightCoord.z <= texture2D(shadowMap, lightCoord.xy).z)
							break; 

						count++;

					}
			
					if(left && right) {

						return clamp(normalizedDiscontinuity.y, 0.0, 1.0);
			
					} else {
			
						if(!left) return mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
						else return mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));

					}

				}

			}

			//If exiting left and right discontinuity
			if(discontinuity.r == 0.75 && discontinuity.g != 0.0) {
		
				//Scan exiting discontinuity in the opposite y-axis direction
				lightCoord.y += ((0.5 - discontinuity.g) * 8.0 - 1) * shadowMapStep.y;
		
				bool left = getDisc(lightCoord, vec2(0.0, 1.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
				bool right = getDisc(lightCoord, vec2(0.0, 1.0), vec4(0.25, 0.0, 0.0, discontinuity.b));
		
				float a = 0.0, b = 0.0;
		
				//If there is umbra on left or right
				if(left && right) {

					return clamp(normalizedDiscontinuity.y, 0.0, 1.0);
		
				} else if (left || right) {
			
					if(left) a = mix(subCoord.y, 1.0 - subCoord.y, step(discontinuity.g, 0.25));
					else a = mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));

					if(right) b = mix(subCoord.y, 1.0 - subCoord.y, step(discontinuity.g, 0.25));
					else b = mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
			
					return max(a, b);

				} else {

					if(discontinuity.g == 0.75) 
						return 0.0;
			
					vec4 referenceCoord;
			
					while(!left && !right) {

						referenceCoord = lightCoord;
				
						referenceCoord.x = lightCoord.x - shadowMapStep.x;
						left = getDisc(referenceCoord, vec2(1.0, 0.0), 0.0);

						referenceCoord.x = lightCoord.x + shadowMapStep.x;
						right = getDisc(referenceCoord, vec2(1.0, 0.0), 0.0);

						//Break if the sample is out of the shadow
						if(lightCoord.z <= texture2D(shadowMap, lightCoord.xy).z)
							break; 
				
						lightCoord.y += ((0.5 - discontinuity.g) * 8.0 - 1) * shadowMapStep.y;
		
					}
			
					if(left && right) {

						return clamp(normalizedDiscontinuity.y, 0.0, 1.0);
			
					} else {
			
						a = mix(1.0 - subCoord.x, subCoord.x, step(1.0, float(left)));
						b = mix(subCoord.y, 1.0 - subCoord.y, step(discontinuity.g, 0.25));
						return max(a, b);
			
					}

				}

			}

			//If exiting top and bottom discontinuity only
			if(discontinuity.r == 0.0 && discontinuity.g == 0.75) {
		
				vec4 referenceCoord = lightCoord;
				referenceCoord.y = lightCoord.y - shadowMapStep.y;
				bool top = getDisc(referenceCoord, vec2(0.0, 1.0), 0.0);
				referenceCoord.y = lightCoord.y + shadowMapStep.y;
				bool bottom = getDisc(referenceCoord, vec2(0.0, 1.0), 0.0);
		
				float a = 0.0, b = 0.0;
		
				//If there is umbra on bottom and top
				if(bottom && top) {

					return clamp(normalizedDiscontinuity.x, 0.0, 1.0);
		
				} else if (bottom || top) {
			
					if(!top) return mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					else return mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
			
				} else {
			
					int count = 0;
					int mult;
			
					while(!top && !bottom) {

						mult = (count / 2) + 1;

						if(mod(float(count), 2.0) == 0.0) referenceCoord.x = lightCoord.x + float(mult) * shadowMapStep.x;
						else referenceCoord.x = lightCoord.x - float(mult) * shadowMapStep.x;

						referenceCoord.y = lightCoord.y - shadowMapStep.y;
						top = getDisc(referenceCoord, vec2(0.0, 1.0), 0.0);
				
						referenceCoord.y = lightCoord.y + shadowMapStep.y;
						bottom = getDisc(referenceCoord, vec2(0.0, 1.0), 0.0);
				
						//Break if the sample is out of the shadow
						if(lightCoord.z <= texture2D(shadowMap, lightCoord.xy).z)
							break; 
				
						count++;

					}
			
					if(top && bottom) {

						return clamp(normalizedDiscontinuity.x, 0.0, 1.0);
			
					} else {
			
						if(!top) return mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
						else return mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
			
					}

				}
		
			}

			//If exiting top and bottom discontinuity
			if(discontinuity.r != 0.0 && discontinuity.g == 0.75) {
			
				//Scan exiting discontinuity in the opposite x-axis direction
				lightCoord.x -= ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
		
				bool bottom = getDisc(lightCoord, vec2(1.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
				bool top = getDisc(lightCoord, vec2(1.0, 0.0), vec4(0.0, 0.25, 0.0, discontinuity.b));
		
				float a = 0.0, b = 0.0;
		
				//If there is umbra on bottom and top
				if(bottom && top) {

					return clamp(normalizedDiscontinuity.x, 0.0, 1.0);
		
				} else if (bottom || top) {
			
					if(top)	a = mix(1.0 - subCoord.x, subCoord.x, step(discontinuity.r, 0.25));
					else a = mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));

					if(bottom) b = mix(1.0 - subCoord.x, subCoord.x, step(discontinuity.r, 0.25));
					else b = mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
			
					return max(a, b);

				} else {
			
					vec4 referenceCoord;
					float center;

					if(discontinuity.r == 0.75) 
						return 0.0;
			
					while(!top && !bottom) {

						referenceCoord = lightCoord;
				
						referenceCoord.y = lightCoord.y - shadowMapStep.y;
						top = getDisc(referenceCoord, vec2(0.0, 1.0), 0.0);
				
						referenceCoord.y = lightCoord.y + shadowMapStep.y;
						bottom = getDisc(referenceCoord, vec2(0.0, 1.0), 0.0);
				
						//Break if the sample is out of the shadow
						if(lightCoord.z <= texture2D(shadowMap, lightCoord.xy).z)
							break; 
				
						lightCoord.x -= ((0.5 - discontinuity.r) * 8.0 - 1) * shadowMapStep.x;
		
					}
			
					if(top && bottom) {

						return clamp(normalizedDiscontinuity.x, 0.0, 1.0);
			
					} else {
			
						a = mix(1.0 - subCoord.y, subCoord.y, step(1.0, float(top)));
						b = mix(1.0 - subCoord.x, subCoord.x, step(discontinuity.r, 0.25));
						return max(a, b);
			
					}

				}
		
			}

		}

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
	
	//Entering discontinuity, where the current fragment is outside the umbra and the neighbour is inside the umbra
	//Exiting discontinuity, where the current fragment is inside the umbra and the neighbour is outside the umbra
	//discType = 0.0 for entering/1.0 for exiting discontinuities
				
	float discType = 1.0 - center;
	vec4 dir = getDisc(normalizedLightCoord, shadowMapStep, distanceFromLight, false, false);
		
	//we disable exiting discontinuities if the neighbour entering discontinuity is in all the directions
	if(discType == 1.0) {
					
		vec4 temp;

		if(dir.x == 1.0) {
			temp = getDisc(vec4(normalizedLightCoord.x - shadowMapStep.x, normalizedLightCoord.yzw), shadowMapStep, distanceFromLight, true, false);
			if(temp == vec4(0.0, 0.0, 0.0, 0.0)) dir.x = 0.0;
		}

		if(dir.y == 1.0) {
			temp = getDisc(vec4(normalizedLightCoord.x + shadowMapStep.x, normalizedLightCoord.yzw), shadowMapStep, distanceFromLight, true, false);
			if(temp == vec4(0.0, 0.0, 0.0, 0.0)) dir.y = 0.0;
		}

		if(dir.z == 1.0) {
			temp = getDisc(vec4(normalizedLightCoord.x, normalizedLightCoord.y + shadowMapStep.y, normalizedLightCoord.zw), shadowMapStep, distanceFromLight, true, false);
			if(temp == vec4(0.0, 0.0, 0.0, 0.0)) dir.z = 0.0;
		}
					
		if(dir.w == 1.0) {
			temp = getDisc(vec4(normalizedLightCoord.x, normalizedLightCoord.y - shadowMapStep.y, normalizedLightCoord.zw), shadowMapStep, distanceFromLight, true, false);
			if(temp == vec4(0.0, 0.0, 0.0, 0.0)) dir.w = 0.0;
		}
				
	} 	
				
	//we disable entering discontinuities if the neighbour exiting discontinuity is in all the directions
	
	if(discType == 0.0) {
					
		vec4 temp;

		if(dir.x == 0.0) {
			temp = getDisc(vec4(normalizedLightCoord.x - shadowMapStep.x, normalizedLightCoord.yzw), shadowMapStep, distanceFromLight, false, true);
			if(temp == vec4(1.0, 1.0, 1.0, 1.0)) dir.x = 1.0;
		}

		if(dir.y == 0.0) {
			temp = getDisc(vec4(normalizedLightCoord.x + shadowMapStep.x, normalizedLightCoord.yzw), shadowMapStep, distanceFromLight, false, true);
			if(temp == vec4(1.0, 1.0, 1.0, 1.0)) dir.y = 1.0;
		}

		if(dir.z == 0.0) {
			temp = getDisc(vec4(normalizedLightCoord.x, normalizedLightCoord.y + shadowMapStep.y, normalizedLightCoord.zw), shadowMapStep, distanceFromLight, false, true);
			if(temp == vec4(1.0, 1.0, 1.0, 1.0)) dir.z = 1.0;
		}
					
		if(dir.w == 0.0) {
			temp = getDisc(vec4(normalizedLightCoord.x, normalizedLightCoord.y - shadowMapStep.y, normalizedLightCoord.zw), shadowMapStep, distanceFromLight, false, true);
			if(temp == vec4(1.0, 1.0, 1.0, 1.0)) dir.w = 1.0;
		}
				
	} 	
				
	vec4 disc = abs(dir - center);
	vec2 color = (2.0 * disc.xz + disc.yw)/4.0;
	return vec4(color, discType, 1.0);		
		
}

float computeShadowFromRSMSS(vec4 normalizedLightCoord, vec4 normalizedCameraCoord)
{

	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	vec4 discontinuity = computeDiscontinuity(normalizedLightCoord, distanceFromLight);
	vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
	if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {
		
		vec4 discontinuitySpace = orientateDS(normalizedLightCoord, discontinuity, subCoord);
		vec4 normalizedDiscontinuity = normalizeDS(normalizedLightCoord, discontinuity, subCoord, discontinuitySpace);
		float fill = smoothONDS(normalizedLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
		fill = mix(fill, 1.0, shadowIntensity);
		return fill;
		
	} else {

		float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
		return shadow;
		
	}
	
	
}

float computeShadowFromAccurateRPCF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
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
			vec4 discontinuity = computeDiscontinuity(sampleLightCoord, distanceFromLight);
				
			if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {

				vec2 subCoord = fract(vec2(sampleLightCoord.x * float(shadowMapWidth), sampleLightCoord.y * float(shadowMapHeight)));
				vec4 discontinuitySpace = orientateDS(sampleLightCoord, discontinuity, subCoord);
				vec4 normalizedDiscontinuity = normalizeDS(sampleLightCoord, discontinuity, subCoord, discontinuitySpace);
				float fill = smoothONDS(sampleLightCoord, normalizedDiscontinuity, discontinuity, subCoord);	
				fill = mix(fill, 1.0, shadowIntensity);
				illuminationCount += fill;

			} else {

				shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity;
				illuminationCount += shadow;

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

		if(RSMSS == 1) shadow = computeShadowFromRSMSS(normalizedLightCoord, normalizedCameraCoord);
		else shadow = computeShadowFromAccurateRPCF(normalizedLightCoord, normalizedCameraCoord);

	}

	gl_FragColor = vec4(shadow, 0.0, 0.0, 1.0);

}
