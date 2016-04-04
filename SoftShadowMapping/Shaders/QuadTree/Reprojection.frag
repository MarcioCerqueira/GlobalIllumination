#extension GL_EXT_texture_array : enable
uniform sampler2DArray shadowMapArray;
uniform sampler2D vertexMap;
uniform mat4 lightMVPs[4];
uniform int shadowMapIndices[4];
varying vec2 f_texcoord;

void main()
{	

    vec4 vertex = texture2D(vertexMap, f_texcoord);
	if(vertex.x == 0.0) discard; //Discard background scene
	
	vec4 shadowCoord[4];
	float shadow[4];
	for(int i = 0; i < 4; i++) {
		shadowCoord[i] = lightMVPs[i] * vertex;
		shadowCoord[i] /= shadowCoord[i].w;
		shadow[i] = (shadowCoord[i].z <= texture2DArray(shadowMapArray, vec3(shadowCoord[i].xy, shadowMapIndices[i])).z) ? 1.0 : 0.0;
	}
	
	gl_FragColor = vec4(shadow[0] + shadow[1] + shadow[2] + shadow[3], 0.0, 1.0, 1.0);
	
}