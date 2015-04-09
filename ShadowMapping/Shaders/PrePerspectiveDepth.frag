varying vec4 position;

void main()
{	
	
	float depth = position.z / position.w;
	depth = depth * 0.5 + 0.5;
	gl_FragColor = vec4(position.w, depth, gl_FragCoord.z, 1);

	
}