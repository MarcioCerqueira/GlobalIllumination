uniform sampler2D shadowMap;
uniform sampler2D accumulationMap;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform mat4 MV;
uniform mat4 MVP;
uniform mat4 lightMVP;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform float shadowIntensity;
uniform float accFactor;
uniform int windowWidth;
uniform int windowHeight;
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
	vec4 normal = texture2D(normalMap, f_texcoord);
	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	float shadow = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	
	if(shadowCoord.w > 0.0 && shadow == 1.0) {

		float distanceFromLight = texture2D(shadowMap, vec2(normalizedShadowCoord.st)).z;		
		shadow = (normalizedShadowCoord.z <= distanceFromLight) ? 1.0 : shadowIntensity; 
		
	}

	float accIntensity = texture2D(accumulationMap, f_texcoord).r;
	gl_FragColor = vec4(shadow * accFactor + accIntensity, 0.0, 0.0, 1.0);

}