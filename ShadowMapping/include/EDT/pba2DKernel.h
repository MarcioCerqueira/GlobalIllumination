/*
Author: Cao Thanh Tung
Date: 21/01/2010

File Name: pba2DKernel.h

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

#define TOID(x, y, size)    (__mul24((y), (size)) + (x))

__global__ void kernelTranspose(short2 *data, int size)
{
    __shared__ short2 block1[TILE_DIM][TILE_DIM + 1];
    __shared__ short2 block2[TILE_DIM][TILE_DIM + 1];

    int blockIdx_y = blockIdx.x;
    int blockIdx_x = blockIdx.x+blockIdx.y;

    if (blockIdx_x >= gridDim.x)
        return ; 

    int blkX, blkY, x, y, id1, id2; 
    short2 pixel; 

    blkX = __mul24(blockIdx_x, TILE_DIM); 
    blkY = __mul24(blockIdx_y, TILE_DIM); 

    x = blkX + threadIdx.x;
    y = blkY + threadIdx.y;
    id1 = __mul24(y, size) + x;

    x = blkY + threadIdx.x;
    y = blkX + threadIdx.y;
    id2 = __mul24(y, size) + x;

    // read the matrix tile into shared memory
    for (int i = 0; i < TILE_DIM; i += BLOCK_ROWS) {
        block1[threadIdx.y + i][threadIdx.x] = tex1Dfetch(pbaTexColor, id1 + __mul24(i, size));
        block2[threadIdx.y + i][threadIdx.x] = tex1Dfetch(pbaTexColor, id2 + __mul24(i, size));
    }

    __syncthreads();

    // write the transposed matrix tile to global memory
    for (int i = 0; i < TILE_DIM; i += BLOCK_ROWS) {
        pixel = block1[threadIdx.x][threadIdx.y + i];
        data[id2 + __mul24(i, size)] = make_short2(pixel.y, pixel.x); 
        pixel = block2[threadIdx.x][threadIdx.y + i];
        data[id1 + __mul24(i, size)] = make_short2(pixel.y, pixel.x); 
    }
}


__global__ void kernelTranspose(short2 *odata, short2 *idata, int width, int height)
{
    __shared__ short2 tile[TILE_DIM][TILE_DIM+1];

    int xIndex = blockIdx.x * TILE_DIM + threadIdx.x;
    int yIndex = blockIdx.y * TILE_DIM + threadIdx.y;
    int index_in = xIndex + (yIndex)*width;

    xIndex = blockIdx.y * TILE_DIM + threadIdx.x;
    yIndex = blockIdx.x * TILE_DIM + threadIdx.y;
    int index_out = xIndex + (yIndex)*height;

    for (int i=0; i<TILE_DIM; i+=BLOCK_ROWS) tile[threadIdx.y+i][threadIdx.x] = idata[index_in+i*width];

    __syncthreads();

    for (int i=0; i<TILE_DIM; i+=BLOCK_ROWS) {
		short2 pixel = tile[threadIdx.x][threadIdx.y+i]; 
		odata[index_out+i*height] = make_short2(pixel.y, pixel.x);
	}

}

__global__ void kernelFloodDown(short2 *output, int size, int bandSize) 
{
    int tx = blockIdx.x * blockDim.x + threadIdx.x; //X
    int ty = blockIdx.y * bandSize; //band Y
    int id = TOID(tx, ty, size); 

    short2 pixel1, pixel2; 

    pixel1 = make_short2(MARKER, MARKER); 

    for (int i = 0; i < bandSize; i++, id += size) {
        pixel2 = tex1Dfetch(pbaTexColor, id); 

        if (pixel2.x != MARKER) 
            pixel1 = pixel2; 

        output[id] = pixel1; 
    }
}

__global__ void kernelFloodUp(short2 *output, int size, int bandSize) 
{
    int tx = blockIdx.x * blockDim.x + threadIdx.x; 
    int ty = (blockIdx.y+1) * bandSize - 1; 
    int id = TOID(tx, ty, size); 

    short2 pixel1, pixel2; 
    int dist1, dist2; 

    pixel1 = make_short2(MARKER, MARKER); 

    for (int i = 0; i < bandSize; i++, id -= size) {
        dist1 = abs(pixel1.y - ty + i); 

        pixel2 = tex1Dfetch(pbaTexColor, id); 
        dist2 = abs(pixel2.y - ty + i); 

        if (dist2 < dist1) 
            pixel1 = pixel2; 

        output[id] = pixel1; 
    }
}

__global__ void kernelPropagateInterband(short2 *output, int size, int bandSize) 
{
    int tx = blockIdx.x * blockDim.x + threadIdx.x; 
    int inc = __mul24(bandSize, size); 
    int ny, nid, nDist; 
    short2 pixel; 

    // Top row, look backward
    int ty = __mul24(blockIdx.y, bandSize); 
    int topId = TOID(tx, ty, size); 
    int bottomId = TOID(tx, ty + bandSize - 1, size); 

    pixel = tex1Dfetch(pbaTexColor, topId); 
    int myDist = abs(pixel.y - ty); 

    for (nid = bottomId - inc; nid >= 0; nid -= inc) {
        pixel = tex1Dfetch(pbaTexColor, nid); 

        if (pixel.x != MARKER) { 
            nDist = abs(pixel.y - ty); 

            if (nDist < myDist) 
                output[topId] = pixel; 

            break;	
        }
    }

    // Last row, look downward
    ty = ty + bandSize - 1; 
    pixel = tex1Dfetch(pbaTexColor, bottomId); 
    myDist = abs(pixel.y - ty); 

    for (ny = ty + 1, nid = topId + inc; ny < size; ny += bandSize, nid += inc) {
        pixel = tex1Dfetch(pbaTexColor, nid); 

        if (pixel.x != MARKER) { 
            nDist = abs(pixel.y - ty); 

            if (nDist < myDist) 
                output[bottomId] = pixel; 

            break; 
        }
    }
}

__global__ void kernelUpdateVertical(short2 *output, int size, int band, int bandSize) 
{
    int tx = blockIdx.x * blockDim.x + threadIdx.x; 
    int ty = blockIdx.y * bandSize; 

    short2 top = tex1Dfetch(pbaTexLinks, TOID(tx, ty, size)); 
    short2 bottom = tex1Dfetch(pbaTexLinks, TOID(tx, ty + bandSize - 1, size)); 
    short2 pixel; 

    int dist, myDist; 

    int id = TOID(tx, ty, size); 

    for (int i = 0; i < bandSize; i++, id += size) {
        pixel = tex1Dfetch(pbaTexColor, id); 
        myDist = abs(pixel.y - (ty + i)); 

        dist = abs(top.y - (ty + i)); 
        if (dist < myDist) { myDist = dist; pixel = top; }

        dist = abs(bottom.y - (ty + i)); 
        if (dist < myDist) pixel = bottom; 

        output[id] = pixel; 
    }
}

// Input: y1 < y2
__device__ float interpoint(int x1, int y1, int x2, int y2, int x0) 
{
    float xM = float(x1 + x2) / 2.0f; 
    float yM = float(y1 + y2) / 2.0f; 
    float nx = x2 - x1; 
    float ny = y2 - y1; 

    return yM + nx * (xM - x0) / ny; 
}

__global__ void kernelProximatePoints(short2 *stack, int size, int bandSize) 
{
    int tx = __mul24(blockIdx.x, blockDim.x) + threadIdx.x; 
    int ty = __mul24(blockIdx.y, bandSize); 
    int id = TOID(tx, ty, size); 
    int lasty = -1; 
    short2 last1, last2, current; 
    float i1, i2;     

    last1.y = -1; last2.y = -1; 

    for (int i = 0; i < bandSize; i++, id += size) {
        current = tex1Dfetch(pbaTexColor, id);

        if (current.x != MARKER) {
            while (last2.y >= 0) {
                i1 = interpoint(last1.x, last2.y, last2.x, lasty, tx); 
                i2 = interpoint(last2.x, lasty, current.x, current.y, tx); 

                if (i1 < i2) 
                    break;

                lasty = last2.y; last2 = last1; 

                if (last1.y >= 0)
                    last1 = stack[TOID(tx, last1.y, size)]; 
            }

            last1 = last2; last2 = make_short2(current.x, lasty); lasty = current.y; 

            stack[id] = last2;
        }
    }

    // Store the pointer to the tail at the last pixel of this band
    if (lasty != ty + bandSize - 1) 
        stack[TOID(tx, ty + bandSize - 1, size)] = make_short2(MARKER, lasty); 
}

__global__ void kernelCreateForwardPointers(short2 *output, int size, int bandSize) 
{
    int tx = __mul24(blockIdx.x, blockDim.x) + threadIdx.x; 
    int ty = __mul24(blockIdx.y+1, bandSize) - 1; 
    int id = TOID(tx, ty, size); 
    int lasty = -1, nexty; 
    short2 current; 

    // Get the tail pointer
    current = tex1Dfetch(pbaTexLinks, id); 

    if (current.x == MARKER)
        nexty = current.y; 
    else
        nexty = ty; 

    for (int i = 0; i < bandSize; i++, id -= size)
        if (ty - i == nexty) {
            current = make_short2(lasty, tex1Dfetch(pbaTexLinks, id).y);
            output[id] = current; 

            lasty = nexty; 
            nexty = current.y; 
        }

        // Store the pointer to the head at the first pixel of this band
        if (lasty != ty - bandSize + 1) 
            output[id + size] = make_short2(lasty, MARKER);  
}

__global__ void kernelMergeBands(short2 *output, int size, int bandSize)
{
    int tx = __mul24(blockIdx.x, blockDim.x) + threadIdx.x; 
    int band1 = blockIdx.y * 2; 
    int band2 = band1 + 1; 
    int firsty, lasty; 
    short2 last1, last2, current; 
    // last1 and last2: x component store the x coordinate of the site, 
    // y component store the backward pointer
    // current: y component store the x coordinate of the site, 
    // x component store the forward pointer

    // Get the two last items of the first list
    lasty = __mul24(band2, bandSize) - 1; 
    last2 = make_short2(tex1Dfetch(pbaTexColor, TOID(tx, lasty, size)).x, 
        tex1Dfetch(pbaTexLinks, TOID(tx, lasty, size)).y); 

    if (last2.x == MARKER) {
        lasty = last2.y; 

        if (lasty >= 0) 
            last2 = make_short2(tex1Dfetch(pbaTexColor, TOID(tx, lasty, size)).x, 
            tex1Dfetch(pbaTexLinks, TOID(tx, lasty, size)).y); 
        else
            last2 = make_short2(MARKER, MARKER); 
    }

    if (last2.y >= 0) {
        // Second item at the top of the stack
        last1 = make_short2(tex1Dfetch(pbaTexColor, TOID(tx, last2.y, size)).x, 
            tex1Dfetch(pbaTexLinks, TOID(tx, last2.y, size)).y); 
    }

    // Get the first item of the second band
    firsty = __mul24(band2, bandSize); 
    current = make_short2(tex1Dfetch(pbaTexLinks, TOID(tx, firsty, size)).x, 
        tex1Dfetch(pbaTexColor, TOID(tx, firsty, size)).x); 

    if (current.y == MARKER) {
        firsty = current.x; 

        if (firsty >= 0) 
            current = make_short2(tex1Dfetch(pbaTexLinks, TOID(tx, firsty, size)).x, 
            tex1Dfetch(pbaTexColor, TOID(tx, firsty, size)).x); 
        else
            current = make_short2(MARKER, MARKER); 
    }

    float i1, i2;     

    // Count the number of item in the second band that survive so far. 
    // Once it reaches 2, we can stop. 
    int top = 0; 

    while (top < 2 && current.y >= 0) {
        // While there's still something on the left
        while (last2.y >= 0) {
            i1 = interpoint(last1.x, last2.y, last2.x, lasty, tx); 
            i2 = interpoint(last2.x, lasty, current.y, firsty, tx);

            if (i1 < i2) 
                break; 

            lasty = last2.y; last2 = last1; 
            top--; 

            if (last1.y >= 0) 
                last1 = make_short2(tex1Dfetch(pbaTexColor, TOID(tx, last1.y, size)).x, 
                output[TOID(tx, last1.y, size)].y); 
        }

        // Update the current pointer 
        output[TOID(tx, firsty, size)] = make_short2(current.x, lasty); 

        if (lasty >= 0) 
            output[TOID(tx, lasty, size)] = make_short2(firsty, last2.y); 

        last1 = last2; last2 = make_short2(current.y, lasty); lasty = firsty; 
        firsty = current.x; 

        top = max(1, top + 1); 

        // Advance the current pointer to the next one
        if (firsty >= 0) 
            current = make_short2(tex1Dfetch(pbaTexLinks, TOID(tx, firsty, size)).x, 
            tex1Dfetch(pbaTexColor, TOID(tx, firsty, size)).x); 
        else
            current = make_short2(MARKER, MARKER); 
    }

    // Update the head and tail pointer. 
    firsty = __mul24(band1, bandSize); 
    lasty = __mul24(band2, bandSize); 
    current = tex1Dfetch(pbaTexLinks, TOID(tx, firsty, size)); 

    if (current.y == MARKER && current.x < 0) {	// No head?
        last1 = tex1Dfetch(pbaTexLinks, TOID(tx, lasty, size)); 

        if (last1.y == MARKER)
            current.x = last1.x; 
        else
            current.x = lasty; 

        output[TOID(tx, firsty, size)] = current; 
    }

    firsty = __mul24(band1, bandSize) + bandSize - 1; 
    lasty = __mul24(band2, bandSize) + bandSize - 1; 
    current = tex1Dfetch(pbaTexLinks, TOID(tx, lasty, size)); 

    if (current.x == MARKER && current.y < 0) {	// No tail?
        last1 = tex1Dfetch(pbaTexLinks, TOID(tx, firsty, size)); 

        if (last1.x == MARKER) 
            current.y = last1.y; 
        else
            current.y = firsty; 

        output[TOID(tx, lasty, size)] = current; 
    }
}

__global__ void kernelDoubleToSingleList(short2 *output, int size)
{
    int tx = __mul24(blockIdx.x, blockDim.x) + threadIdx.x; 
    int ty = blockIdx.y; 
    int id = TOID(tx, ty, size); 

    output[id] = make_short2(tex1Dfetch(pbaTexColor, id).x, tex1Dfetch(pbaTexLinks, id).y); 
}

__global__ void kernelColor(short2 *output, int size, int height) 
{
    __shared__ short2 s_last1[BLOCKSIZE], s_last2[BLOCKSIZE]; 
    __shared__ int s_lasty[BLOCKSIZE]; 

    int col = threadIdx.x; 
    int tid = threadIdx.y; 
    int tx = __mul24(blockIdx.x, blockDim.x) + col; 
    int dx, dy, lasty; 
    unsigned int best, dist; 
    short2 last1, last2; 

    if (tid == blockDim.y - 1) {
        lasty = size - 1; 

        last2 = tex1Dfetch(pbaTexColor, __mul24(lasty, size) + tx); 

        if (last2.x == MARKER) {
            lasty = last2.y; 
            last2 = tex1Dfetch(pbaTexColor, __mul24(lasty, size) + tx); 
        }

        if (last2.y >= 0) 
            last1 = tex1Dfetch(pbaTexColor, __mul24(last2.y, size) + tx); 

        s_last1[col] = last1; s_last2[col] = last2; s_lasty[col] = lasty; 
    }

    __syncthreads(); 

    for (int ty = size - 1 - tid; ty >= 0; ty -= blockDim.y) {
        last1 = s_last1[col]; last2 = s_last2[col]; lasty = s_lasty[col]; 

        dx = last2.x - tx; dy = lasty - ty; 
        best = dist = __mul24(dx, dx) + __mul24(dy, dy); 

        while (last2.y >= 0) {
            dx = last1.x - tx; dy = last2.y - ty; 
            dist = __mul24(dx, dx) + __mul24(dy, dy); 

            if (dist > best) 
                break; 

            best = dist; lasty = last2.y; last2 = last1;

            if (last2.y >= 0) 
                last1 = tex1Dfetch(pbaTexColor, __mul24(last2.y, size) + tx); 
        }

        __syncthreads(); 

        output[TOID(tx, ty, size)] = make_short2(last2.x, lasty);

        if (tid == blockDim.y - 1) {
            s_last1[col] = last1; s_last2[col] = last2; s_lasty[col] = lasty; 
        }

        __syncthreads(); 
    }
}

__device__ float linearize(float depth) {

	float n = float(1.0);
	float f = float(1000.0);
	depth = (2.0 * n) / (f + n - depth * (f - n));
	return depth;

}


__global__ void initializeInput(short2 *output, int rows, int cols) {

	
	int pixel = blockIdx.x * blockDim.x + threadIdx.x;
	int px = pixel % cols;
	int py = pixel / cols;
	float4 imagePixel = tex2D(pbaImage, px, py);

	for(int x = -1; x <= 1; x++) {
		for(int y = -1; y <= 1; y++) {
			if(px + x >= 0 && px + x < cols && py + y >= 0 && py + y < rows) {
				float4 p = tex2D(pbaImage, px + x, py + y);
				if(p.x != imagePixel.x && abs(linearize(imagePixel.y) - linearize(p.y)) <= 0.0025 && p.z == 1.0) {
					output[pixel] = make_short2(px, py);
					return;
				}
			}
		}
	}
	
	output[pixel] = make_short2(MARKER, MARKER);

}

__device__ float pbaComputeEuclideanDistance(int sitePixel, int pixel, int cols) {

	int sx = sitePixel % cols;
	int sy = sitePixel / cols;
	int px = pixel % cols;
	int py = pixel / cols;
	return sqrtf((sx - px) * (sx - px) + (sy - py) * (sy - py));

}

template <typename T> __host__ __device__ inline T plerp(T v0, T v1, T t) {
    return (1-t)*v0 + t*v1;
}

__global__ void pbaNormalizeDistanceTransform(short2 *umbraNearestSite, float *normalizedEDTImage, float penumbraSize, int cols, float shadowIntensity) {

	int pixel = blockIdx.x * blockDim.x + threadIdx.x;
	short2 nearestSite = umbraNearestSite[pixel];
	float4 imagePixel = tex2D(pbaImage, pixel % cols, pixel / cols);
	float4 nearestSiteImagePixel = tex2D(pbaImage, nearestSite.x, nearestSite.y);
	float4 p1 = tex2D(pbaGlobalPosition, pixel % cols, pixel / cols);
	float4 p2 = tex2D(pbaGlobalPosition, nearestSite.x, nearestSite.y);
	
	float distance = sqrtf((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) + (p1.z - p2.z) * (p1.z - p2.z));
	//float distance = sqrtf(sqrtf(sqrtf(powf(p1.x - p2.x, 8) + powf(p1.y - p2.y, 8) + powf(p1.z - p2.z, 8))));
	//float distance = pbaComputeEuclideanDistance(nearestSite.y * cols + nearestSite.x, pixel, cols);
	
	if(nearestSiteImagePixel.z != 1.0 || abs(linearize(nearestSiteImagePixel.y) - linearize(imagePixel.y)) > 0.0005 || distance > penumbraSize/2) normalizedEDTImage[pixel * 4 + 0] = imagePixel.x;
	else if(imagePixel.x == shadowIntensity) normalizedEDTImage[pixel * 4 + 0] = plerp<float>(0.5 - distance/penumbraSize, 1.0, shadowIntensity);
	else normalizedEDTImage[pixel * 4 + 0] = plerp<float>(0.5 + distance/penumbraSize, 1.0, shadowIntensity);
	normalizedEDTImage[pixel * 4 + 1] = imagePixel.y;

}
