varying vec4 data;  

void main()
{	

	gl_FragColor = vec4(data.xyz, float(gl_FrontFacing));

}