/*
Author: Cao Thanh Tung
Date: 21/01/2010

File Name: pba2DHost.cu

===============================================================================

Copyright (c) 2010, School of Computing, National University of Singapore. 
All rights reserved.

Project homepage: http://www.comp.nus.edu.sg/~tants/pba.html

If you use PBA and you like it or have comments on its usefulness etc., we 
would love to hear from you at <tants@comp.nus.edu.sg>. You may share with us
your experience and any possibilities that we may improve the work/code.

===============================================================================

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of
conditions and the following disclaimer. Redistributions in binary form must reproduce
the above copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the distribution. 

Neither the name of the National University of University nor the names of its contributors
may be used to endorse or promote products derived from this software without specific
prior written permission from the National University of Singapore. 

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO THE IMPLIED WARRANTIES 
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.

*/

#include <device_functions.h>

#include "EDT\pba2D.h"

// Parameters for CUDA kernel executions
#define BLOCKX		16
#define BLOCKY		16
#define BLOCKSIZE	64
#define TILE_DIM	16
#define BLOCK_ROWS	8

/****** Global Variables *******/
short2 **pbaTextures;       // Two textures used to compute 2D Voronoi Diagram
short2 *pbaTransposed;

int pbaMemSize;             // Size (in bytes) of a texture
int pbaTexWidth;             // Texture size (squared texture)
int pbaTexHeight;             // Texture size (squared texture)

texture<short2> pbaTexColor; 
texture<short2> pbaTexLinks; 
texture<float4, cudaTextureType2D, cudaReadModeElementType> pbaImage;
texture<float4, cudaTextureType2D, cudaReadModeElementType> pbaGlobalPosition;
cudaArray* arrayDevice[2];
float* GPUNormalizedEDTImage;

/********* Kernels ********/
#include "EDT\pba2DKernel.h"

///////////////////////////////////////////////////////////////////////////
//
// Initialize necessary memory for 2D Voronoi Diagram computation
// - textureSize: The size of the Discrete Voronoi Diagram (width = height)
//
///////////////////////////////////////////////////////////////////////////
void pba2DInitialization(int textureWidth, int textureHeight)
{
    pbaTexWidth = textureWidth;
	pbaTexHeight = textureHeight; 
    pbaMemSize = pbaTexWidth * pbaTexHeight * sizeof(short2); 

    pbaTextures = (short2 **) malloc(2 * sizeof(short2 *)); 

    // Allocate 2 textures
    cudaMalloc((void **) &pbaTextures[0], pbaMemSize); 
    cudaMalloc((void **) &pbaTextures[1], pbaMemSize); 
	cudaMalloc((void **) &pbaTransposed, pbaMemSize);
	cudaMalloc(&GPUNormalizedEDTImage, pbaTexWidth * pbaTexHeight * 4 * sizeof(float));
	
}

///////////////////////////////////////////////////////////////////////////
//
// Deallocate all allocated memory
//
///////////////////////////////////////////////////////////////////////////
void pba2DDeinitialization()
{
    cudaFree(pbaTextures[0]); 
    cudaFree(pbaTextures[1]); 
	cudaFree(pbaTransposed);
	cudaFree(GPUNormalizedEDTImage);
    free(pbaTextures); 
}

// Copy input to GPU 
void pba2DInitializeInput(short *input)
{
    cudaMemcpy(pbaTextures[0], input, pbaMemSize, cudaMemcpyHostToDevice); 
}

void pba2DInitializeInput(float siteValue)
{
	initializeInput<<<(int)ceilf((pbaTexWidth * pbaTexHeight)/512), 512>>>(pbaTextures[0], pbaTexHeight, pbaTexWidth, siteValue);
}

// In-place transpose a squared texture. 
// Block orders are modified to optimize memory access. 
// Point coordinates are also swapped. 
void pba2DTranspose(short2 *output, short2 *input, int pbaTempWidth, int pbaTempHeight)
{
    dim3 block(TILE_DIM, BLOCK_ROWS); 
    dim3 grid(pbaTempWidth / TILE_DIM, pbaTempHeight / TILE_DIM); 
	//cudaBindTexture(0, pbaTexColor, pbaTextures[1]); 
    kernelTranspose<<< grid, block>>>(output, input, pbaTempWidth, pbaTempHeight); 
	//kernelTranspose<<<grid, block>>>(pbaTextures[1], pbaTempWidth);
	//cudaUnbindTexture(pbaTexColor); 

}

// Phase 1 of PBA. m1 must divides texture size
void pba2DPhase1(int m1) 
{
    dim3 block = dim3(BLOCKSIZE);   
    dim3 grid = dim3(pbaTexWidth / block.x, m1); 

    // Flood vertically in their own bands
    cudaBindTexture(0, pbaTexColor, pbaTextures[0]); 
    kernelFloodDown<<< grid, block>>>(pbaTextures[1], pbaTexWidth, pbaTexHeight / m1); 
    cudaUnbindTexture(pbaTexColor); 

    cudaBindTexture(0, pbaTexColor, pbaTextures[1]); 
    kernelFloodUp<<< grid, block>>>(pbaTextures[1], pbaTexWidth, pbaTexHeight / m1); 

    // Passing information between bands
    grid = dim3(pbaTexWidth / block.x, m1); 
    kernelPropagateInterband<<< grid, block>>>(pbaTextures[0], pbaTexWidth, pbaTexHeight / m1); 

    cudaBindTexture(0, pbaTexLinks, pbaTextures[0]); 
    kernelUpdateVertical<<< grid, block>>>(pbaTextures[1], pbaTexWidth, m1, pbaTexHeight / m1); 
    cudaUnbindTexture(pbaTexLinks); 
    cudaUnbindTexture(pbaTexColor); 
}

// Phase 2 of PBA. m2 must divides texture size
void pba2DPhase2(int m2) 
{
    // Compute proximate points locally in each band
    dim3 block = dim3(BLOCKSIZE);   
    dim3 grid = dim3(pbaTexHeight / block.x, m2); 
    cudaBindTexture(0, pbaTexColor, pbaTransposed); 
    //cudaBindTexture(0, pbaTexColor, pbaTextures[1]);
	kernelProximatePoints<<< grid, block>>>(pbaTextures[0], pbaTexHeight, pbaTexWidth / m2); 
	
    cudaBindTexture(0, pbaTexLinks, pbaTextures[0]); 
    kernelCreateForwardPointers<<< grid, block>>>(pbaTextures[0], pbaTexHeight, pbaTexWidth / m2); 
	
    // Repeatly merging two bands into one
    for (int noBand = m2; noBand > 1; noBand /= 2) {
        grid = dim3(pbaTexHeight / block.x, noBand / 2); 
        kernelMergeBands<<< grid, block>>>(pbaTextures[0], pbaTexHeight, pbaTexWidth / noBand); 
    }
	
    // Replace the forward link with the X coordinate of the seed to remove
    // the need of looking at the other texture. We need it for coloring.
    grid = dim3(pbaTexWidth / block.x, pbaTexWidth); 
    kernelDoubleToSingleList<<< grid, block>>>(pbaTextures[0], pbaTexHeight); 
	
    cudaUnbindTexture(pbaTexLinks); 
    cudaUnbindTexture(pbaTexColor); 
	
}

// Phase 3 of PBA. m3 must divides texture size
void pba2DPhase3(int m3) 
{
    dim3 block = dim3(BLOCKSIZE / m3, m3); 
    dim3 grid = dim3(pbaTexHeight / block.x); 
    //dim3 block = dim3(BLOCKSIZE);   
    //dim3 grid = dim3(pbaTexHeight / block.x, m3); 

	cudaBindTexture(0, pbaTexColor, pbaTextures[0]); 
    kernelColor<<< grid, block>>>(pbaTransposed, pbaTexHeight, pbaTexWidth); 
    //kernelColor<<< grid, block>>>(pbaTextures[1], pbaTexHeight);
	cudaUnbindTexture(pbaTexColor); 
}

void pba2DCompute(int floodBand, int maurerBand, int colorBand)
{
    // Vertical sweep
    pba2DPhase1(floodBand); 

    pba2DTranspose(pbaTransposed, pbaTextures[1], pbaTexWidth, pbaTexHeight); 
	
    // Horizontal coloring
    pba2DPhase2(maurerBand); 

    // Color the rows. 
    pba2DPhase3(colorBand); 
	
    pba2DTranspose(pbaTextures[1], pbaTransposed, pbaTexHeight, pbaTexWidth);    
	
}

void pba2DNormalizeEDT(float shadowIntensity) {

	pbaNormalizeDistanceTransform<<<(int)ceilf(pbaTexWidth * pbaTexHeight/512), 512>>>(pbaTextures[1], GPUNormalizedEDTImage, pbaTexWidth, shadowIntensity);
	cudaMemcpyToArray(arrayDevice[0], 0, 0, GPUNormalizedEDTImage, pbaTexWidth * pbaTexHeight * 4 * sizeof(float), cudaMemcpyDeviceToDevice);

}

void pba2DEDT(float shadowIntensity) {

	pba2DEDTKernel<<<(int)ceilf(pbaTexWidth * pbaTexHeight/512), 512>>>(pbaTextures[1], GPUNormalizedEDTImage, pbaTexWidth, shadowIntensity);
	cudaMemcpyToArray(arrayDevice[0], 0, 0, GPUNormalizedEDTImage, pbaTexWidth * pbaTexHeight * 4 * sizeof(float), cudaMemcpyDeviceToDevice);

}

// Compute 2D Voronoi diagram
// Input: a 2D texture. Each pixel is represented as two "short" integer. 
//    For each site at (x, y), the pixel at coordinate (x, y) should contain 
//    the pair (x, y). Pixels that are not sites should contain the pair (MARKER, MARKER)
// See original paper for the effect of the three parameters: 
//    phase1Band, phase2Band, phase3Band
// Parameters must divide textureSize
void pba2DVoronoiDiagram(int floodBand, int maurerBand, int colorBand, float shadowIntensity) 
{

	//Initialize sites
	pba2DInitializeInput(0.0);

	// Compute umbra EDT
    pba2DCompute(floodBand, maurerBand, colorBand); 

	// Copy back to an umbra EDT image
	pba2DEDT(shadowIntensity);

	/*   
	// Initialize umbra sites
    pba2DInitializeInput(0.0); 

    // Compute umbra EDT
    pba2DCompute(floodBand, maurerBand, colorBand); 

	// Copy back to an umbra EDT image
	pba2DEDT(shadowIntensity);

	// Initialize lit sites
	pba2DInitializeInput(1.0);

	// Compute lit EDT
    pba2DCompute(floodBand, maurerBand, colorBand); 

	// Normalize EDT
	pba2DNormalizeEDT(shadowIntensity);
	*/

}

void pbaCudaBindTexture(cudaGraphicsResource_t *resource) {

	cudaGraphicsMapResources(2, resource);

	cudaGraphicsSubResourceGetMappedArray(&arrayDevice[0], resource[0], 0, 0);
	cudaBindTextureToArray(pbaImage, arrayDevice[0] );

	cudaGraphicsSubResourceGetMappedArray(&arrayDevice[1], resource[1], 0, 0);
	cudaBindTextureToArray(pbaGlobalPosition, arrayDevice[1] );

}

void pbaCudaUnbindTexture(cudaGraphicsResource_t *resource) {

	cudaUnbindTexture(pbaImage);
	cudaUnbindTexture(pbaGlobalPosition);
	cudaGraphicsUnmapResources(2, resource);

}