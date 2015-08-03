#ifndef MESH_H
#define MESH_H

#include <malloc.h>
#include <fstream>
#include <string>
#include <sstream>
#include <vector>
#include <iostream>
#include "glm/glm.hpp"
#include "glm/gtc/matrix_transform.hpp"
#include "glm/gtx/transform2.hpp"
#include "IO/OBJLoader.h"
#include "Image.h"

class Mesh
{
public:
	Mesh();
	Mesh(int numberOfPoints, int numberOfTriangles);
	~Mesh();
	
	void addObject(Mesh *mesh);
	void computeNormals();
	void computeCentroid(float *centroid);
	void loadOBJFile(char *filename);
	void loadTexture(char *filename, int ID);
	void loadColorFromOBJFile(char *filename);
	void translate(float x, float y, float z);
	void scale(float x, float y, float z);
	void rotate(float x, float y, float z);
	
	void setBaseColor(float r, float g, float b);
	
	float* getPointCloud() { return pointCloud; }
	float* getNormalVector() { return normalVector; }
	float* getTextureCoords() { return textureCoords; }
	float* getColors() { return colors; }
	int* getIndices() { return indices; }
	Image** getTexture() { return textures; }

	int getPointCloudSize() { return pointCloudSize; }
	int getIndicesSize() { return indicesSize; }
	int getTextureCoordsSize() { return textureCoordsSize; }
	int getColorsSize() { return colorsSize; }
	int getNumberOfTextures() { return numberOfTextures; }
	int getNumberOfTriangles() { return indicesSize/3; }
	bool textureFromImage() { return isTextureFromImage; }

private:
	float *pointCloud;
	float *normalVector;
	float *textureCoords;
	float *colors;
	int *indices;
	
	Image **textures;

	int pointCloudSize;
	int indicesSize;
	int textureCoordsSize;
	int colorsSize;
	int numberOfTextures;
	bool isTextureFromImage;
	
};

#endif