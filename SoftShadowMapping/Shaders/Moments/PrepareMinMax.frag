uniform sampler2D image;
uniform float HSMAlpha;
uniform float HSMBeta;
varying vec2 f_texcoord;

void main()
{	

	float shadow = texture2D(image, f_texcoord.st).x;
	float min, max;
	max = shadow;
	
	if(shadow == 0.0) min = 1.0;
	else min = shadow;
	
	gl_FragColor = vec4(min + HSMAlpha, max + HSMBeta, 0.0, 1.0);

}