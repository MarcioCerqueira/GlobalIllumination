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

bool getDisc(vec4 normalizedLightCoord, vec2 dir)
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
			if(isLeftUmbra) return true;

			normalizedLightCoord.x += shadowMapStep.x;
			normalizedLightCoord.x += shadowMapStep.x;
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			float right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			bool isRightUmbra = !bool(right);
			if(isRightUmbra) return true;

		}

		if(dir.y == 0.0) {
	
			normalizedLightCoord.y += shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			float bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			bool isBottomUmbra = !bool(bottom);
			if(isBottomUmbra) return true;

			normalizedLightCoord.y -= shadowMapStep.y;
			normalizedLightCoord.y -= shadowMapStep.y;
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			float top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			bool isTopUmbra = !bool(top);
			if(isTopUmbra) return true;

		}

		return false;
	
	}

	
}

float computeDiscontinuityLength(vec2 inputDiscontinuity, vec4 lightCoord, vec2 dir, int maxSearch, vec2 subCoord)
{

	vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
	vec2 inverseShadowMapSize = 1.0/shadowMapSize;
	vec4 centeredLightCoord = lightCoord;
	
	float foundEdgeEnd = 0.0;
	bool hasDisc = false;
	
	if(dir.x == 0.0 && inputDiscontinuity.r == 0.0 && inputDiscontinuity.g != 0.0) return -1.0;
	if(dir.y == 0.0 && inputDiscontinuity.r != 0.0 && inputDiscontinuity.g == 0.0) return -1.0;
	
	float dist = 0.0;

	vec2 shadowMapStep = dir * inverseShadowMapSize;
	vec2 currentDiscontinuity;
	centeredLightCoord.z -= 0.000025;

	for(int it = 0; it < maxSearch; it++) {
		
		float distanceFromLight = texture2D(shadowMap, centeredLightCoord.st).z;
		float center = (centeredLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
		bool isCenterUmbra = !bool(center);
		
		if(isCenterUmbra) {
			foundEdgeEnd = 1.0;
			break;
		} else {
		    hasDisc = getDisc(centeredLightCoord, dir);
			if(!hasDisc) break;
		}

		dist++;
		centeredLightCoord.xy += shadowMapStep;
	
	}
	
	if(dir.x == -1.0) dist += subCoord.x;
	else if(dir.x == 1.0) dist += (1.0 - subCoord.x);

	if(dir.y == -1.0) dist += subCoord.y;
	else if(dir.y == 1.0) dist += (1.0 - subCoord.y);
	
	return -dist + foundEdgeEnd * (dist + dist);

}

float normalizeDiscontinuitySpace(vec2 dir, int maxSearch, float subCoord) {

	float edgeLength = min(abs(dir.x) + abs(dir.y) - 1.0, float(maxSearch));
	float normalizedDiscontinuity = 1.0 - max(dir.x, dir.y)/edgeLength;
	return normalizedDiscontinuity + 1.33 * (1.0/edgeLength) * normalizedDiscontinuity;

}

float orientateDiscontinuitySpace(vec2 dir) 
{

	if(dir.x < 0.0 && dir.y < 0.0)
		return 0.0;
	else if(dir.x > 0.0 && dir.y < 0.0)
		return -0.5;
	else if(dir.x < 0.0 && dir.y > 0.0)
		return 0.5;
	else
		return 1.0;

}

vec4 computeONDS(vec4 lightCoord, vec2 discontinuity, vec2 subCoord)
{

	float left = computeDiscontinuityLength(discontinuity, lightCoord, vec2(-1, 0), maxSearch, subCoord);
	float right = computeDiscontinuityLength(discontinuity, lightCoord, vec2(1, 0), maxSearch, subCoord);
	float down = computeDiscontinuityLength(discontinuity, lightCoord, vec2(0, -1), maxSearch, subCoord);
	float up = computeDiscontinuityLength(discontinuity, lightCoord, vec2(0, 1), maxSearch, subCoord);

	vec2 normalizedDiscontinuityCoord;
	normalizedDiscontinuityCoord.x = normalizeDiscontinuitySpace(vec2(left, right), maxSearch, subCoord.x);
	normalizedDiscontinuityCoord.y = normalizeDiscontinuitySpace(vec2(down, up), maxSearch, subCoord.y);

	vec2 dominantDir;
	dominantDir.x = orientateDiscontinuitySpace(vec2(left, right));
	dominantDir.y = orientateDiscontinuitySpace(vec2(down, up));

	return vec4(normalizedDiscontinuityCoord.x, normalizedDiscontinuityCoord.y, dominantDir.x, dominantDir.y);

}

float clipONDS(vec4 lightCoord, vec4 normalizedDiscontinuity, vec2 discontinuity, vec2 subCoord)
{

	//pre-evaluation
	
	if(discontinuity.g > 0.0) {
		
		if(normalizedDiscontinuity.z == 1.0) return 0.0;
		else if(normalizedDiscontinuity.z == 0.0) return 1.0;
		
	}

	if(discontinuity.r > 0.0) {
	
		if(normalizedDiscontinuity.w == 1.0) return 0.0;
		else if(normalizedDiscontinuity.w == 0.0) return 1.0;
		
	}
	
	if(discontinuity.r > 0.0 && discontinuity.g > 0.0) {
	
		vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
		vec2 shadowMapStep = 1.0/shadowMapSize;
		
		lightCoord.x -= ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		bool horizontal = getDisc(lightCoord, vec2(1.0, 0.0));
		
		lightCoord.x += ((discontinuity.r - 0.75) * 4.0) * shadowMapStep.x;
		lightCoord.y += ((discontinuity.g - 0.75) * 4.0) * shadowMapStep.y;
		bool vertical = getDisc(lightCoord, vec2(0.0, 1.0));

		if(horizontal && !vertical) {
		
			discontinuity.r = 0.0;
		
		} else if(!horizontal && vertical) {

			discontinuity.g = 0.0;
			
		} else if(!horizontal && !vertical) {

			if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
				if(subCoord.x <= subCoord.y)
					return 0.0;
				else
					return 1.0;

			} else if(discontinuity.r == 0.5 && discontinuity.g == 1.0) {
			
				if(subCoord.x <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 0.5) {
			
				if((1.0 - subCoord.x) <= subCoord.y)
					return 0.0;
				else
					return 1.0;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 1.0) {
				
				if((1.0 - subCoord.x) <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0;

			}

		} else {
			
			if(discontinuity.r == 0.5 && discontinuity.g == 0.5) {
			
				if(subCoord.x <= (normalizedDiscontinuity.y) || normalizedDiscontinuity.x <= (subCoord.y))
					return 0.0;
				else
					return 1.0;

			} else if(discontinuity.r == 0.5 && discontinuity.g == 1.0) {
			
				if(subCoord.x <= (normalizedDiscontinuity.y) || (1.0 - normalizedDiscontinuity.x) <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 0.5) {
			
				if((1.0 - subCoord.x) <= (normalizedDiscontinuity.y) || normalizedDiscontinuity.x <= (subCoord.y))
					return 0.0;
				else
					return 1.0;

			} else if(discontinuity.r == 1.0 && discontinuity.g == 1.0) {
				
				if((1.0 - subCoord.x) <= (normalizedDiscontinuity.y) || (1.0 - normalizedDiscontinuity.x) <= (1.0 - subCoord.y))
					return 0.0;
				else
					return 1.0;

			}

		}
		
	}
	
	if(discontinuity.g > 0.0) {
		
		if(discontinuity.g == 0.5) {

			if((1.0 - subCoord.y) <= normalizedDiscontinuity.x)
				return 0.0;
			else
				return 1.0; 
		
		} else {
		
			if(subCoord.y <= normalizedDiscontinuity.x)
				return 0.0;
			else
				return 1.0;
				 
		}
		
	} 
	
	if(discontinuity.r > 0.0) {
		
		if(discontinuity.r == 0.5) {
	
			if(subCoord.x <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0; 
			
		} 
		
		else {
		
			if((1.0 - subCoord.x) <= normalizedDiscontinuity.y)
				return 0.0;
			else
				return 1.0;

		}
		
	}
	
	return 1.0;
}

vec4 computeONDSToDisplay(vec2 discontinuity, vec4 normalizedDiscontinuity) {

	if(discontinuity.g > 0.0) {
		
		if(normalizedDiscontinuity.z == 1.0) return vec4(1.0, 0.0, 0.0, 0.0);
		else if(normalizedDiscontinuity.z == 0.0) return vec4(0.0);
		
	}

	if(discontinuity.r > 0.0) {
	
		if(normalizedDiscontinuity.w == 1.0) return vec4(0.0, 1.0, 0.0, 0.0);
		else if(normalizedDiscontinuity.w == 0.0) return vec4(0.0);
		
	}

	if(discontinuity.g > 0.0 && discontinuity.r > 0.0) return vec4(1.0, 1.0, 0.0, 0.0);
	if(discontinuity.g > 0.0) return vec4(normalizedDiscontinuity.x, 0.0, 0.0, 0.0);
	if(discontinuity.r > 0.0) return vec4(0.0, normalizedDiscontinuity.y, 0.0, 0.0);

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

		vec2 discontinuity = texture2D(discontinuityMap, normalizedCameraCoord.xy).rg;
		vec2 subCoord = fract(vec2(normalizedLightCoord.x * float(shadowMapWidth), normalizedLightCoord.y * float(shadowMapHeight)));
				
		if(discontinuity.r > 0.0 || discontinuity.g > 0.0) {

			vec4 normalizedDiscontinuity = computeONDS(normalizedLightCoord, discontinuity, subCoord);

			float fill = clipONDS(normalizedLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
			
			if(showDiscontinuity == 1)
				return vec4(discontinuity, 0.0, 0.0);
			else if(showONDS == 1)
				return vec4(normalizedDiscontinuity.x, 0.0, 0.0, 0.0);//computeONDSToDisplay(discontinuity, normalizedDiscontinuity);//
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

vec4 computeShadowFromRPCF(vec4 normalizedLightCoord, vec4 normalizedCameraCoord) 
{
	
	float shadow;
	float incrWidth = 1.0/float(shadowMapWidth);
	float incrHeight = 1.0/float(shadowMapHeight);
	int illuminationCount = 0;
	int count = 0;
	int eachAxis = 5;
	float offset = (float(eachAxis) - 1.0) * 0.5;
	float distanceFromLight;

	float shadowMatrix[25];
	vec2 discontinuityMatrix[25];

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
				if(isLeftUmbra) red = 0.5;
				if(isLeftUmbra && isRightUmbra) red = 0.75;
				if(isRightUmbra) red = 1.0;
	
				if(!isBottomUmbra && !isTopUmbra) green = 0.0;
				if(isBottomUmbra) green = 0.5;
				if(isBottomUmbra && isTopUmbra) green = 0.75;
				if(isTopUmbra) green = 1.0;

				discontinuityMatrix[count] = vec2(red, green);

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

					vec2 discontinuity = discontinuityMatrix[count];
					vec4 sampleLightCoord = vec4(normalizedLightCoord.x + w * incrWidth, normalizedLightCoord.y + h * incrHeight, normalizedLightCoord.z, normalizedLightCoord.w);
					vec2 subCoord = fract(vec2(sampleLightCoord.x * float(shadowMapWidth), sampleLightCoord.y * float(shadowMapHeight)));
				
					vec4 normalizedDiscontinuity = computeONDS(sampleLightCoord, discontinuity, subCoord);
					illuminationCount += clipONDS(sampleLightCoord, normalizedDiscontinuity, discontinuity, subCoord);
							
				}

			}

			count++;

		}
				
	}

	shadow = float(illuminationCount)/float(eachAxis * eachAxis);
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
		else
			color = computeShadowFromRPCF(normalizedLightCoord, normalizedCameraCoord);

	} else {
	
		color = vec4(0.0, 0.0, 0.0, 0.0);

	}

	gl_FragColor = color;

}
