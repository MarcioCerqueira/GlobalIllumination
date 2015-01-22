#ifndef MESH_H
#define MESH_H

#include <malloc.h>

class Mesh
{
public:
	Mesh();
	~Mesh();
	void buildCube(float x, float y, float z);
	void buildPlane(float x, float y, float z);
	float* getPointCloud() { return pointCloud; }
	float* getNormalVector() { return normalVector; }
	int* getIndices() { return indices; }
	int getPointCloudSize() { return pointCloudSize; }
	int getIndicesSize() { return indicesSize; }

private:
	float *pointCloud;
	float *normalVector;
	int *indices;
	int pointCloudSize;
	int indicesSize;
};

#endif