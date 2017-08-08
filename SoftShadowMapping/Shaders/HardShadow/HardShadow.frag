uniform sampler2D shadowMap;
uniform sampler2D softShadowMap;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform mat4 MV;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform float shadowIntensity;
uniform int windowWidth;
uniform int windowHeight;
uniform int shadowMapWidth;
uniform int shadowMapHeight;
varying vec2 f_texcoord;

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
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	vec2 shadow = vec2(0.0); //we store hard and projected shadow maps
	shadow.r = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	
	if(shadowCoord.w > 0.0 && shadow.r == 1.0) {

		float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
		shadow.r = (normalizedShadowCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
		if(shadow.r == shadowIntensity) shadow.g = distanceFromLight;
		
	} 
	
	if(computePreEvaluationBasedOnNormalOrientation(vertex, normal) == shadowIntensity)
		shadow.r = 0.0;

	gl_FragColor = vec4(shadow, 0.0, 1.0);

}