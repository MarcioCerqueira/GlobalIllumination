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
	
	float c = 640.0;
	float exponential = exp(c * depth);
	float negativeExponential = -exp(-c * depth);

	float dx = dFdx(exponential);
	float dy = dFdy(exponential);
	float positiveOffset = 0.25 * (dx*dx+dy*dy);

	dx = dFdx(negativeExponential);
	dy = dFdy(negativeExponential);
	float negativeOffset = 0.25 * (dx*dx+dy*dy);

	gl_FragColor = vec4(exponential, exponential * exponential + positiveOffset, negativeExponential, negativeExponential * negativeExponential + negativeOffset);

}