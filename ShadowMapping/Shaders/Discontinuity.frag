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
		N2 *= -1;

	if(max(dot(N2,L), 0.0) == 0) 
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
		
			float red = 0.0;
			float green = 0.0;
			float blue = 0.0;

			//Entering discontinuity, where the current fragment is outside the umbra and the neighbour is inside the umbra
			//Exiting discontinuity, where the current fragment is inside the umbra and the neighbour is outside the umbra
			if((!isCenterUmbra && !bool(RSMSF)) || bool(RSMSF)) {
			
				normalizedLightCoord.x -= shadowMapStep.x;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float left = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
				normalizedLightCoord.x += shadowMapStep.x;
				normalizedLightCoord.x += shadowMapStep.x;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float right = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
				normalizedLightCoord.x -= shadowMapStep.x;
				normalizedLightCoord.y += shadowMapStep.y;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float bottom = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
				normalizedLightCoord.y -= shadowMapStep.y;
				normalizedLightCoord.y -= shadowMapStep.y;
				distanceFromLight = texture2D(shadowMap, normalizedLightCoord.st).z;
				float top = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
				bool isLeftUmbra = !bool(left);
				bool isRightUmbra = !bool(right);
				bool isBottomUmbra = !bool(bottom);
				bool isTopUmbra = !bool(top);
				
				if(!isCenterUmbra) {
				
					if(!isLeftUmbra && !isRightUmbra) red = 0.0;
					if(isLeftUmbra && !isRightUmbra) red = 0.5;
					if(isLeftUmbra && isRightUmbra) red = 0.75;
					if(!isLeftUmbra && isRightUmbra) red = 1.0;
					
					if(!isBottomUmbra && !isTopUmbra) green = 0.0;
					if(isBottomUmbra && !isTopUmbra) green = 0.5;
					if(isBottomUmbra && isTopUmbra) green = 0.75;
					if(!isBottomUmbra && isTopUmbra) green = 1.0;
					
					//vec4 disc = abs(vec4(left, right, bottom, top) - center) * center;
					//vec2 dxdy = 0.75f + (-disc.xz + disc.yw) * 0.25f;
					//vec2 color = dxdy * step(1.0f, float2(dot(disc.xy, 1.0f), dot(disc.zw, 1.0f)));
					blue = 0.0;
					gl_FragColor = vec4(red, green, blue, 1.0);

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

					gl_FragColor = vec4(red, green, blue, 1.0);

				}
			
			} else {

				gl_FragColor = vec4(red, green, blue, 1.0);

			}
		
		} else {

			gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);

		}
		

	}

}