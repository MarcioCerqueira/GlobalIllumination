varying vec4 GBufferNormal;
varying vec4 GBufferVertex;  

void main()
{	

	gl_FragData[0] = GBufferVertex;
	gl_FragData[1] = vec4(GBufferNormal.xyz, float(gl_FrontFacing));

}