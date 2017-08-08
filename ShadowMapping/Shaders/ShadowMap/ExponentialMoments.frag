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

	vec2 moment;
	moment.x = depth;
	moment.y = depth * depth;
	
	float dx = dFdx(depth);
	float dy = dFdy(depth);
	moment.y += 0.25 * (dx*dx+dy*dy);
	
	gl_FragColor = vec4(moment.x, moment.y, depth, 1.0);

}