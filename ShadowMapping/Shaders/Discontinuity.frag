uniform sampler2D shadowMap;
varying vec4 shadowCoord;
varying vec3 N;
varying vec3 v;
uniform vec3 lightPosition;
uniform int width;
uniform int height;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int RSMSF;

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
			if((!isCenterUmbra && !bool(RSMSF)) || bool(RSMSF)) {
			
				normalizedLightCoord.x -= shadowMapStep.x;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float left = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
				normalizedLightCoord.x += 2.0 * shadowMapStep.x;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
				normalizedLightCoord.x -= shadowMapStep.x;
				normalizedLightCoord.y += shadowMapStep.y;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
				normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 

				//discType = 0.0 for entering/1.0 for exiting discontinuities
				float discType = 1.0 - center;
				vec4 disc = abs(vec4(left - discType, right - discType, bottom - discType, top - discType) - (center - discType)) * abs(center - discType);
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