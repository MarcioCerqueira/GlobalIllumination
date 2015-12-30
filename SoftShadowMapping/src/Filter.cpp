#include "Filter.h"

Filter::Filter() {

	kernel = 0;
	sigmaSpace = 0;
	sigmaColor = 0;

}

Filter::~Filter() {
	
	delete [] kernel;

}

void Filter::buildGaussianKernel(int order) {

	if(kernel != 0)
		delete [] kernel;

	this->order = order;
	kernel = (float*)malloc(order * sizeof(float));
	int *gaussianWeights = (int*)malloc(order * sizeof(int));
	float norm = powf(2, order - 1);
	int coef;
	
	//first, we compute the gaussian kernel weights based on the Pascal's triangle
	for(int j = 0; j <= order - 1; j++) {
			
		if(j == 0) coef = 1;
		else coef = coef * (order - 1 - j + 1)/j;

		gaussianWeights[j] = coef;
			
	}

	//next, we normalize then based on the kernel size
	for(int k = 0; k < order; k++)
		kernel[k] = gaussianWeights[k] / norm;

	delete [] gaussianWeights;

}

void Filter::buildBilateralKernel(int order) {
	
	if(kernel != 0)
		delete [] kernel;

	this->order = order;
	kernel = (float*)malloc(order * sizeof(float));
	int kernelCenter = order/2;

	for(int i = 0; i <= kernelCenter; i++) {
		kernel[kernelCenter - i] = kernel[kernelCenter + i] = 0.39894f * exp((-0.5f * i * i)/(sigmaSpace * sigmaSpace)) / sigmaSpace;
	}

}