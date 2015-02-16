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
	
	float moment1 = depth;
	float moment2 = depth * depth;

	float dx = dFdx(depth);
	float dy = dFdy(depth);
	moment2 += 0.25 * (dx*dx+dy*dy);

	gl_FragColor = vec4(moment1, moment2, 0.0, 1.0);

}