uniform sampler2D shadowMap;
uniform sampler2D accumulationMap;
varying vec3 N;
varying vec3 v;  
varying vec4 shadowCoord;
uniform vec3 lightPosition;
uniform float shadowIntensity;
uniform float accFactor;
uniform int windowWidth;
uniform int windowHeight;

float computePreEvaluationBasedOnNormalOrientation()
{

	vec3 L = normalize(lightPosition.xyz - v);   
	vec3 N2 = N;

	if(!gl_FrontFacing)
		N2 *= -1;

	if(max(dot(N2,L), 0.0) == 0) 
		return shadowIntensity;
	else
		return 1.0;

}

void main()
{	

	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	float shadow = computePreEvaluationBasedOnNormalOrientation();

	if(shadowCoord.w > 0.0 && shadow == 1.0) {

		float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
		shadow = (normalizedShadowCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
		
	}

	float accIntensity = texture2D(accumulationMap, vec2(gl_FragCoord.x/windowWidth, gl_FragCoord.y/windowHeight)).r;
	gl_FragColor = vec4(shadow * accFactor + accIntensity, 0.0, 0.0, 1.0);

}