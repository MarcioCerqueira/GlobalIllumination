varying vec4 position;
uniform int zNear;
uniform int zFar;

float linearize(float depth) {

	float n = float(zNear); // camera z near
	float f = float(zFar); // camera z far
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

void main()
{	

	float depth = position.z / position.w;
	depth = depth * 0.5 + 0.5;
	depth = linearize(depth);
	
	gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);

}