#ifndef EDT_H
#define EDT_H

#include <stdio.h>
#include <cuda.h>
#include <cuda_runtime.h>

void GPUClearStructure(int *structure, int rows, int cols);
void GPUClearStructure(int *structure, int rows, int cols, cudaStream_t stream);
void GPUComputeNearestSiteInRow(int *nearestSite, float siteValue, int rows, int cols, cudaStream_t stream);
void GPUComputeProximateSitesInColumn(int *nearestSite, int *proximateSites, int rows, int cols, cudaStream_t stream);
void GPUComputeNearestSiteInFull(int *proximateSites, int *nearestSite, int rows, int cols, cudaStream_t stream);
void GPUNormalizeDistanceTransform(int *umbraNearestSite, int *litNearestSite, float *normalizedEDTImage, int rows, int cols, float shadowIntensity);
void GPUCudaBindTexture(cudaGraphicsResource_t resource);
void GPUCudaUnbindTexture(cudaGraphicsResource_t resource);
#endif