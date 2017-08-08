#include "EDT\EDT.h"

#define BLOCK_DIM 1024
texture<float4, cudaTextureType2D, cudaReadModeElementType> image;
cudaArray* arrayDevice2;
	
__device__ float GPUComputeEuclideanDistance(int sitePixel, int pixel, int cols) {

	int sx = sitePixel % cols;
	int sy = sitePixel / cols;
	int px = pixel % cols;
	int py = pixel / cols;
	return sqrtf((sx - px) * (sx - px) + (sy - py) * (sy - py));

}

__device__ bool GPUHasDomination(int a, int b, int c, int column, int cols) {

	float u, v;
	//p(i, u)
	int ax = a % cols;
	int ay = a / cols;
	int bx = b % cols;
	int by = b / cols;
	float mx = (float)(ax + bx) / 2;
	float my = (float)(ay + by) / 2;
	if(bx == ax) {
		u = my;
	} else if(by == ay) {
		u = my;
	} else {
		float m1 = (float)(by - ay) / (float)(bx - ax);
		float m2 = -1/m1;
		u = m2 * (column - mx) + my;
	}

	//q(i, v)
	int cx = c % cols;
	int cy = c / cols;
	mx = (float)(bx + cx) / 2;
	my = (float)(by + cy) / 2;
	if(cx == bx) {
		v = my;
	} else if(cy == by) {
		v = my;
	} else {
		float m1 = (float)(cy - by) / (float)(cx - bx);
		float m2 = -1/m1;
		v = m2 * (column - mx) + my;
	}
	
	if(u > v) return true;
	else return false;

}

__device__ int GPUDetectSkeleton(int x, int y, int p, int q, int nx, int ny, int np, int nq, int gamma, int cols) {

	int dif = (int)((nx - np) * (nx - np) + (ny - nq) * (ny - nq));
	if(dif > gamma && dif > sqrtf((x-nx+p-np) * (x-nx+p-np) + (y-ny+q-nq) * (y-ny+q-nq))) {
		int innerProduct = (nx-np) * (nx+np-x-p) + (ny-nq) * (ny+nq-y-q);
		if(innerProduct >= 0) return y * cols + x;
		else return q * cols + p;
	}
	return -1;

}

__global__ void clearStructure(int *structure) {

	int id = blockIdx.x * blockDim.x + threadIdx.x;
	structure[id] = -1;

}

__global__ void computeSelfNearestSite(int *nearestSite, float siteValue, int rows, int cols) {
	
	int pixel = blockIdx.x * blockDim.x + threadIdx.x;
	if(tex2D(image, pixel % cols, pixel / cols).x == siteValue) nearestSite[pixel] = pixel;
	else nearestSite[pixel] = -1;

}

__global__ void computeNearestSiteInRow(int *nearestSite, float siteValue, int rows, int cols, int bandSize) {
	
	int globalId = blockIdx.x * blockDim.x + threadIdx.x;
	int x = (globalId / cols) * bandSize;
	int y = globalId % cols;
	//int x = blockIdx.x * bandSize;
	//int y = threadIdx.x;

	#pragma unroll
	for(int xp = x; xp < x + bandSize; xp++) {
	  
		int pixel = y * cols + xp;
		if(tex2D(image, pixel % cols, pixel / cols).x == siteValue) {

			#pragma unroll
			for(int xs = xp + 1; xs < x + bandSize; xs++) {
			
				int propagationPixel = y * cols + xs;
				if(tex2D(image, propagationPixel % cols, propagationPixel / cols).x != siteValue) nearestSite[propagationPixel] = pixel;
				else pixel = propagationPixel;
	  
			}

			break;
		}
	
	}

	#pragma unroll
	for(int xp = x + bandSize - 1; xp >= x; xp--) {
	
		int pixel = y * cols + xp;
		if(tex2D(image, pixel % cols, pixel / cols).x == siteValue) {

			#pragma unroll
			for(int xs = xp - 1; xs >= x; xs--) {
			
				int propagationPixel = y * cols + xs;
				float imagePropagationPixel = tex2D(image, propagationPixel % cols, propagationPixel / cols).x;
				int nearestSitePropagationPixel = nearestSite[propagationPixel];
				if(nearestSitePropagationPixel == -1) {
					nearestSite[propagationPixel] = pixel;
				} else if(imagePropagationPixel != siteValue && nearestSitePropagationPixel != -1) {
					float a = abs(nearestSitePropagationPixel % cols - xs);
					float b = abs(xp - xs);
					if(b < a) nearestSite[propagationPixel] = pixel;
				} else pixel = propagationPixel;

			}

			break;
		}

	}
	
}

__global__ void updateBandSitesInRow(int *nearestSite, int cols, int bandSize, int iteration) {

	int globalId = blockIdx.x * blockDim.x + threadIdx.x;
	int x = (globalId / cols) * bandSize + ((iteration + 1) % 2) * (bandSize - 1);
	int y = globalId % cols;
	//int x = blockIdx.x * bandSize + ((iteration + 1) % 2) * (bandSize - 1);
	//int y = threadIdx.x;
	int pixel = y * cols + x;
	int neighbourPixel;

	if(iteration % 2 == 0) neighbourPixel = pixel + 1;
	else neighbourPixel = pixel + bandSize - 1;

	int nearestPixel1 = nearestSite[pixel];
	int nearestPixel2 = nearestSite[neighbourPixel];
	
	float a = GPUComputeEuclideanDistance(pixel, nearestPixel1, cols);
	float b = GPUComputeEuclideanDistance(pixel, nearestPixel2, cols);
	float c = GPUComputeEuclideanDistance(neighbourPixel, nearestPixel1, cols);
	float d = GPUComputeEuclideanDistance(neighbourPixel, nearestPixel2, cols);
	if(a >= b) nearestSite[pixel] = nearestPixel2;
	if(d >= c) nearestSite[neighbourPixel] = nearestPixel1;
	
}

__global__ void updateNearestSiteInRow(int *nearestSite, int cols, int bandSize) {
	
	int pixel = blockIdx.x * blockDim.x + threadIdx.x;
	int x = pixel % cols;
	int y = pixel / cols;
	int band = x / bandSize;
	int firstBandPixel = y * cols + band * bandSize;
	int lastBandPixel = y * cols + band * bandSize + bandSize - 1;
	float a = GPUComputeEuclideanDistance(pixel, nearestSite[pixel], cols);
	float b = GPUComputeEuclideanDistance(pixel, nearestSite[firstBandPixel], cols);
	float c = GPUComputeEuclideanDistance(pixel, nearestSite[lastBandPixel], cols);
	if(b < a && b <= c) nearestSite[pixel] = nearestSite[firstBandPixel];
	if(c < b && c <= a) nearestSite[pixel] = nearestSite[lastBandPixel];

}

__global__ void computeProximateSitesInColumn(int *nearestSite, int *proximateSites, int rows, int cols, int bandSize) {

	//Here, our stack begins in "y + bandSize - 1" and ends in "y"
	int globalId = blockIdx.x * blockDim.x + threadIdx.x;
	int x = globalId % cols;
	int y = (globalId / cols) * bandSize;
	//int x = threadIdx.x;
	//int y = blockIdx.x * bandSize;
	int count = y;

	#pragma unroll
	for(int yb = y; yb < y + bandSize; yb++) {

		int pixel = yb * cols + x;
		int c = nearestSite[pixel];
		if(c != -1) {

			while(count >= y + 2) {
					
				int a = proximateSites[(count - 2) * cols + x];
				int b = proximateSites[(count - 1) * cols + x];
				if(GPUHasDomination(a, b, c, x, cols)) {
					proximateSites[(count - 1) * cols + x] = -1;
					count--;
				} else break;

			}
				
			proximateSites[count * cols + x] = c;
			count++;

		}

	}

}

__global__ void mergeProximateSitesInColumn(int *nearestSite, int *proximateSites, int rows, int cols, int bandSize) {

	int x = blockIdx.x * blockDim.x + threadIdx.x;
	//int x = threadIdx.x;
	int count = 0;
	
	#pragma unroll
	for(int y = 0; y < bandSize; y++)
		if(proximateSites[y * cols + x] != -1) count++;	
	
	#pragma unroll
	for(int it = 1; it < rows/bandSize; it++) {
		int bandCount = 0;
		
		#pragma unroll
		for(int y = 0; y < bandSize; y++) {

			int yp = y + it * bandSize;
			int pixel = yp * cols + x;
			int c = proximateSites[pixel];
			if(c != -1) {
			
				if(bandCount == 2) {
					proximateSites[count * cols + x] = c;
					count++;
					continue;
				}

				while(count >= 2) {
					
					int a = proximateSites[(count - 2) * cols + x];
					int b = proximateSites[(count - 1) * cols + x];
					if(GPUHasDomination(a, b, c, x, cols)) {
						proximateSites[(count - 1) * cols + x] = -1;
						count--;
						bandCount = 0;
					} else break;

				}
			
				proximateSites[count * cols + x] = c;
				count++;
				bandCount++;
				
			}

		}
	}

}

__global__ void computeNearestSiteInFullKernel(int *proximateSites, int *nearestSite, int rows, int cols) {

	int x = blockIdx.x * blockDim.x + threadIdx.x;
	//int x = threadIdx.x;
	int count = 0;

	#pragma unroll
	for(int y = 0; y < rows; y++) {

		int pixel = y * cols + x;
		while(count < rows - 1) {
		 
			float a = GPUComputeEuclideanDistance(proximateSites[count * cols + x], pixel, cols);
			float b = GPUComputeEuclideanDistance(proximateSites[(count + 1) * cols + x], pixel, cols);
			if(a <= b) break;
			else count++;
				
				
		}
			
		nearestSite[pixel] = proximateSites[count * cols + x];
			
	}
	
}

template <typename T> __host__ __device__ inline T lerp(T v0, T v1, T t) {
    return (1-t)*v0 + t*v1;
}

__global__ void normalizeDistanceTransform(int *umbraNearestSite, int *litNearestSite, float *normalizedEDTImage, int rows, int cols, float shadowIntensity) {

	int pixel = blockIdx.x * blockDim.x + threadIdx.x;
	float imagePixel = tex2D(image, pixel % cols, pixel / cols).x;
	if(imagePixel != 0.0 && imagePixel != 1.0) {
		float s1 = GPUComputeEuclideanDistance(litNearestSite[pixel], pixel, cols);
		float s2 = GPUComputeEuclideanDistance(umbraNearestSite[pixel], pixel, cols);
		normalizedEDTImage[pixel * 4 + 0] = lerp<float>((s2/(s1 + s2)), 1.0, shadowIntensity);
	} else {
		normalizedEDTImage[pixel * 4 + 0] = lerp<float>(imagePixel, 1.0, shadowIntensity);
	}
	normalizedEDTImage[pixel * 4 + 1] = tex2D(image, pixel % cols, pixel / cols).y;
	
}

void GPUCheckError(char *methodName) {

	cudaError_t error = cudaGetLastError();
	if(error != cudaSuccess) printf("%s: %s\n", methodName, cudaGetErrorString(error));
	
}

void GPUClearStructure(int *structure, int rows, int cols, cudaStream_t stream) {

    clearStructure<<<(int)ceilf(rows * cols/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(structure);
	GPUCheckError("GPUClearStructure");

}

void GPUClearStructure(int *structure, int rows, int cols) {

    clearStructure<<<(int)ceilf(rows * cols/BLOCK_DIM), BLOCK_DIM>>>(structure);
	GPUCheckError("GPUClearStructure");

}

void GPUComputeNearestSiteInRow(int *nearestSite, float siteValue, int rows, int cols, cudaStream_t stream) {

	int bands = 16;
	int bandSize = cols / bands;
	computeSelfNearestSite<<<(int)ceilf(rows * cols/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(nearestSite, siteValue, rows, cols);
	computeNearestSiteInRow<<<(int)ceilf(bands * rows/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(nearestSite, siteValue, rows, cols, bandSize);
	for(int it = 0; it < bands; it++) 
		updateBandSitesInRow<<<(int)ceilf((bands - (int)((it + 1) % 2)) * rows/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(nearestSite, cols, bandSize, it);
	updateNearestSiteInRow<<<(int)ceilf(rows * cols/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(nearestSite, cols, bandSize);
	GPUCheckError("GPUComputeNearestSiteInRow");

}

void GPUComputeProximateSitesInColumn(int *nearestSite, int *proximateSites, int rows, int cols, cudaStream_t stream) {

	int bands = 16;
	int bandSize = rows / bands;
	computeProximateSitesInColumn<<<(int)ceilf(bands * cols/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(nearestSite, proximateSites, rows, cols, bandSize);
	mergeProximateSitesInColumn<<<(int)ceilf(cols/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(nearestSite, proximateSites, rows, cols, bandSize);
	GPUCheckError("GPUComputeProximateSitesInColumn");

}

void GPUComputeNearestSiteInFull(int *proximateSites, int *nearestSite, int rows, int cols, cudaStream_t stream) {

	computeNearestSiteInFullKernel<<<(int)ceilf(cols/BLOCK_DIM), BLOCK_DIM, 0, stream>>>(proximateSites, nearestSite, rows, cols);
	GPUCheckError("GPUComputeNearestSiteInFull");
	
}

void GPUNormalizeDistanceTransform(int *umbraNearestSite, int *litNearestSite, float *normalizedEDTImage, int rows, int cols, float shadowIntensity) {

	normalizeDistanceTransform<<<(int)ceilf(rows * cols/BLOCK_DIM), BLOCK_DIM>>>(umbraNearestSite, litNearestSite, normalizedEDTImage, rows, cols, shadowIntensity);
	cudaMemcpyToArray(arrayDevice2, 0, 0, normalizedEDTImage, rows * cols * 4 * sizeof(float), cudaMemcpyDeviceToDevice);
	GPUCheckError("GPUNormalizeDistanceTransform");

}

void GPUCudaBindTexture(cudaGraphicsResource_t resource) {

	cudaGraphicsMapResources(1, &resource);
	cudaGraphicsSubResourceGetMappedArray(&arrayDevice2, resource, 0, 0);
	cudaBindTextureToArray(image, arrayDevice2 );
	GPUCheckError("GPUCudaBindTexture");

}

void GPUCudaUnbindTexture(cudaGraphicsResource_t resource) {

	cudaUnbindTexture(image);
	cudaGraphicsUnmapResources(1, &resource);
	GPUCheckError("GPUCudaUnbindTexture");

}