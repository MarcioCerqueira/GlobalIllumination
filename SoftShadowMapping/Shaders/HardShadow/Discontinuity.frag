#extension GL_EXT_texture_array : enable
uniform sampler2DArray shadowMapArray;
uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform mat4 MV;
uniform mat4 lightMVP;
uniform mat3 normalMatrix;
uniform vec3 lightPosition;
uniform vec2 shadowMapStep;
uniform float shadowIntensity;
uniform int currentShadowMapSample;
varying vec2 f_texcoord;

vec4 getDisc(vec4 normalizedLightCoord, float distanceFromLight, int shadowMapIndex) 
{

	vec4 dir = vec4(0.0, 0.0, 0.0, 0.0);
	
	normalizedLightCoord.x -= shadowMapStep.x;
	distanceFromLight = texture2DArray(shadowMapArray, vec3(normalizedLightCoord.xy, shadowMapIndex)).z;
	dir.x = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	normalizedLightCoord.x += 2.0 * shadowMapStep.x;
	distanceFromLight = texture2DArray(shadowMapArray, vec3(normalizedLightCoord.xy, shadowMapIndex)).z;
	dir.y = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	normalizedLightCoord.x -= shadowMapStep.x;
	normalizedLightCoord.y += shadowMapStep.y;
	distanceFromLight = texture2DArray(shadowMapArray, vec3(normalizedLightCoord.xy, shadowMapIndex)).z;
	dir.z = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	normalizedLightCoord.y -= 2.0 * shadowMapStep.y;
	distanceFromLight = texture2DArray(shadowMapArray, vec3(normalizedLightCoord.xy, shadowMapIndex)).z;
	dir.w = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0; 
	
	return dir;

}
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

vec4 computeDiscontinuity(vec4 normalizedLightCoord, float distanceFromLight, int shadowMapIndex) 
{

	float center = (normalizedLightCoord.z <= distanceFromLight) ? 1.0 : 0.0;	
	float discType = 1.0 - center;
	vec4 dir = getDisc(normalizedLightCoord, distanceFromLight, shadowMapIndex);
	vec4 disc = abs(dir - center);
	vec2 color = (2.0 * disc.xz + disc.yw)/4.0;
	return vec4(color, discType, 1.0);		
		
}

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 normal = texture2D(normalMap, f_texcoord);
	vec4 shadowCoord = lightMVP * vertex;
	vec4 normalizedShadowCoord = shadowCoord / shadowCoord.w;
	vec4 discontinuity = vec4(0.0);
	float shadow = computePreEvaluationBasedOnNormalOrientation(vertex, normal);
	
	if(shadowCoord.w > 0.0 && shadow == 1.0) {
		float distanceFromLight = texture2DArray(shadowMapArray, vec3(normalizedShadowCoord.xy, currentShadowMapSample)).z;		
		discontinuity = computeDiscontinuity(normalizedShadowCoord, distanceFromLight, currentShadowMapSample);
	}

	gl_FragColor = discontinuity;

}
