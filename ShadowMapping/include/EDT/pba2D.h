/*
Author: Cao Thanh Tung
Date: 21/01/2010

File Name: pba2D.h

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

#ifndef __CUDA_H__
#define __CUDA_H__

#include <stdio.h>
// Initialize CUDA and allocate memory
// textureSize is 2^k with k >= 6
extern "C" void pba2DInitialization(int textureWidth, int textureHeight); 
extern "C" void pba2DDeinitialization(); 
extern "C" void pba2DVoronoiDiagram(int phase1Band, int phase2Band, int phase3Band);
extern "C" void pbaCudaBindTexture(cudaGraphicsResource_t *resource);
extern "C" void pbaCudaUnbindTexture(cudaGraphicsResource_t *resource);
extern "C" void pbaNormalizeEDT(float *normalizedEDTImage, float penumbraSize, float shadowIntensity);

// MARKER is used to mark blank pixels in the texture. 
// Any uncolored pixels will have x = MARKER. 
// Input texture should have x = MARKER for all pixels other than sites
#define MARKER      -32768

#endif
