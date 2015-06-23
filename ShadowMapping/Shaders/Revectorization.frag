uniform sampler2D discontinuityMap;
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
uniform float shadowIntensity;
uniform int width;
uniform int height;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int maxSearch;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int SMSR;
uniform int showEnteringDiscontinuity;
uniform int showExitingDiscontinuity;
uniform int showONDS;
uniform int showClippedONDS;
uniform int showSubCoord;
uniform int RPCF;
uniform int RPCFSubCoordAccuracy;
uniform int RSMSF;

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
   if(useTextureForColoring == 1)
      sceneColor = texture2D(meshTexturedColor, uvTexture);	
   else if(useMeshColor == 1)
      sceneColor = vec4(meshColor.r, meshColor.g, meshColor.b, 1);
   else
	  sceneColor = gl_FrontLightModelProduct.sceneColor;
   
   return sceneColor + Iamb + Idiff + Ispec;  

}

bool getDisc(vec4 normalizedLightCoord, vec2 dir, float discType)
{

	vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
	vec2 shadowMapStep = 1.0/shadowMapSize;

	if(normalizedLightCoord.x < 0.0 || normalizedLightCoord.x > 1.0 || normalizedLightCoord.y < 0.0 || normalizedLightCoord.y > 1.0) {
	
		return false;
	
	} else {
	
		float distanceFromLight;
			
		if(dir.x == 0.0) {
		
			normalizedLightCoord.x -= shadowMapStep.x;
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			float left = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			bool isLeftUmbra = !bool(left);
			if((isLeftUmbra && discType == 0.0) || (!isLeftUmbra && discType == 1.0)) return true;

			normalizedLightCoord.x += 2.0 * shadowMapStep.x;
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			float right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			bool isRightUmbra = !bool(right);
			if((isRightUmbra && discType == 0.0) || (!isRightUmbra && discType == 1.0)) return true;

			normalizedLightCoord.x -= shadowMapStep.x;

		}

		if(dir.y == 0.0) {
	
			normalizedLightCoord.y += shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			float bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			bool isBottomUmbra = !bool(bottom);
			if((isBottomUmbra && discType == 0.0) || (!isBottomUmbra && discType == 1.0)) return true;

			normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			float top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			bool isTopUmbra = !bool(top);
			if((isTopUmbra && discType == 0.0) || (!isTopUmbra && discType == 1.0)) return true;

		}

		return false;
	
	}

	
}

bool getDisc(vec4 normalizedLightCoord, vec2 dir, vec4 discType)
{

	vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
	vec2 shadowMapStep = 1.0/shadowMapSize;

	if(normalizedLightCoord.x < 0.0 || normalizedLightCoord.x > 1.0 || normalizedLightCoord.y < 0.0 || normalizedLightCoord.y > 1.0) {
	
		return false;
	
	} else {
	
		float distanceFromLight;
		vec4 relativeCoord = normalizedLightCoord;
		
		if(dir.x == 0.0) {
		
			if(discType.r == 0.5 || discType.r == 0.75) {
			
				relativeCoord.x = normalizedLightCoord.x - shadowMapStep.x;
				distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
				float left = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
				bool isLeftUmbra = !bool(left);
				if((isLeftUmbra && discType.b == 0.0) || (!isLeftUmbra && discType.b == 1.0)) return true;
			
			}

			if(discType.r == 0.75 || discType.r == 1.0) {

				relativeCoord.x = normalizedLightCoord.x + shadowMapStep.x;
				distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
				float right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
				bool isRightUmbra = !bool(right);
				if((isRightUmbra && discType.b == 0.0) || (!isRightUmbra && discType.b == 1.0)) return true;
			
			}

		}

		if(dir.y == 0.0) {
	
			if(discType.g == 0.5 || discType.g == 0.75) {
				
				relativeCoord.y = normalizedLightCoord.y + shadowMapStep.y;
				distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
				float bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
				bool isBottomUmbra = !bool(bottom);
				if((isBottomUmbra && discType.b == 0.0) || (!isBottomUmbra && discType.b == 1.0)) return true;
			
			}

			if(discType.g == 0.75 || discType.g == 1.0) {
			
				relativeCoord.y = normalizedLightCoord.y - shadowMapStep.y;
				distanceFromLight = texture2D(shadowMap, relativeCoord.xy).z;
				float top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
				bool isTopUmbra = !bool(top);
				if((isTopUmbra && discType.b == 0.0) || (!isTopUmbra && discType.b == 1.0)) return true;
			
			}

		}

		return false;
	
	}

	
}


float computeDiscontinuityLength(vec4 inputDiscontinuity, vec4 lightCoord, vec2 dir, int maxSearch, vec2 subCoord)
{

	vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
	vec2 inverseShadowMapSize = 1.0/shadowMapSize;
	vec4 centeredLightCoord = lightCoord;
	
	float foundEdgeEnd = 0.0;
	bool hasDisc = false;
	
	if(dir.x == 0.0 && inputDiscontinuity.r == 0.0 && inputDiscontinuity.g != 0.0) return -1.0;
	if(dir.y == 0.0 && inputDiscontinuity.r != 0.0 && inputDiscontinuity.g == 0.0) return -1.0;
	
	float dist = 1.0;

	vec2 shadowMapStep = dir * inverseShadowMapSize;
	centeredLightCoord.xy += shadowMapStep;
	centeredLightCoord.z -= 0.000025;
	
	for(int it = 0; it < maxSearch; it++) {
		
		float distanceFromLight = texture2D(shadowMap, centeredLightCoord.st).z;
		float center = (centeredLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		bool isCenterUmbra = !bool(center);

		if((inputDiscontinuity.b == 0.0 && isCenterUmbra) || (inputDiscontinuity.b == 1.0 && !isCenterUmbra)) {
			foundEdgeEnd = 1.0;
			break;
		} else {
		    hasDisc = getDisc(centeredLightCoord, dir, inputDiscontinuity);
			if(!hasDisc) break;
		}

		dist++;
		centeredLightCoord.xy += shadowMapStep;
	
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
		return -2.0 - ((0.5 - normalizedDiscontinuity) * 2.0);
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

	vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
	vec2 shadowMapStep = 1.0/shadowMapSize;
		
	//If negative discontinuity on both directions, do not clip the ONDS
	if(normalizedDiscontinuity.x == -1.0 && normalizedDiscontinuity.y == -1.0) 
		return 1.0;

	//If positive discontinuity on both directions and the discontinuity is in both sides of an axis, clip all the ONDS
	if(normalizedDiscontinuity.x <= -2.0 && normalizedDiscontinuity.y <= -2.0 && (discontinuity.r == 0.75 || discontinuity.g == 0.75)) 
		return 0.0;

	//hack: The normalized discontinuity less than -2.0 is used to indicate that there is positive discontinuity on both directions. 
	//In this case, we decompress the real normalized discontinuity
	if(normalizedDiscontinuity.x <= -2.0) 
		normalizedDiscontinuity.x = abs(normalizedDiscontinuity.x) - 2.0;
	
	if(normalizedDiscontinuity.y <= -2.0) 
		normalizedDiscontinuity.y = abs(normalizedDiscontinuity.y) - 2.0;

	//If the discontinuity is in all the four directions, clip all the ONDS 
	if(discontinuity.r == 0.75 && discontinuity.g == 0.75)
		return 0.0;

	//If left and right discontinuity
	if(discontinuity.r == 0.75 && discontinuity.g != 0.0) {
		
		lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
		bool vertical = getDisc(lightCoord, vec2(0.0, 0.0), discontinuity.b);
		
		//If there is discontinuity in the y-axis neighbourhood, fill all the ONDS
		if(vertical) return 0.0;
		
		return mix(step(normalizedDiscontinuity.y, subCoord.x * 2.0), step(normalizedDiscontinuity.y, 1.0 - (subCoord.x - 0.5) * 2.0), step(0.5, subCoord.x));

	}

	//If top-bottom discontinuity
	if(discontinuity.r != 0.0 && discontinuity.g == 0.75) {

		lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		bool horizontal = getDisc(lightCoord, vec2(0.0, 0.0), discontinuity.b);
		
		//If there is discontinuity in the x-axis neighbourhood, fill all the ONDS
		if(horizontal) return 0.0;

		return mix(step(1.0 - (subCoord.y * 2.0), 1.0 - normalizedDiscontinuity.x), step((subCoord.y - 0.5) * 2.0, 1.0 - normalizedDiscontinuity.x), step(0.5, subCoord.y));
		
	}

	//If left-right discontinuity only
	if(discontinuity.r == 0.75 && discontinuity.g == 0.0)
		return mix(step(normalizedDiscontinuity.y, subCoord.x), step(normalizedDiscontinuity.y, 1.0 - subCoord.x), step(0.5, subCoord.x));

	//If top-bottom discontinuity only
	if(discontinuity.r == 0.0 && discontinuity.g == 0.75) 
		return mix(step(1.0 - subCoord.y, 1.0 - normalizedDiscontinuity.x), step(subCoord.y, 1.0 - normalizedDiscontinuity.x), step(0.5, subCoord.y));
	
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

float smoothONDS(vec4 lightCoord, vec4 normalizedDiscontinuity, vec4 discontinuity, vec2 subCoord)
{

	vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
	vec2 shadowMapStep = 1.0/shadowMapSize;
		
	//If negative entering discontinuity on both directions, do not clip the ONDS
	if(normalizedDiscontinuity.x == -1.0 && normalizedDiscontinuity.y == -1.0 && discontinuity.b == 0.0) 
		return 1.0;

	//If the entering discontinuity is in all the four directions, clip all the ONDS 
	if(discontinuity.r == 0.75 && discontinuity.g == 0.75 && discontinuity.b == 0.0)
		return 0.0;

	//If positive entering discontinuity on both directions and the discontinuity is in both sides of an axis
	if(normalizedDiscontinuity.x <= -2.0 && normalizedDiscontinuity.y <= -2.0 && (discontinuity.r == 0.75 || discontinuity.g == 0.75) && discontinuity.b == 0.0) {

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
				left = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.5, 0.0, 0.0, 0.0));
				right = !left;

			} else {
				
				if(discontinuity.g == 0.5) 
					top = false;
				else if(discontinuity.g == 1.0)
					bottom = false;
				
				lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
				left = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
				right = getDisc(lightCoord, vec2(0.0, 0.0), vec4(1.0, 0.0, 0.0, discontinuity.b));
				
				//If the dual discontinuity (i.e. left-right) persists in the next neighbour, fill all the ONDS
				if(left && right) return 0.0;
			
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
				if(left && right)	return 0.0;

				//According to the x-axis discontinuity, determine y-axis discontinuity
				lightCoord.x += mix(shadowMapStep.x, -shadowMapStep.x, step(1.0, float(left)));
				bottom = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
				top = !bottom;

			} else {
				
				if(discontinuity.r == 0.5)
					right = false;
				else if(discontinuity.r == 1.0)
					left = false;
				
				lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
				bottom = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
				top = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.0, 1.0, 0.0, discontinuity.b));

				//If the dual discontinuity (i.e. top-bottom) persists in the next neighbour, clip all the ONDS
				if(bottom && top) return 0.0;

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

	//If entering left and right discontinuity
	if(discontinuity.r == 0.75 && discontinuity.g != 0.0 && discontinuity.b == 0.0) {
		
		//These booleans indicate where there is umbra
		bool left = true;
		bool right = true;

		//While umbra in all directions
		while(left && right) {
		
			lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
			left = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
			right = getDisc(lightCoord, vec2(0.0, 0.0), vec4(1.0, 0.0, 0.0, discontinuity.b));
		
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
	if(discontinuity.r == 0.75 && discontinuity.g == 0.0 && discontinuity.b == 0.0) {
		
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

		//While umbra in all directions
		while(topLeft && topRight && bottomLeft && bottomRight && (!topCenter || !bottomCenter)) {
	
			if(!topCenter) {
				
				topLightCoord.y += shadowMapStep.y;
				float center = (topLightCoord.z <= texture2D(shadowMap, topLightCoord.xy).z) ? 1.0 : 0.0; 
				topCenter = !bool(center);
					
				topLeft = getDisc(topLightCoord, vec2(0.0, 0.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
				topRight = getDisc(topLightCoord, vec2(0.0, 0.0), vec4(1.0, 0.0, 0.0, discontinuity.b));
				
			}

			if(!bottomCenter) {
			
				bottomLightCoord.y -= shadowMapStep.y;
				float center = (bottomLightCoord.z <= texture2D(shadowMap, bottomLightCoord.xy).z) ? 1.0 : 0.0; 
				bottomCenter = !bool(center);
				
				bottomLeft = getDisc(bottomLightCoord, vec2(0.0, 0.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
				bottomRight = getDisc(bottomLightCoord, vec2(0.0, 0.0), vec4(1.0, 0.0, 0.0, discontinuity.b));
				
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
	if(discontinuity.r != 0.0 && discontinuity.g == 0.75 && discontinuity.b == 0.0) {

		//These booleans indicate where there is umbra
		bool bottom = true;
		bool top = true;
	
		//While umbra in all directions
		while(bottom && top) {	
		
			lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
			bottom = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
			top = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.0, 1.0, 0.0, discontinuity.b));
		
		}

		//If there is no umbra in the bottom or top..
		if(!bottom && !top)
			return clamp(1.0 - normalizedDiscontinuity.x, 0.0, 1.0);

		float sub = mix(subCoord.x, 1.0 - subCoord.x, step(1.0, discontinuity.r));
		float a = mix(sub, clamp(subCoord.y - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0), step(1.0, float(top)));
		float b = mix(sub, clamp((1.0 - subCoord.y) - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0), step(1.0, float(bottom)));
			
		return min(a, b);
	
	}
	
	//If entering top and bottom discontinuity only
	if(discontinuity.r == 0.0 && discontinuity.g == 0.75 && discontinuity.b == 0.0) {
		
		//These booleans indicate where there is umbra
		bool topLeft = true;
		bool topRight = true;
		bool bottomLeft = true;
		bool bottomRight = true;

		//These booleans help us to find the discontinuity end
		bool leftCenter = false;
		bool rightCenter = false;
		float center;

		vec4 leftLightCoord = lightCoord;
		vec4 rightLightCoord = lightCoord;

		//While umbra in all directions
		while(topLeft && topRight && bottomLeft && bottomRight && (!rightCenter || !leftCenter)) {

			if(!rightCenter) {
				
				rightLightCoord.x += shadowMapStep.x;
				center = (rightLightCoord.z <= texture2D(shadowMap, rightLightCoord.xy).z) ? 1.0 : 0.0; 
				rightCenter = !bool(center);
			
				bottomRight = getDisc(rightLightCoord, vec2(0.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
				topRight = getDisc(rightLightCoord, vec2(0.0, 0.0), vec4(0.0, 1.0, 0.0, discontinuity.b));
					
			}
		
			if(!leftCenter) {
				
				leftLightCoord.x -= shadowMapStep.x;
				center = (leftLightCoord.z <= texture2D(shadowMap, leftLightCoord.xy).z) ? 1.0 : 0.0; 
				leftCenter = !bool(center);
			
				bottomLeft = getDisc(leftLightCoord, vec2(0.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
				topLeft = getDisc(leftLightCoord, vec2(0.0, 0.0), vec4(0.0, 1.0, 0.0, discontinuity.b));
				
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

	//If exiting left and right discontinuity
	if(discontinuity.r == 0.75 && discontinuity.b == 1.0) {
		
		//Scan exiting discontinuity in the opposite y-axis direction
		lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
		bool left = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.5, 0.0, 0.0, discontinuity.b));
		bool right = getDisc(lightCoord, vec2(0.0, 0.0), vec4(1.0, 0.0, 0.0, discontinuity.b));
		
		//If there is umbra on left and right
		if(left && right) {

			return clamp(normalizedDiscontinuity.y, 0.0, 1.0);
		
		} else if (left || right) {

			lightCoord.y -= ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
			
			lightCoord.x -= shadowMapStep.x;
			bool enteringLeft = getDisc(lightCoord, vec2(1.0, 0.0), 0.0);

			lightCoord.x += 2.0 * shadowMapStep.x;
			bool enteringRight = getDisc(lightCoord, vec2(1.0, 0.0), 0.0);

			float a = 0.0, b = 0.0;
			
			if(enteringLeft) a = mix(subCoord.y, 1.0 - subCoord.y, step(1.0, discontinuity.g));
			else a = mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));

			if(enteringRight) b = mix(subCoord.y, 1.0 - subCoord.y, step(1.0, discontinuity.g));
			else b = mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
			
			return max(a, b);

		}

	}
	
	//If exiting top and bottom discontinuity
	if(discontinuity.g == 0.75 && discontinuity.b == 1.0) {
			
		//Scan exiting discontinuity in the opposite x-axis direction
		lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		bool bottom = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.0, 0.5, 0.0, discontinuity.b));
		bool top = getDisc(lightCoord, vec2(0.0, 0.0), vec4(0.0, 1.0, 0.0, discontinuity.b));
		
		//If there is umbra on bottom and top
		if(bottom && top) {

			return clamp(normalizedDiscontinuity.x, 0.0, 1.0);
		
		} else if (bottom || top) {
		
			lightCoord.x += ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
			
			lightCoord.y -= shadowMapStep.y;
			bool enteringTop = getDisc(lightCoord, vec2(0.0, 1.0), 0.0);

			lightCoord.y += 2.0 * shadowMapStep.y;
			bool enteringBottom = getDisc(lightCoord, vec2(0.0, 1.0), 0.0);

			float a = 0.0, b = 0.0;
			
			if(enteringTop)	a = mix(1.0 - subCoord.x, subCoord.x, step(1.0, discontinuity.r));
			else a = mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));

			if(enteringBottom) b = mix(1.0 - subCoord.x, subCoord.x, step(1.0, discontinuity.r));
			else b = mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
			
			return max(a, b);

		}
		
	}

	//If discontinuity in both axes (corner)
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

			//If bottom discontinuity
			if(discontinuity.g == 0.5) {
			
				return mix(clamp((1.0 - normalizedDiscontinuity.x) - (subCoord.y - 1.0), 0.0, 1.0), clamp(subCoord.y - (1.0 - normalizedDiscontinuity.x), 0.0, 1.0), 
					step(1.0, discontinuity.b));
			
			//If top discontinuity
			} else if(discontinuity.g == 1.0) {
			
				return mix(clamp((1.0 - normalizedDiscontinuity.x) + subCoord.y, 0.0, 1.0), clamp((1.0 - subCoord.y) - (1.0 - normalizedDiscontinuity.x), 0.0, 1.0), 
					step(1.0, discontinuity.b));

			}

		//If there are two dominant axis
		} else {
			
			float a, b;

			//If left and bottom discontinuities
			if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
				if(discontinuity.b == 1.0) {

					a = mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);

				} else {

					a = mix(1.0 - subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - (1.0 - subCoord.y)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				}

			//If left and top discontinuities
			} else if(discontinuity.r == 0.5 && discontinuity.g == 1.0) {
				
				if(discontinuity.b == 1.0) {

					a = mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);

				} else {
	
					a = mix(subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				}

			//If right and bottom discontinuities
			} else if(discontinuity.r == 1.0 && discontinuity.g == 0.5) {

				if(discontinuity.b == 1.0) {

					a = mix(subCoord.y, clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);

				} else {

					a = mix(1.0 - subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - (1.0 - subCoord.y)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - (1.0 - subCoord.x)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				}

			//If right and top discontinuities
			} else if(discontinuity.r == 1.0 && discontinuity.g == 1.0) {
				
				if(discontinuity.b == 1.0) {

					a = mix(1.0 - subCoord.y, clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(subCoord.x, clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return max(a, b);
				
				} else {

					a = mix(subCoord.y, clamp(1.0 - (normalizedDiscontinuity.x - subCoord.y), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.x));
					b = mix(1.0 - subCoord.x, clamp(1.0 - (normalizedDiscontinuity.y - (1.0 - subCoord.x)), 0.0, 1.0), step(-2.0, normalizedDiscontinuity.y));
					return min(a, b);

				}
				
			}

		}	

	}

	//If positive discontinuity only in x-axis
	if(normalizedDiscontinuity.x <= -2.0) {
	
		if(discontinuity.b == 1.0)
			return mix(subCoord.y, 1.0 - subCoord.y, step(1.0, discontinuity.g));
		else
			return mix(1.0 - subCoord.y, subCoord.y, step(1.0, discontinuity.g));

	}

	//If positive discontinuity only in y-axis
	if(normalizedDiscontinuity.y <= -2.0) {
	
		if(discontinuity.b == 1.0)
			return mix(1.0 - subCoord.x, subCoord.x, step(1.0, discontinuity.r));
		else
			return mix(subCoord.x, 1.0 - subCoord.x, step(1.0, discontinuity.r));

	}

	//If discontinuity only in y-axis
	if(discontinuity.g > 0.0) {
		
		//If bottom discontinuity
		if(discontinuity.g == 0.5)
			return mix(clamp((1.0 - subCoord.y) - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0), clamp(normalizedDiscontinuity.x - (1.0 - subCoord.y), 0.0, 1.0), 
				step(1.0, discontinuity.b));				
		//If top discontinuity
		else
			return mix(clamp(subCoord.y - (normalizedDiscontinuity.x - 1.0), 0.0, 1.0), clamp(normalizedDiscontinuity.x - subCoord.y, 0.0, 1.0), 
				step(1.0, discontinuity.b)); 
		
	} 

	//If discontinuity only in x-axis
	if(discontinuity.r > 0.0) {
		
		//If left discontinuity
		if(discontinuity.r == 0.5)
			return mix(clamp(subCoord.x - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0), clamp(normalizedDiscontinuity.y - subCoord.x, 0.0, 1.0), 
				step(1.0, discontinuity.b));
		//If right discontinuity
		else
			return mix(clamp((1.0 - subCoord.x) - (normalizedDiscontinuity.y - 1.0), 0.0, 1.0), clamp(normalizedDiscontinuity.y - (1.0 - subCoord.x), 0.0, 1.0), 
				step(1.0, discontinuity.b));
		
	}

	return 1.0 - discontinuity.b;

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

vec4 computeShadowFromSMSR(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
{

	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	
	if(shadow == 1.0) {

		vec4 discontinuity = texture2D(discontinuityMap, normalizedCameraCoord.xy);
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

vec4 computeShadowFromRSMSF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord)
{

	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
	vec4 discontinuity = texture2D(discontinuityMap, normalizedCameraCoord.xy);
	vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
		
	if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {
		
		vec4 discontinuitySpace = orientateDS(normalizedLightCoord, discontinuity, subCoord);
		vec4 normalizedDiscontinuity = normalizeDS(normalizedLightCoord, discontinuity, subCoord, discontinuitySpace);
		float fill = smoothONDS(normalizedLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
		fill = mix(fill, 1.0, shadowIntensity);
		
		//post-processing
		if(normalizedDiscontinuity.x <= -2.0) 
			normalizedDiscontinuity.x = abs(normalizedDiscontinuity.x) - 2.0;
	
		if(normalizedDiscontinuity.y <= -2.0) 
			normalizedDiscontinuity.y = abs(normalizedDiscontinuity.y) - 2.0;

		if(showEnteringDiscontinuity == 1 || showExitingDiscontinuity == 1) {
			if((showEnteringDiscontinuity == 1 && discontinuity.b == 0.0) || (showExitingDiscontinuity == 1 && discontinuity.b == 1.0))
				return vec4(discontinuity.rg, 0.0, 0.0);
			else
				return vec4(0.0, 0.0, 0.0, 0.0);
		} else if(showONDS == 1)
			return vec4(normalizedDiscontinuity.xy, 0.0, 0.0);
		else if(showClippedONDS == 1 && fill != 1.0)
			return vec4(1.0 - fill, 0.0, 0.0, 0.0);
		else if(showSubCoord == 1)
			return vec4(0.0, subCoord.x, 0.0, 0.0);
		else
			return phong() * fill;

	} else {

		if(showEnteringDiscontinuity == 1 || showExitingDiscontinuity == 1 || showONDS == 1 || showSubCoord == 1)
			return vec4(0.0, 0.0, 0.0, 0.0);
		else
			return phong() * shadow;

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

vec4 computeShadowFromAccurateRPCF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
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
	vec3 discontinuityMatrix[9];

	for(int sample = 0; sample < eachAxis * eachAxis; sample++) {
			
		shadowMatrix[sample] = 0.0;
		discontinuityMatrix[sample] = vec3(0.0, 0.0, 0.0);
	
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

			float discType = 1.0 - shadowMatrix[count];
			vec4 disc = abs(vec4(left - discType, right - discType, bottom - discType, top - discType) - (shadowMatrix[count] - discType)) * abs(shadowMatrix[count] - discType);
			vec2 dxdy = 0.75 + (-disc.xz + disc.yw) * 0.25;
			vec2 color = dxdy * step(vec2(1.0), vec2(dot(disc.xy, vec2(1.0)), dot(disc.zw, vec2(1.0))));
			discontinuityMatrix[count] = vec3(color, discType);

			count++;

		}
	}

	//sum the results
	count = 0;
	for(float w = -offset; w <= offset; w++) {
		for(float h = -offset; h <= offset; h++) {
			
			if(discontinuityMatrix[count].r > 0.0 || discontinuityMatrix[count].g > 0.0) {

				vec4 discontinuity = vec4(discontinuityMatrix[count], 1.0);
				vec4 sampleLightCoord = vec4(normalizedLightCoord.x + w * incrWidth, normalizedLightCoord.y + h * incrHeight, normalizedLightCoord.z, normalizedLightCoord.w);
				vec2 subCoord = fract(vec2(sampleLightCoord.x * float(shadowMapWidth), sampleLightCoord.y * float(shadowMapHeight)));
				
				vec4 discontinuitySpace = orientateDS(sampleLightCoord, discontinuity, subCoord);
				vec4 normalizedDiscontinuity = normalizeDS(sampleLightCoord, discontinuity, subCoord, discontinuitySpace);
				
				float fill = smoothONDS(sampleLightCoord, normalizedDiscontinuity, discontinuity, subCoord);	
				fill = mix(fill, 1.0, shadowIntensity);
				illuminationCount += fill;

			} else {

				illuminationCount += mix(shadowMatrix[count], 1.0, shadowIntensity);

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
	vec4 color;
	
	if(shadow == 1.0) {

		if(SMSR == 1)
			color = computeShadowFromSMSR(normalizedLightCoord, normalizedCameraCoord);	
		else if(RSMSF == 1)
			color = computeShadowFromRSMSF(normalizedLightCoord, normalizedCameraCoord);
		else if(RPCF == 1)
			color = computeShadowFromRPCF(normalizedLightCoord, normalizedCameraCoord);
		else
			color = computeShadowFromAccurateRPCF(normalizedLightCoord, normalizedCameraCoord);

	} else {
	
		if(showEnteringDiscontinuity == 1 || showExitingDiscontinuity == 1 || showONDS == 1 || showSubCoord == 1)
			color = vec4(0.0, 0.0, 0.0, 0.0);
		else
			color = phong() * shadow;

	}

	gl_FragColor = color;

}
