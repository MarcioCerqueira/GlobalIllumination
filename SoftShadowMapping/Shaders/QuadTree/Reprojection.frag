uniform sampler2D shadowMap0;
uniform sampler2D shadowMap1;
uniform sampler2D shadowMap2;
uniform sampler2D shadowMap3;
uniform sampler2D vertexMap;
uniform mat4 lightMVP0;
uniform mat4 lightMVP1;
uniform mat4 lightMVP2;
uniform mat4 lightMVP3;
uniform float shadowIntensity;
varying vec2 f_texcoord;

void main()
{	

    vec4 vertex = texture2D(vertexMap, f_texcoord);
	if(vertex.x == 0.0) discard; //Discard background scene
	
	vec4 shadowCoord0 = lightMVP0 * vertex;
	vec4 shadowCoord1 = lightMVP1 * vertex;
	vec4 shadowCoord2 = lightMVP2 * vertex;
	vec4 shadowCoord3 = lightMVP3 * vertex;
	
	shadowCoord0 /= shadowCoord0.w;
	shadowCoord1 /= shadowCoord1.w;
	shadowCoord2 /= shadowCoord2.w;
	shadowCoord3 /= shadowCoord3.w;
		
	float shadow0 = (shadowCoord0.z <= texture2D(shadowMap0, shadowCoord0.st).z) ? 1.0 : 0.0; 
	float shadow1 = (shadowCoord1.z <= texture2D(shadowMap1, shadowCoord1.st).z) ? 1.0 : 0.0; 
	float shadow2 = (shadowCoord2.z <= texture2D(shadowMap2, shadowCoord2.st).z) ? 1.0 : 0.0; 
	float shadow3 = (shadowCoord3.z <= texture2D(shadowMap3, shadowCoord3.st).z) ? 1.0 : 0.0; 
	
	gl_FragColor = vec4(shadow0 + shadow1 + shadow2 + shadow3, 0.0, 1.0, 1.0);
	
}