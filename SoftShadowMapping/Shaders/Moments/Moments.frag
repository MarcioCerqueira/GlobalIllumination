varying vec4 position;
uniform int zNear;
uniform int zFar;

float linearize(float depth) {

	float n = float(zNear);
	float f = float(zFar);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}

vec4 distributePrecision(vec2 value)  
{  

	float factorInv = 1.0 / 256.0;  
	vec2 intPart;  
	vec2 fracPart = modf(value * 256.0, intPart);  
	return vec4(intPart * factorInv, fracPart);  

}

void main()
{	
	
	float depth = position.z / position.w;
	depth = depth * 0.5 + 0.5;
	depth = linearize(depth);

	float dx = dFdx(depth);
	float dy = dFdy(depth);
	
	vec4 moment;

	moment.x = depth - 0.5;
	moment.y = depth * depth + 0.25 * (dx * dx + dy * dy) - 0.5;
	moment.z = 0.0;
	moment.w = 0.0;
	
	//moment = distributePrecision(moment.xy);
	gl_FragColor = moment;
}