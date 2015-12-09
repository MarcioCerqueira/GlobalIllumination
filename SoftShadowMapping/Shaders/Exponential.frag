varying vec4 position;
uniform int zNear;
uniform int zFar;

float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

void main()
{	
	
	float depth = position.z / position.w;
	depth = depth * 0.5 + 0.5;
	depth = linearize(depth);

	float c = 80.0;
	float exponential = exp(c * depth);
	gl_FragColor = vec4(depth, exponential, exponential * depth, 0.0);

}