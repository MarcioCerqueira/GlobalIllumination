uniform sampler2D shadowMap;
varying vec3 N;
varying vec3 v;  
varying vec4 shadowCoord;
varying vec4 shadowCord;
uniform vec3 lightPosition;
uniform vec3 cameraPosition;
uniform mat4 lightMVPInv;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
uniform int bilinearPCF;
uniform int tricubicPCF;
uniform int poissonPCF;
uniform int VSM;
uniform int naive;
uniform int zNear;
uniform int zFar;

void main()
{	

	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	float shadow = 1.0;
			
	if(shadowCoord.w > 0.0) {

		float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
		shadow = (normalizedShadowCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
			
	}

	gl_FragColor = vec4(shadow, shadow, shadow, 1.0);

}