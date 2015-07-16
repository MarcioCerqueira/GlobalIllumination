uniform sampler2D shadowMap;
uniform sampler2D meshTexturedColor;
varying vec4 shadowCoord;
varying vec3 N;
varying vec3 v;
varying vec3 meshColor;
varying vec2 uvTexture;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat4 inverseLightMVP;
uniform vec3 lightPosition;
uniform vec2 shadowMapStep;
uniform float shadowIntensity;
uniform float depthThreshold;
uniform int width;
uniform int height;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int maxSearch;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int showEnteringDiscontinuity;
uniform int showExitingDiscontinuity;
uniform int showONDS;
uniform int showClippedONDS;
uniform int showSubCoord;
uniform int RPCFPlusSMSR;
uniform int SMSR;

float newDepth;

float compressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return -2.0 - ((0.5 - normalizedDiscontinuity) * 2.0);

}

float decompressPositiveDiscontinuity(float normalizedDiscontinuity) {

	return (0.5 - ((normalizedDiscontinuity + 2.0) * -1.0)/2.0);

}

vec4 phong()
{

   vec4 light_ambient = vec4(0.1, 0.1, 0.1, 1);
   vec4 light_specular = vec4(0.1, 0.1, 0.1, 1);
   vec4 light_diffuse = vec4(0.5, 0.5, 0.5, 1);
   float shininess = 60.0;
   
   vec3 L = normalize(lightPosition.xyz - v);   
   vec3 E = normalize(-v); // we are in Eye Coordinates, so EyePos is (0,0,0)  
   vec3 R = normalize(-reflect(L, N));  
 
   //calculate Ambient Term:  
   vec4 Iamb = light_ambient;    

   //calculate Diffuse Term:  
   vec4 Idiff = light_diffuse * max(dot(N,L), 0.0);    
   
   // calculate Specular Term:
   vec4 Ispec = light_specular * pow(max(dot(R,E),0.0), 0.3 * shininess);
   
   vec4 sceneColor;
   if(useMeshColor == 1)
      sceneColor = vec4(meshColor, 1.0);
   else if(useTextureForColoring == 1)
      sceneColor = texture2D(meshTexturedColor, uvTexture);	
   else
      sceneColor = gl_FrontLightModelProduct.sceneColor;
   
   return sceneColor + Iamb + Idiff + Ispec;  

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

		if(discType.r == 0.75 || discType.r == 1.0) {

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

		if(discType.g == 0.75 || discType.g == 1.0) {
			
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
		lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		bool horizontal = getDisc(lightCoord, vec2(1.0, 0.0), discontinuity.b);
		
		lightCoord.x += ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
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
			else if(discontinuity.g == 1.0) return step(1.0 - subCoord.y, 1.0 - normalizedDiscontinuity.x);

		//If there are two dominant axis
		} else {
		
			float a = mix(step(normalizedDiscontinuity.y, subCoord.x), step(normalizedDiscontinuity.y, 1.0 - subCoord.x), step(1.0, discontinuity.r));
			float b = mix(step(normalizedDiscontinuity.x, 1.0 - subCoord.y), step(normalizedDiscontinuity.x, subCoord.y), step(1.0, discontinuity.g));
			return min(a, b);	

		}
		
	}
	
	//If discontinuity only in y-axis
	if(discontinuity.g > 0.0) {
		
		if(discontinuity.g == 0.5)	return step(normalizedDiscontinuity.x, 1.0 - subCoord.y);
		else return step(normalizedDiscontinuity.x, subCoord.y);
		
	} 
	
	//If discontinuity only in x-axis
	if(discontinuity.r > 0.0) {
		
		if(discontinuity.r == 0.5) return step(normalizedDiscontinuity.y, subCoord.x);
		else return step(normalizedDiscontinuity.y, 1.0 - subCoord.x);
		
	}
	
	return 1.0;
	
}

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1.0;

	if(max(dot(N2,L), 0.0) == 0.0) 
		return shadowIntensity;
	else
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
	vec4 disc = abs((dir - discType) - (center - discType)) * abs(center - discType);
	vec2 dxdy = 0.75 + (-disc.xz + disc.yw) * 0.25;
	vec2 color = dxdy * step(vec2(1.0), vec2(dot(disc.xy, vec2(1.0)), dot(disc.zw, vec2(1.0))));
	return vec4(color, discType, 1.0);		
		
}

vec4 computeShadowFromSMSR(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
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
					
			//post-processing
			
			if(normalizedDiscontinuity.x <= -2.0) 
				normalizedDiscontinuity.x = abs(normalizedDiscontinuity.x) - 2.0;
	
			if(normalizedDiscontinuity.y <= -2.0) 
				normalizedDiscontinuity.y = abs(normalizedDiscontinuity.y) - 2.0;

			if(showEnteringDiscontinuity == 1 || showExitingDiscontinuity == 1)
				return vec4(discontinuity.rg, 0.0, 0.0);
			else if(showONDS == 1)
				return vec4(normalizedDiscontinuity.x, normalizedDiscontinuity.y, 0.0, 0.0);
			else if(showClippedONDS == 1 && fill != 1.0)
				return vec4(1.0 - fill, 0.0, 0.0, 0.0);
			else if(showSubCoord == 1)
				return vec4(0.0, 1.0 - subCoord.x, 0.0, 0.0);
			else
				return phong() * fill;
			

		} else {

			if(showEnteringDiscontinuity == 1 || showExitingDiscontinuity == 1 || showONDS == 1 || showSubCoord == 1)
				return vec4(0.0, 0.0, 0.0, 0.0);
			else
				return phong();
			
		}

		
	} else {

		if(showEnteringDiscontinuity == 1 || showExitingDiscontinuity == 1 || showONDS == 1 || showSubCoord == 1)
			return vec4(0.0, 0.0, 0.0, 0.0);
		else
			return phong() * shadowIntensity;
		
	}

}

vec4 computeShadowFromRPCF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
{
	
	float shadow;
	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	float illuminationCount = 0.0;
	int count = 0;
	int eachAxis = 3;
	float offset = (float(eachAxis) - 1.0) * 0.5;
	float distanceFromLight;

	float shadowMatrix[9];
	vec2 discontinuityMatrix[9];
	
	for(int sample = 0; sample < eachAxis * eachAxis; sample++) {
			
		shadowMatrix[sample] = 0.0;
		discontinuityMatrix[sample] = vec2(0.0, 0.0);
	
	}
			 
	//Compute shadow matrix
	for(float w = -offset; w <= offset; w++) {
		for(float h = -offset; h <= offset; h++) {
		
			distanceFromLight = texture2D(shadowMap, vec2(normalizedLightCoord.s + w * incrWidth, normalizedLightCoord.t + h * incrHeight)).z;
			if(normalizedLightCoord.z <= distanceFromLight)
				shadowMatrix[count] = 1.0;
			count++;

		}
	}

	//Compute discontinuity matrix
	count = 0;
	for(int w = 0; w < eachAxis; w++) {
		for(int h = 0; h < eachAxis; h++) {
					
			if(shadowMatrix[count] == 1.0) {
								
				float left = 0.0;
				float right = 0.0;
				float bottom = 0.0;
				float top = 0.0;

				vec2 relativeCoord;
				if(w - 1 >= 0) {
					left = shadowMatrix[(w - 1) * eachAxis + h];
				} else {
					relativeCoord.x = normalizedLightCoord.s + (-offset + float(w) - 1.0) * incrWidth;
					relativeCoord.y = normalizedLightCoord.t + (-offset + float(h)) * incrHeight;
					distanceFromLight = texture2D(shadowMap, relativeCoord).z;
					left = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
				}
					
				if(w + 1 < eachAxis) {
					right = shadowMatrix[(w + 1) * eachAxis + h];
				} else {
					relativeCoord.x = normalizedLightCoord.s + (-offset + float(w) + 1.0) * incrWidth;
					relativeCoord.y = normalizedLightCoord.t + (-offset + float(h)) * incrHeight;
					distanceFromLight = texture2D(shadowMap, relativeCoord).z;
					right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
				}

				if(h - 1 >= 0) {
					top = shadowMatrix[w * eachAxis + h - 1];
				} else {
					relativeCoord.x = normalizedLightCoord.s + (-offset + float(w)) * incrWidth;
					relativeCoord.y = normalizedLightCoord.t + (-offset + float(h) - 1.0) * incrHeight;
					distanceFromLight = texture2D(shadowMap, relativeCoord).z;
					top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 	
				}

				if(h + 1 < eachAxis) {
					bottom = shadowMatrix[w * eachAxis + h + 1];
				} else {
					relativeCoord.x = normalizedLightCoord.s + (-offset + float(w)) * incrWidth;
					relativeCoord.y = normalizedLightCoord.t + (-offset + float(h) + 1.0) * incrHeight;
					distanceFromLight = texture2D(shadowMap, relativeCoord).z;
					bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 	
				}

				vec4 disc = abs(vec4(left, right, bottom, top) - shadowMatrix[count]) * shadowMatrix[count];
				vec2 dxdy = 0.75 + (-disc.xz + disc.yw) * 0.25;
				vec2 color = dxdy * step(vec2(1.0), vec2(dot(disc.xy, vec2(1.0)), dot(disc.zw, vec2(1.0))));
				discontinuityMatrix[count] = vec2(color);
				
			}

			count++;

		}
	}

	//sum the results

	count = 0;
	for(float w = -offset; w <= offset; w++) {
		for(float h = -offset; h <= offset; h++) {
			
			if(shadowMatrix[count] == 1.0) {
					
				if(discontinuityMatrix[count].r == 0.0 && discontinuityMatrix[count].g == 0.0) {
						
					illuminationCount++;

				} else {

					vec4 discontinuity = vec4(discontinuityMatrix[count], 0.0, 1.0);
					vec4 sampleLightCoord = vec4(normalizedLightCoord.x + w * incrWidth, normalizedLightCoord.y + h * incrHeight, normalizedLightCoord.z, normalizedLightCoord.w);
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
	shadow = illuminationCount/float(eachAxis * eachAxis);
	return phong() * shadow;
	
}

void main()
{	

	vec4 normalizedLightCoord = shadowCoord / shadowCoord.w;
	vec4 normalizedCameraCoord = vec4(gl_FragCoord.x/float(width), gl_FragCoord.y/float(height), gl_FragCoord.z, 1.0);
	float shadow = computePreEvaluationBasedOnNormalOrientation();
	vec4 color = vec4(0.0);

	if(shadow == 1.0) {

		if(SMSR == 1)
			color = computeShadowFromSMSR(normalizedLightCoord, normalizedCameraCoord);	
		else 
			color = computeShadowFromRPCF(normalizedLightCoord, normalizedCameraCoord);
		
	} else {
	
		if(showEnteringDiscontinuity == 1 || showExitingDiscontinuity == 1 || showONDS == 1 || showSubCoord == 1)
			color = vec4(0.0, 0.0, 0.0, 0.0);
		else
			color = phong() * shadow;	

	}

	gl_FragColor = color;

}
