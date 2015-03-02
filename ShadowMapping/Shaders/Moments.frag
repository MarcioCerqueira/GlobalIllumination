varying vec4 position;
uniform int zNear;
uniform int zFar;
uniform int VSM;
uniform int MSM;
uniform vec4 tQuantization;
uniform mat4 mQuantization;

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

	vec4 moment;

	moment.x = depth;
	moment.y = depth * depth;

	if(VSM == 1) {
	
		float dx = dFdx(depth);
		float dy = dFdy(depth);
		moment.y += 0.25 * (dx*dx+dy*dy);
		moment.z = 0.0;
		moment.w = 0.0;
	
	} else {

		moment.z = depth * depth * depth;
		moment.w = depth * depth * depth * depth;

		//Optimized moment quantization
		moment = mQuantization * moment + tQuantization;
		
	}

	gl_FragColor = moment;

}