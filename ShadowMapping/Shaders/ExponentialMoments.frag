varying vec4 position;
uniform int zNear;
uniform int zFar;

float linearize(float depth) {

	float n = zNear; // camera z near
	float f = zFar; // camera z far
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

void main()
{	

	float depth = position.z / position.w;
	depth = depth * 0.5 + 0.5;
	depth = linearize(depth);
	
	float exponential = depth;
	float negativeExponential = depth;

	float dx = dFdx(exponential);
	float dy = dFdy(exponential);
	float positiveOffset = 0.25 * (dx*dx+dy*dy);

	dx = dFdx(negativeExponential);
	dy = dFdy(negativeExponential);
	float negativeOffset = 0.25 * (dx*dx+dy*dy);

	gl_FragColor = vec4(exponential, exponential * exponential + positiveOffset, negativeExponential, negativeExponential * negativeExponential + negativeOffset);

}