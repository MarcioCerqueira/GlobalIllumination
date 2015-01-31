#include "Mesh.h"

Mesh::Mesh() 
{
	pointCloud = NULL;
	normalVector = NULL;
	indices = NULL;
}

Mesh::~Mesh()
{

	delete [] pointCloud;
	delete [] normalVector;
	delete [] indices;

}

void Mesh::addObject(Mesh *mesh) 
{

	if(pointCloud == NULL) {
		
		pointCloudSize = mesh->getPointCloudSize();
		indicesSize = mesh->getIndicesSize();

		pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
		normalVector = (float*)malloc(pointCloudSize * sizeof(float));
		indices = (int*)malloc(indicesSize * sizeof(int));

		for(int point = 0; point < pointCloudSize; point++)
			pointCloud[point] = mesh->getPointCloud()[point];

		for(int point = 0; point < pointCloudSize; point++)
			normalVector[point] = mesh->getNormalVector()[point];

		for(int index = 0; index < indicesSize; index++)
			indices[index] = mesh->getIndices()[index];
	
	} else {
		
		int prevPointCloudSize = pointCloudSize;
		int prevIndicesSize = indicesSize;

		float *prevPointCloud = (float*)malloc(pointCloudSize * sizeof(float));
		float *prevNormalVector = (float*)malloc(pointCloudSize * sizeof(float));
		int *prevIndices = (int*)malloc(indicesSize * sizeof(int));

		for(int point = 0; point < pointCloudSize; point++)
			prevPointCloud[point] = pointCloud[point];

		for(int point = 0; point < pointCloudSize; point++)
			prevNormalVector[point] = normalVector[point];

		for(int index = 0; index < indicesSize; index++)
			prevIndices[index] = indices[index];
	
		delete [] pointCloud;
		delete [] normalVector;
		delete [] indices;

		pointCloudSize = prevPointCloudSize + mesh->getPointCloudSize();
		indicesSize = prevIndicesSize + mesh->getIndicesSize();

		pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
		normalVector = (float*)malloc(pointCloudSize * sizeof(float));
		indices = (int*)malloc(indicesSize * sizeof(int));

		for(int point = 0; point < prevPointCloudSize; point++)
			pointCloud[point] = prevPointCloud[point];

		for(int point = 0; point < prevPointCloudSize; point++)
			normalVector[point] = prevNormalVector[point];

		for(int index = 0; index < prevIndicesSize; index++)
			indices[index] = prevIndices[index];
	
		for(int point = prevPointCloudSize; point < pointCloudSize; point++)
			pointCloud[point] = mesh->getPointCloud()[point - prevPointCloudSize];

		for(int point = prevPointCloudSize; point < pointCloudSize; point++)
			normalVector[point] = mesh->getNormalVector()[point - prevPointCloudSize];

		for(int index = prevIndicesSize; index < indicesSize; index++)
			indices[index] = mesh->getIndices()[index - prevIndicesSize] + prevPointCloudSize/3;
	
		delete [] prevPointCloud;
		delete [] prevNormalVector;
		delete [] prevIndices;

	}
	
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

void Mesh::computeNormals()
{

	std::vector <int> nb_seen;
	nb_seen.resize(pointCloudSize/3);

	for(int i = 0; i < indicesSize; i+=3) {
		int a = indices[i + 0];
		int b = indices[i + 1];
		int c = indices[i + 2];
		glm::vec3 normal = glm::normalize(glm::cross(
			glm::vec3(pointCloud[b * 3 + 0], pointCloud[b * 3 + 1], pointCloud[b * 3 + 2]) - 
			glm::vec3(pointCloud[a * 3 + 0], pointCloud[a * 3 + 1], pointCloud[a * 3 + 2]),
			glm::vec3(pointCloud[c * 3 + 0], pointCloud[c * 3 + 1], pointCloud[c * 3 + 2]) - 
			glm::vec3(pointCloud[a * 3 + 0], pointCloud[a * 3 + 1], pointCloud[a * 3 + 2])));

		int v[3];  v[0] = a;  v[1] = b;  v[2] = c;
		for(int j = 0; j < 3; j++) {
			
			int cur_v = v[j];
			nb_seen[cur_v]++;
			if(nb_seen[cur_v] == 1) {
				normalVector[cur_v * 3 + 0] = normal.x;
				normalVector[cur_v * 3 + 1] = normal.y;
				normalVector[cur_v * 3 + 2] = normal.z;
			} else {
				normalVector[cur_v * 3 + 0] = normalVector[cur_v * 3 + 0] * (1.0 - 1.0/nb_seen[cur_v]) + normal.x * 1.0/nb_seen[cur_v];
				normalVector[cur_v * 3 + 1] = normalVector[cur_v * 3 + 1] * (1.0 - 1.0/nb_seen[cur_v]) + normal.y * 1.0/nb_seen[cur_v];
				normalVector[cur_v * 3 + 2] = normalVector[cur_v * 3 + 2] * (1.0 - 1.0/nb_seen[cur_v]) + normal.z * 1.0/nb_seen[cur_v];
			
			}

		}		

	}

}

void Mesh::loadOBJFile(char *filename)
{

	GLMmodel *model = glmReadOBJ(filename);
	
	pointCloudSize = model->numvertices * 3;
	indicesSize = model->numtriangles * 3;

	pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
	normalVector = (float*)malloc(pointCloudSize * sizeof(float));
	indices = (int*)malloc(indicesSize * sizeof(int));

	for(int point = 0; point < pointCloudSize/3; point++) {
		
		pointCloud[point * 3 + 0] = model->vertices[(point + 1) * 3 + 0];
		pointCloud[point * 3 + 1] = model->vertices[(point + 1) * 3 + 1];
		pointCloud[point * 3 + 2] = model->vertices[(point + 1) * 3 + 2];
	
	}
	
	for(int normal = 0; normal < pointCloudSize/3; normal++) {
		
		normalVector[normal * 3 + 0] = model->normals[(normal + 1) * 3 + 0];
		normalVector[normal * 3 + 1] = model->normals[(normal + 1) * 3 + 1];
		normalVector[normal * 3 + 2] = model->normals[(normal + 1) * 3 + 2];
	
	}

	for(int indice = 0; indice < indicesSize/3; indice++) {
		indices[indice * 3 + 0] = model->triangles[indice].vindices[0] - 1;
		indices[indice * 3 + 1] = model->triangles[indice].vindices[1] - 1;
		indices[indice * 3 + 2] = model->triangles[indice].vindices[2] - 1;
	
	}

	delete model;

}

void Mesh::translate(float value, bool x, bool y, bool z) {

	for(int point = 0; point < pointCloudSize/3; point++) {
		
		if(x) pointCloud[point * 3 + 0] += value;
		if(y) pointCloud[point * 3 + 1] += value;
		if(z) pointCloud[point * 3 + 2] += value;
	
	}

}

void Mesh::scale(float value) {

	for(int point = 0; point < pointCloudSize/3; point++) {
		
		pointCloud[point * 3 + 0] *= value;
		pointCloud[point * 3 + 1] *= value;
		pointCloud[point * 3 + 2] *= value;
	
	}

}
