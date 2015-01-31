#ifndef MESH_H
#define MESH_H

#include <malloc.h>
#include <fstream>
#include <string>
#include <sstream>
#include <vector>
#include "glm/glm.hpp"
#include "Viewers/OBJLoader.h"

class Mesh
{
public:
	Mesh();
	~Mesh();
	
	void addObject(Mesh *mesh);
	void buildCube(float x, float y, float z);
	void buildPlane(float x, float y, float z);
	void computeNormals();
	void loadOBJFile(char *filename);
	void translate(float value, bool x, bool y, bool z);
	void scale(float value);
	
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