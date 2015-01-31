#ifndef IMAGE_H
#define IMAGE_H

#include <malloc.h>

class Image
{
public:
	Image(int width, int height, int channels);
	~Image();
	void computeBoundingBoxFromOpenGLImage();
	unsigned char* getData() { return data; }
	int getXMin() { return xmin; }
	int getXMax() { return xmax; }
	int getYMin() { return ymin; }
	int getYMax() { return ymax; }
private:
	unsigned char *data;
	int width;
	int height;
	int xmin, xmax, ymin, ymax;
};
#endif