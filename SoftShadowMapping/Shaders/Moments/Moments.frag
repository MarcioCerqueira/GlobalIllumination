varying vec4 position;
uniform int zNear;
uniform int zFar;
uniform int SAVSM;
uniform int VSSM;
uniform int MSSM;
uniform vec4 momentTranslationVector;
uniform mat4 momentRotationMatrix;

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

	vec4 moment;

	moment.x = depth;
	moment.y = depth * depth;
		
	if(SAVSM == 1 || VSSM == 1) {
		
		float dx = dFdx(depth);
		float dy = dFdy(depth);
		moment.x -= 0.5;
		moment.y += 0.25 * (dx * dx + dy * dy) - 0.5;
		moment.z = 0.0;
		moment.w = 0.0;
	
	} else {

		moment.z = depth * depth * depth;
		moment.w = depth * depth * depth * depth;
		moment = momentRotationMatrix * moment + momentTranslationVector;
		
	}

	//moment = distributePrecision(moment.xy);
	gl_FragColor = moment;

}