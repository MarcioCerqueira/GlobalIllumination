uniform sampler2D vertexMap;
uniform sampler2D normalMap;
uniform sampler2D hardShadowMap;
uniform sampler2D hierarchicalShadowMap;
uniform mat4 MVP;
uniform float shadowIntensity;
uniform int kernelSize;
varying vec2 f_texcoord;

void main()
{	

	vec4 vertex = texture2D(vertexMap, f_texcoord);	
	if(vertex.x == 0.0) discard; //Discard background scene

	vec4 shadow = texture2D(hardShadowMap, f_texcoord.xy);	float visibility = 0.0;

	if(shadow.b == 1.0) {
	
		
		float centralShadow = (shadow.r == shadowIntensity) ? 0.0 : 1.0;
		float illuminationCount = centralShadow;
	
		float neighbourShadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(shadow.a, shadow.a))).r;
		neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
		illuminationCount += neighbourShadow;

		neighbourShadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(-shadow.a, -shadow.a))).r;
		neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
		illuminationCount += neighbourShadow;

		neighbourShadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(shadow.a, -shadow.a))).r;
		neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
		illuminationCount += neighbourShadow;
		
		neighbourShadow = texture2D(hardShadowMap, vec2(f_texcoord.xy + vec2(-shadow.a, shadow.a))).r;
		neighbourShadow = (neighbourShadow == shadowIntensity) ? 0.0 : 1.0;	
		illuminationCount += neighbourShadow;
		
		visibility = illuminationCount/float(5.0);

	}

	vec4 position = MVP * vertex;
	float depth = position.z/position.w;
	depth = depth * 0.5 + 0.5;
	
	gl_FragData[0] = vec4(shadow.r, shadow.gb, visibility);
	gl_FragData[1] = position;
	
}