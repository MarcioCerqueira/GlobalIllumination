#ifndef IMAGE_H
#define IMAGE_H

#include <malloc.h>
#include <fstream>
#include <opencv2\opencv.hpp>

class Image
{
public:
	Image(int width, int height, int channels);
	Image(char *filename);
	~Image();
	
	void computeBoundingBoxFromOpenGLImage();
	void save(char *filename);
	void splitSMSR();
	void printSMSR();
	void splitRSMSS();
	void printRSMSS();

	unsigned char* getData() { return data; }
	int getWidth() { return width; }
	int getHeight() { return height; }
	int getXMin() { return xmin; }
	int getXMax() { return xmax; }
	int getYMin() { return ymin; }
	int getYMax() { return ymax; }

private:
	unsigned char *data;
	int *SMSRCases;
	int *RSMSSCases;
	int width;
	int height;
	int xmin, xmax, ymin, ymax;
};
#endif