uniform sampler2D image;
varying vec2 f_texcoord;
uniform int width;
uniform int height;

float sobel(vec2 step, vec2 center)
{
	
	// get samples around pixel
	float bias = 1.0;
    float tleft  = texture2D(image, center + vec2(-step.s, step.t), bias).x;
    float left   = texture2D(image, center + vec2(-step.s, 0), bias).x;
    float bleft  = texture2D(image, center + vec2(-step.s, -step.t), bias).x;
    float top    = texture2D(image, center + vec2(0, step.t), bias).x;
    float bottom = texture2D(image, center + vec2(0, -step.t), bias).x;
    float tright = texture2D(image, center + vec2(step.s, step.t), bias).x;
    float right  = texture2D(image, center + vec2(step.s, 0), bias).x;
    float bright = texture2D(image, center + vec2(step.s, -step.t), bias).x;

	// Sobel masks (to estimate gradient)
	//        1 0 -1     -1 -2 -1
	//    X = 2 0 -2  Y = 0  0  0
	//        1 0 -1      1  2  1
	float x = tleft + 2.0*left + bleft - tright - 2.0*right - bright;
    float y = -tleft - 2.0*top - tright + bleft + 2.0 * bottom + bright;
    float color = sqrt((x*x) + (y*y));
    if (color >= 1.0) 
		return 1.0;
    return 0.0;

}

void main()
{	

	vec2 step, center;
	step.s = 1.0/float(width);
	step.t = 1.0/float(height);
	center.s = f_texcoord.s;
	center.t = f_texcoord.t;
	float shadow = texture2D(image, center).x;
	float edge = sobel(step, center);
	gl_FragColor = vec4(shadow, edge, 0.0, 1.0);

}