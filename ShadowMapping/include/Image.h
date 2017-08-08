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
	
	unsigned char* getData() { return data; }
	int getWidth() { return width; }
	int getHeight() { return height; }
	
private:
	unsigned char *data;
	int width;
	int height;
};
#endif