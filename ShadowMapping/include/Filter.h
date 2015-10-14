#ifndef FILTER_H
#define FILTER_H

#include <malloc.h>
#include <math.h>
#include <stdio.h>

class Filter
{

public:
	Filter();
	~Filter();
	
	void buildGaussianKernel(int order);
	void buildBilateralKernel(int order);

	int getOrder() { return order; }
	float* getKernel() { return kernel; }
	float getSigmaSpace() { return sigmaSpace; }
	float getSigmaColor() { return sigmaColor; }
	int getIterations() { return iterations; }

	void setSigmaSpace(float sigmaSpace) { this->sigmaSpace = sigmaSpace; }
	void setSigmaColor(float sigmaColor) { this->sigmaColor = sigmaColor; }
	void setIterations(int iterations) { this->iterations = iterations; }

private:
	int order;
	float *kernel;
	float sigmaSpace;
	float sigmaColor;
	int iterations;

};

#endif