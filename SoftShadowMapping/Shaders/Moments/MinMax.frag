uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;

void main()
{	

	vec2 step = vec2(1.0/width, 1.0/height);
	vec2 shadowValues[4];
	float minShadowValue, maxShadowValue;
	shadowValues[0] = texture2D(image, vec2(f_texcoord.s - step.s, f_texcoord.t - step.t)).xy;
	shadowValues[1] = texture2D(image, vec2(f_texcoord.s - step.s, f_texcoord.t + step.t)).xy;
	shadowValues[2] = texture2D(image, vec2(f_texcoord.s + step.s, f_texcoord.t - step.t)).xy;
	shadowValues[3] = texture2D(image, vec2(f_texcoord.s + step.s, f_texcoord.t + step.t)).xy;
	minShadowValue = min(shadowValues[0].x, min(shadowValues[1].x, min(shadowValues[2].x, shadowValues[3].x)));
	maxShadowValue = max(shadowValues[0].y, max(shadowValues[1].y, max(shadowValues[2].y, shadowValues[3].y)));
	gl_FragColor = vec4(minShadowValue, maxShadowValue, 0.0, 1.0);
	
}