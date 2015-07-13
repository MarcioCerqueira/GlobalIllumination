uniform sampler2D shadowMap;
varying vec4 shadowCoord;
varying vec3 N;
varying vec3 v;
uniform vec3 lightPosition;
uniform int width;
uniform int height;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int RSMSS;

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1.0;

	if(max(dot(N2,L), 0.0) == 0.0) 
		return 0.0;
	else
		return 1.0;

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
	if(breakForUmbra && dir.x == 1.0 || breakForNoUmbra && dir.x == 0.0) return dir;

	normalizedLightCoord.x += 2.0 * shadowMapStep.x;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.y = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if(breakForUmbra && dir.y == 1.0 || breakForNoUmbra && dir.y == 0.0) return dir;
	
	normalizedLightCoord.x -= shadowMapStep.x;
	normalizedLightCoord.y += shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.z = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if(breakForUmbra && dir.z == 1.0 || breakForNoUmbra && dir.z == 0.0) return dir;

	normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
	distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
	dir.w = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	if(breakForUmbra && dir.w == 1.0 || breakForNoUmbra && dir.w == 0.0) return dir;

	return dir;

}

void main()
{	

	vec4 normalizedLightCoord = shadowCoord / shadowCoord.w;
	
	if(normalizedLightCoord.x < 0.0 || normalizedLightCoord.x > 1.0 || normalizedLightCoord.y < 0.0 || normalizedLightCoord.y > 1.0) {
	
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
	
	} else {

		vec2 shadowMapSize = vec2(shadowMapWidth, shadowMapHeight);
		vec2 shadowMapStep = 1.0/shadowMapSize;

		float center = computePreEvaluationBasedOnNormalOrientation();
		bool isCenterUmbra = !bool(center);
		float distanceFromLight;

		if(!isCenterUmbra) {
			
			distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
			center = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			isCenterUmbra = !bool(center);

			//Entering discontinuity, where the current fragment is outside the umbra and the neighbour is inside the umbra
			//Exiting discontinuity, where the current fragment is inside the umbra and the neighbour is outside the umbra
			if((!isCenterUmbra && !bool(RSMSS)) || bool(RSMSS)) {
			
				//discType = 0.0 for entering/1.0 for exiting discontinuities
				vec4 dir = getDisc(normalizedLightCoord, shadowMapStep, distanceFromLight, false, false);
				float discType = 1.0 - center;
				
				//we disable exiting discontinuities if the neighbour entering discontinuity is in all the directions
				if(discType == 1.0) {
					
					bool allDirections = false;
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
					
					bool allDirections = false;
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
				vec4 disc = abs((dir - discType) - (center - discType)) * abs(center - discType);
				vec2 dxdy = 0.75 + (-disc.xz + disc.yw) * 0.25;
				vec2 color = dxdy * step(vec2(1.0), vec2(dot(disc.xy, vec2(1.0)), dot(disc.zw, vec2(1.0))));
	
				gl_FragColor = vec4(color, discType, 1.0);
	

			} else {

				gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

			}
		
		} else {

			gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);

		}		

	}

}