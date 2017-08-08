uniform sampler2D image;
uniform int width;
uniform int height;
varying vec2 f_texcoord;

void main()
{	

	float sum = texture2D(image, f_texcoord.st).r;
	if(sum == 0.63 || sum == 0.0 || sum == 4.0 || sum == 5.0) discard;
	
	vec2 step = vec2(1.0/float(width), 1.0/float(height));
	for(int y = -1; y <= 1; y++)
		for(int x = -1; x <= 1; x++) {
			float neighbourSum = texture2D(image, vec2(x * step.x + f_texcoord.x, y * step.y + f_texcoord.y)).r;
			if(sum != neighbourSum) discard;
		}

	
	gl_FragColor = vec4(sum, 0.0, 0.0, 0.0);

}