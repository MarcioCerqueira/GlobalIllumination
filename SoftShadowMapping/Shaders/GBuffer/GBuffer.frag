uniform sampler2D texture0;
uniform sampler2D texture1;
uniform sampler2D texture2;
varying vec4 GBufferNormal;
varying vec4 GBufferVertex;  
varying vec3 GBufferColor;
varying vec3 GBufferTextureCoordinates;
uniform int useTextureForColoring;
uniform int useMeshColor;

vec4 computeFragmentColor() 
{
	
	vec4 sceneColor;
    if(useTextureForColoring == 1) {
		if(GBufferTextureCoordinates.b > 0.99 && GBufferTextureCoordinates.b < 1.001)
			sceneColor = texture2D(texture0, vec2(GBufferTextureCoordinates.rg));
		else if(GBufferTextureCoordinates.b > 1.999 && GBufferTextureCoordinates.b < 2.001)
			sceneColor = texture2D(texture1, vec2(GBufferTextureCoordinates.rg));	
		else if(GBufferTextureCoordinates.b > 2.999 && GBufferTextureCoordinates.b < 3.001)
			sceneColor = texture2D(texture2, vec2(GBufferTextureCoordinates.rg));
		else
			sceneColor = vec4(GBufferColor.r, GBufferColor.g, GBufferColor.b, 1);
	} else if(useMeshColor == 1)
		sceneColor = vec4(GBufferColor.r, GBufferColor.g, GBufferColor.b, 1);
	else
		sceneColor = gl_FrontLightModelProduct.sceneColor;
	return sceneColor;

}

void main()
{	

	gl_FragData[0] = GBufferVertex;
	gl_FragData[1] = vec4(GBufferNormal.xyz, float(gl_FrontFacing));
	gl_FragData[2] = computeFragmentColor();

}