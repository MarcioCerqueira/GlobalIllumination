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
uniform int width;
uniform int height;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int maxSearch;
uniform int useTextureForColoring;
uniform int useMeshColor;
uniform int SMSR;
uniform int showDiscontinuity;
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

			normalizedLightCoord.x += shadowMapStep.x;
			normalizedLightCoord.x += shadowMapStep.x;
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

			normalizedLightCoord.y -= shadowMapStep.y;
			normalizedLightCoord.y -= shadowMapStep.y;
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
		
		if((inputDiscontinuity.b == 0 && isCenterUmbra) || (inputDiscontinuity.b == 1.0 && !isCenterUmbra)) {
			foundEdgeEnd = 1.0;
			break;
		} else {
		    hasDisc = getDisc(centeredLightCoord, dir, inputDiscontinuity);
			if(!hasDisc) break;
		}

		dist++;
		centeredLightCoord.xy += shadowMapStep;
	
	}
	
	//if(dir.x == -1.0) dist += subCoord.x;
	//else if(dir.x == 1.0) dist += (1.0 - subCoord.x);

	//if(dir.y == -1.0) dist += subCoord.y;
	//else if(dir.y == 1.0) dist += (1.0 - subCoord.y);
	
	return -dist + foundEdgeEnd * (dist + dist);

}

float normalizeDiscontinuitySpace(vec2 dir, int maxSearch, float subCoord) {

	//If negative discontinuity in both sides, do not fill
	if(dir.x < 0.0 && dir.y < 0.0)
		return -1.0;
	
	float edgeLength = min(abs(dir.x) + abs(dir.y) - 1.0, float(maxSearch));
	float normalizedDiscontinuity = 1.0 - max(dir.x, dir.y)/edgeLength;
	
	//If positive discontinuity in both sides, we must handle the sub-coord addition in a different way
	if(dir.x == dir.y) {
		if(subCoord < 0.5) normalizedDiscontinuity += subCoord/edgeLength; 
		else normalizedDiscontinuity += (1.0 - subCoord)/edgeLength;
	} 
	else if(dir.x == max(dir.x, dir.y)) normalizedDiscontinuity += (1.0 - subCoord)/edgeLength;
	else normalizedDiscontinuity += subCoord/edgeLength;

	//If positive discontinuity in both sides
	if(dir.x > 0.0 && dir.y > 0.0)
		return -2.0 - ((0.5 - normalizedDiscontinuity) * 2);
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

	float left = dir.x;
	float right = dir.y;
	float down = dir.z;
	float up = dir.w;

	vec2 normalizedDiscontinuityCoord;
	normalizedDiscontinuityCoord.x = normalizeDiscontinuitySpace(vec2(left, right), maxSearch, subCoord.x);
	normalizedDiscontinuityCoord.y = normalizeDiscontinuitySpace(vec2(down, up), maxSearch, subCoord.y);

	return vec4(normalizedDiscontinuityCoord.x, normalizedDiscontinuityCoord.y, 0.0, 0.0);

}

float clipONDS(vec4 lightCoord, vec4 normalizedDiscontinuity, vec4 discontinuity, vec2 subCoord)
{

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
		
		vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
		vec2 shadowMapStep = 1.0/shadowMapSize;
		
		lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
		bool vertical = getDisc(lightCoord, vec2(0.0, 0.0), discontinuity.b);
		
		//If there is discontinuity in the y-axis neighbourhood, fill all the ONDS
		if(vertical)
			return 0.0;
		
		if(subCoord.x < 0.5) {
				
			if((subCoord.x * 2) <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0;

		} else {

			if((1.0 - (subCoord.x - 0.5) * 2) <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0;

		} 
	
	}

	//If top-bottom discontinuity
	if(discontinuity.r != 0.0 && discontinuity.g == 0.75) {

		vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
		vec2 shadowMapStep = 1.0/shadowMapSize;
		
		lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		bool horizontal = getDisc(lightCoord, vec2(0.0, 0.0), discontinuity.b);
		
		//If there is discontinuity in the x-axis neighbourhood, fill all the ONDS
		if(horizontal)
			return 0.0;

		if(subCoord.y < 0.5) {

			if((1.0 - normalizedDiscontinuity.x) <= (1.0 - (subCoord.y * 2)))
				return 0.0;
			else
				return 1.0;

		} else {

			if((1.0 - normalizedDiscontinuity.x) <= ((subCoord.y - 0.5) * 2))
				return 0.0;
			else
				return 1.0;
									
		}

	}

	//If left-right discontinuity only
	if(discontinuity.r == 0.75 && discontinuity.g == 0.0) {
		
		if(subCoord.x < 0.5) {
				
			if(subCoord.x <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0;

		} else {

			if((1.0 - subCoord.x) <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0;

		}

	}

	//If top-bottom discontinuity only
	if(discontinuity.r == 0.0 && discontinuity.g == 0.75) {

		if(subCoord.y < 0.5) {

			if((1.0 - normalizedDiscontinuity.x) <= (1.0 - subCoord.y))
				return 0.0;
			else
				return 1.0;

		} else {

			if((1.0 - normalizedDiscontinuity.x) <= subCoord.y)
				return 0.0;
			else
				return 1.0;
								
		}

		
	}

	//If discontinuity in both axis (corner)
	if(discontinuity.r > 0.0 && discontinuity.g > 0.0) {
	
		vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
		vec2 shadowMapStep = 1.0/shadowMapSize;
		
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
			
				if((1.0 - normalizedDiscontinuity.x) <= subCoord.y)
					return 0.0;
				else
					return 1.0;
			
			//If top discontinuity
			} else if(discontinuity.g == 1.0) {
			
				if((1.0 - normalizedDiscontinuity.x) <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0;

			}

		//If there are two dominant axis
		} else {
			
			//If left and top discontinuities
			if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
				if(subCoord.x <= normalizedDiscontinuity.y || (1.0 - subCoord.y) <= normalizedDiscontinuity.x)
					return 0.0;
				else
					return 1.0;
			
			//If left and bottom discontinuities
			} else if(discontinuity.r == 0.5 && discontinuity.g == 1.0) {
			
				if(subCoord.x <= normalizedDiscontinuity.y || subCoord.y <= normalizedDiscontinuity.x)
					return 0.0;
				else
					return 1.0;

			//If right and bottom discontinuities
			} else if(discontinuity.r == 1.0 && discontinuity.g == 0.5) {
			
				if((1.0 - subCoord.x) <= (normalizedDiscontinuity.y) || (1.0 - subCoord.y) <= (normalizedDiscontinuity.x))
					return 0.0;
				else
					return 1.0;

			//If right and top discontinuities
			} else if(discontinuity.r == 1.0 && discontinuity.g == 1.0) {
				
				if((1.0 - subCoord.x) <= (normalizedDiscontinuity.y) || subCoord.y <= normalizedDiscontinuity.x)
					return 0.0;
				else
					return 1.0;

			}

		}
		
	}
	
	//If discontinuity only in y-axis
	if(discontinuity.g > 0.0) {
		
		//If bottom discontinuity
		if(discontinuity.g == 0.5) {

			if((1.0 - subCoord.y) <= normalizedDiscontinuity.x)
				return 0.0;
			else
				return 1.0; 
		
		//If top discontinuity
		} else {
		
			if(subCoord.y <= normalizedDiscontinuity.x)
				return 0.0;
			else
				return 1.0;
				 
		}
		
	} 
	
	//If discontinuity only in x-axis
	if(discontinuity.r > 0.0) {
		
		//If left discontinuity
		if(discontinuity.r == 0.5) {
	
			if(subCoord.x <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0; 
			
		//If right discontinuity
		} else {
		
			if((1.0 - subCoord.x) <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0;

		}
		
	}
	
	return 1.0;
}

float smoothONDS(vec4 lightCoord, vec4 normalizedDiscontinuity, vec4 discontinuity, vec2 subCoord)
{

	//pre-evaluation
	
	if(discontinuity.g > 0.0) {
		
		if(normalizedDiscontinuity.z == 1.0) return 0.0;
		else if(normalizedDiscontinuity.z == 0.0) return 1.0 - discontinuity.b;
		
	}

	if(discontinuity.r > 0.0) {
	
		if(normalizedDiscontinuity.w == 1.0) return 0.0;
		else if(normalizedDiscontinuity.w == 0.0) return 1.0 - discontinuity.b;
		
	}
	
	if(discontinuity.r > 0.0 && discontinuity.g > 0.0) {
	
		vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
		vec2 shadowMapStep = 1.0/shadowMapSize;
		
		lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		bool horizontal = getDisc(lightCoord, vec2(1.0, 0.0), discontinuity.b);
		
		lightCoord.x += ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
		bool vertical = getDisc(lightCoord, vec2(0.0, 1.0), discontinuity.b);

		if(horizontal && !vertical) {
		
			discontinuity.r = 0.0;
		
		} else if(!horizontal && vertical) {

			discontinuity.g = 0.0;
			
		} else if(!horizontal && !vertical) {

			if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
				if(subCoord.x <= subCoord.y)
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			} else if(discontinuity.r == 0.5 && discontinuity.g == 1.0) {
			
				if(subCoord.x <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 0.5) {
			
				if((1.0 - subCoord.x) <= subCoord.y)
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 1.0) {
				
				if((1.0 - subCoord.x) <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			}

		} else {
			
			if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
				if(subCoord.x <= (normalizedDiscontinuity.y) || normalizedDiscontinuity.x <= (subCoord.y))
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			} else if(discontinuity.r == 0.5 && discontinuity.g == 1.0) {
			
				if(subCoord.x <= (normalizedDiscontinuity.y) || (1.0 - normalizedDiscontinuity.x) <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 0.5) {
			
				if((1.0 - subCoord.x) <= (normalizedDiscontinuity.y) || normalizedDiscontinuity.x <= (subCoord.y))
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 1.0) {
				
				if((1.0 - subCoord.x) <= (normalizedDiscontinuity.y) || (1.0 - normalizedDiscontinuity.x) <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0 - discontinuity.b;

			}

		}
		
	}
	
	if(discontinuity.g > 0.0) {
		
		if(discontinuity.g == 0.5) {

		
			if((1.0 - subCoord.y) <= normalizedDiscontinuity.x) {
				if(discontinuity.b == 0.0)
					return 0.5 - (normalizedDiscontinuity.x - (1.0 - subCoord.y));
				else
					return (normalizedDiscontinuity.x - (1.0 - subCoord.y)) - 0.5;
			} else
				return 1.0 - discontinuity.b;

		} else {
		
			if(subCoord.y <= normalizedDiscontinuity.x) {
				if(discontinuity.b == 0.0)
					return 0.5 - (normalizedDiscontinuity.x - subCoord.y);
				else
					return (normalizedDiscontinuity.x - subCoord.y) - 0.5;
			}
			else
				return 1.0 - discontinuity.b;
				 
		}
		
	} 
	
	if(discontinuity.r > 0.0) {
		
		if(discontinuity.r == 0.5) {
	
			if(subCoord.x <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0 - discontinuity.b; 
			
		} 
		
		else {
		
			if((1.0 - subCoord.x) <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0 - discontinuity.b;

		}
		
	}
	
	return 1.0;
}

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1;

	if(max(dot(N2,L), 0.0) == 0.0) 
		return 0.0;
	else
		return 1.0;

}

vec4 computeShadowFromSMSR(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
{

	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	if(shadow == 1.0) {

		vec4 discontinuity = texture2D(discontinuityMap, normalizedCameraCoord.xy);
		vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
				
		if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {

			vec4 discontinuitySpace = orientateDS(normalizedLightCoord, discontinuity, subCoord);
			vec4 normalizedDiscontinuity = normalizeDS(normalizedLightCoord, discontinuity, subCoord, discontinuitySpace);
			float fill = clipONDS(normalizedLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
			
			//post-processing
			if(normalizedDiscontinuity.x <= -2.0) 
				normalizedDiscontinuity.x = abs(normalizedDiscontinuity.x) - 2.0;
	
			if(normalizedDiscontinuity.y <= -2.0) 
				normalizedDiscontinuity.y = abs(normalizedDiscontinuity.y) - 2.0;

			if(showDiscontinuity == 1)
				return vec4(discontinuity.rg, 0.0, 0.0);
			else if(showONDS == 1)
				return vec4(normalizedDiscontinuity.x, normalizedDiscontinuity.y, 0.0, 0.0);
			else if(showClippedONDS == 1)
				return vec4(1.0 - fill, 0.0, 0.0, 0.0);
			else if(showSubCoord == 1)
				return vec4(0.0, 1.0 - subCoord.x, 0.0, 0.0);
			else
				return phong() * shadow * fill;
			
		} else {

			if(showDiscontinuity == 1 || showONDS == 1 || showClippedONDS == 1 || showSubCoord == 1)
				return vec4(0.0, 0.0, 0.0, 0.0);
			else
				return phong() * shadow;
			
		}

	} else {
		return vec4(0.0, 0.0, 0.0, 0.0);
	}

}

vec4 computeShadowFromRSMSF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord)
{

	float distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;		
	float shadow = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	vec4 discontinuity = texture2D(discontinuityMap, normalizedCameraCoord.xy);
	vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
		
	if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {
		
		vec4 discontinuitySpace = orientateDS(normalizedLightCoord, discontinuity, subCoord);
		vec4 normalizedDiscontinuity = normalizeDS(normalizedLightCoord, discontinuity, subCoord, discontinuitySpace);
		float fill = smoothONDS(normalizedLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
		if(fill == 0.0)
			return vec4(0.0, 0.0, 0.0, 0.0);
		else if(fill > 0.5)
			return phong();
		else
			return phong() * (fill * 0.6 + 0.3);

	} else {

		return phong() * shadow;

	}

	
}

vec4 computeShadowFromRPCF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
{
	
	float shadow;
	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	int illuminationCount = 0;
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
				
				
				float red = 0.0;
				float green = 0.0;

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

				bool isLeftUmbra = !bool(left);
				bool isRightUmbra = !bool(right);
				bool isBottomUmbra = !bool(bottom);
				bool isTopUmbra = !bool(top);

				if(!isLeftUmbra && !isRightUmbra) red = 0.0;
				if(isLeftUmbra && !isRightUmbra) red = 0.5;
				if(isLeftUmbra && isRightUmbra) red = 0.75;
				if(!isLeftUmbra && isRightUmbra) red = 1.0;
	
				if(!isBottomUmbra && !isTopUmbra) green = 0.0;
				if(isBottomUmbra && !isTopUmbra) green = 0.5;
				if(isBottomUmbra && isTopUmbra) green = 0.75;
				if(!isBottomUmbra && isTopUmbra) green = 1.0;

				discontinuityMatrix[count] = vec2(red, green);
				
				/*
				vec4 relativeCoord;
				relativeCoord.x = normalizedLightCoord.s + (-offset + float(w)) * incrWidth;
				relativeCoord.y = normalizedLightCoord.t + (-offset + float(h)) * incrHeight;
				relativeCoord.z = texture2D(shadowMap, relativeCoord.xy).z;
				relativeCoord.w = normalizedLightCoord.w;
				normalizedCameraCoord = MVP * inverseLightMVP * relativeCoord;
				normalizedCameraCoord /= normalizedCameraCoord.w;
				normalizedCameraCoord.xy = (normalizedCameraCoord.xy + 1.0) / 2.0;
				discontinuityMatrix[count] = texture2D(discontinuityMap, normalizedCameraCoord.xy).rg;
				*/
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
					illuminationCount += clipONDS(sampleLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
							
				}

			}

			count++;

		}
				
	}
	
	//use light sub coordinates to improve smoothness
	shadow = float(illuminationCount)/float(eachAxis * eachAxis);
	return phong() * shadow;

}

vec4 computeShadowFromAccurateRPCF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
{
	
	float shadow;
	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	float illuminationCount = 0;
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
					
			float red = 0.0;
			float green = 0.0;
			float blue = 0.0;

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

			bool isLeftUmbra = !bool(left);
			bool isRightUmbra = !bool(right);
			bool isBottomUmbra = !bool(bottom);
			bool isTopUmbra = !bool(top);

			if(shadowMatrix[count] == 1.0) {

				if(!isLeftUmbra && !isRightUmbra) red = 0.0;
				if(isLeftUmbra && !isRightUmbra) red = 0.5;
				if(isLeftUmbra && isRightUmbra) red = 0.75;
				if(!isLeftUmbra && isRightUmbra) red = 1.0;
	
				if(!isBottomUmbra && !isTopUmbra) green = 0.0;
				if(isBottomUmbra && !isTopUmbra) green = 0.5;
				if(isBottomUmbra && isTopUmbra) green = 0.75;
				if(!isBottomUmbra && isTopUmbra) green = 1.0;

				blue = 0.0;
				discontinuityMatrix[count] = vec3(red, green, blue);
				
			} else {

				if(isLeftUmbra && isRightUmbra) red = 0.0;
				if(!isLeftUmbra && isRightUmbra) red = 0.5;
				if(!isLeftUmbra && !isRightUmbra) red = 0.75;
				if(isLeftUmbra && !isRightUmbra) red = 1.0;
	
				if(isBottomUmbra && isTopUmbra) green = 0.0;
				if(!isBottomUmbra && isTopUmbra) green = 0.5;
				if(!isBottomUmbra && !isTopUmbra) green = 0.75;
				if(isBottomUmbra && !isTopUmbra) green = 1.0;

				blue = 1.0;
				discontinuityMatrix[count] = vec3(red, green, blue);

			}

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
				
				if(fill == 0.0) 
					illuminationCount += 0.0;
				else if(fill > 0.5) 
					illuminationCount += 1.0;
				else
					illuminationCount += fill;

			} else {

				illuminationCount += shadowMatrix[count];

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

		if(SMSR == 1.0)
			color = computeShadowFromSMSR(normalizedLightCoord, normalizedCameraCoord);	
		else if(RSMSF == 1.0)
			color = computeShadowFromRSMSF(normalizedLightCoord, normalizedCameraCoord);
		else if(RPCF == 1.0)
			color = computeShadowFromRPCF(normalizedLightCoord, normalizedCameraCoord);
		else
			color = computeShadowFromAccurateRPCF(normalizedLightCoord, normalizedCameraCoord);

	} else {
	
		color = vec4(0.0, 0.0, 0.0, 0.0);

	}

	gl_FragColor = color;

}
