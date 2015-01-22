#include "Mesh.h"

Mesh::Mesh() 
{
}

Mesh::~Mesh()
{

	delete [] pointCloud;
	delete [] normalVector;
	delete [] indices;

}

void Mesh::buildCube(float x, float y, float z)
{

	pointCloudSize = 24;
	indicesSize = 36;

	pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
	normalVector = (float*)malloc(pointCloudSize * sizeof(float));
	indices = (int*)malloc(indicesSize * sizeof(int));

	this->pointCloudSize = pointCloudSize;
	this->indicesSize = indicesSize;

	pointCloud[0] = -x;	pointCloud[1] = y;	pointCloud[2] = z;
	pointCloud[3] = -x;	pointCloud[4] = -y;	pointCloud[5] = z;
	pointCloud[6] = x;	pointCloud[7] = -y;	pointCloud[8] = z;
	pointCloud[9] = x;	pointCloud[10] = y;	pointCloud[11] = z;
	pointCloud[12] = -x;	pointCloud[13] = y;	pointCloud[14] = -z;
	pointCloud[15] = -x;	pointCloud[16] = -y;	pointCloud[17] = -z;
	pointCloud[18] = x;	pointCloud[19] = -y;	pointCloud[20] = -z;
	pointCloud[21] = x;	pointCloud[22] = y;	pointCloud[23] = -z;

	normalVector[0] = -x;	normalVector[1] = y;	normalVector[2] = z;
	normalVector[3] = -x;	normalVector[4] = -y;	normalVector[5] = z;
	normalVector[6] = x;	normalVector[7] = -y;	normalVector[8] = z;
	normalVector[9] = x;	normalVector[10] = y;	normalVector[11] = z;
	normalVector[12] = -x;	normalVector[13] = y;	normalVector[14] = -z;
	normalVector[15] = -x;	normalVector[16] = -y;	normalVector[17] = -z;
	normalVector[18] = x;	normalVector[19] = -y;	normalVector[20] = -z;
	normalVector[21] = x;	normalVector[22] = y;	normalVector[23] = -z;

	indices[0] = 0;	indices[1] = 1;	indices[2] = 2;
	indices[3] = 0;	indices[4] = 2;	indices[5] = 3;
	indices[6] = 4;	indices[7] = 5;	indices[8] = 1;
	indices[9] = 4;	indices[10] = 1;	indices[11] = 0;
	indices[12] = 7;	indices[13] = 6;	indices[14] = 5;
	indices[15] = 7;	indices[16] = 5;	indices[17] = 4;
	indices[18] = 3;	indices[19] = 2;	indices[20] = 6;
	indices[21] = 3;	indices[22] = 6;	indices[23] = 7;
	indices[24] = 4;	indices[25] = 0;	indices[26] = 3;
	indices[27] = 4;	indices[28] = 3;	indices[29] = 7;
	indices[30] = 6;	indices[31] = 2;	indices[32] = 1;
	indices[33] = 6;	indices[34] = 1;	indices[35] = 5;

}

void Mesh::buildPlane(float x, float y, float z) 
{

	pointCloudSize = 12;
	indicesSize = 6;

	pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
	normalVector = (float*)malloc(pointCloudSize * sizeof(float));
	indices = (int*)malloc(indicesSize * sizeof(int));

	this->pointCloudSize = pointCloudSize;
	this->indicesSize = indicesSize;

	pointCloud[0] = -x;	pointCloud[1] = +y; pointCloud[2] = -z;
	pointCloud[3] = +x; pointCloud[4] = +y; pointCloud[5] = -z;
	pointCloud[6] = +x; pointCloud[7] = +y; pointCloud[8] = +z;
	pointCloud[9] = -x; pointCloud[10] = +y; pointCloud[11] = +z;

	normalVector[0] = -x; normalVector[1] = +y; normalVector[2] = -z;
	normalVector[3] = +x; normalVector[4] = +y; normalVector[5] = -z;
	normalVector[6] = +x; normalVector[7] = +y; normalVector[8] = +z;
	normalVector[9] = -x; normalVector[10] = +y; normalVector[11] = +z;

	indices[0] = 0; indices[1] = 1; indices[2] = 2;
	indices[3] = 0; indices[4] = 2; indices[5] = 3;

}