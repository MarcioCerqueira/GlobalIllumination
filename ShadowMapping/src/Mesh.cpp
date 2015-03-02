#include "Mesh.h"

Mesh::Mesh() 
{
	pointCloud = NULL;
	normalVector = NULL;
	indices = NULL;
	textureCoords = NULL;
	textures = NULL;
	colors = NULL;
	colorsSize = 0;
	isTextureFromImage = false;
	numberOfTextures = 0;
}

Mesh::~Mesh()
{

	delete [] pointCloud;
	delete [] normalVector;
	delete [] indices;
	if(textureCoordsSize > 0)
		delete [] textureCoords;
	if(colorsSize > 0)
		delete [] colors;
	if(isTextureFromImage)
		delete [] textures;

}

void Mesh::addObject(Mesh *mesh) 
{

	if(pointCloud == NULL) {
		
		pointCloudSize = mesh->getPointCloudSize();
		indicesSize = mesh->getIndicesSize();
		textureCoordsSize = mesh->getTextureCoordsSize();
		numberOfTextures = mesh->getNumberOfTextures();
		colorsSize = mesh->getColorsSize();

		pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
		normalVector = (float*)malloc(pointCloudSize * sizeof(float));
		textureCoords = (float*)malloc(textureCoordsSize * sizeof(float));
		colors = (float*)malloc(colorsSize * sizeof(float));
		indices = (int*)malloc(indicesSize * sizeof(int));
		textures = (Image**)malloc(numberOfTextures * sizeof(Image));

		for(int point = 0; point < pointCloudSize; point++)
			pointCloud[point] = mesh->getPointCloud()[point];

		for(int point = 0; point < pointCloudSize; point++)
			normalVector[point] = mesh->getNormalVector()[point];

		for(int coord = 0; coord < textureCoordsSize; coord++)
			textureCoords[coord] = mesh->getTextureCoords()[coord];
	
		for(int color = 0; color < colorsSize; color++)
			colors[color] = mesh->getColors()[color];

		for(int index = 0; index < indicesSize; index++)
			indices[index] = mesh->getIndices()[index];
	
		for(int tex = 0; tex < numberOfTextures; tex++) {
			textures[tex] = new Image(mesh->getTexture()[tex]->getWidth(), mesh->getTexture()[tex]->getHeight(), 3);
			memcpy(textures[tex]->getData(), mesh->getTexture()[tex]->getData(), mesh->getTexture()[tex]->getWidth() * mesh->getTexture()[tex]->getHeight() * 3 * sizeof(unsigned char));
		}

		if(numberOfTextures > 0) isTextureFromImage = true;

	} else {
		
		int prevPointCloudSize = pointCloudSize;
		int prevTextureCoordsSize = textureCoordsSize;
		int prevColorsSize = colorsSize;
		int prevIndicesSize = indicesSize;
		int prevNumberOfTextures = numberOfTextures;

		float *prevPointCloud = (float*)malloc(pointCloudSize * sizeof(float));
		float *prevNormalVector = (float*)malloc(pointCloudSize * sizeof(float));
		float *prevTextureCoords = (float*)malloc(textureCoordsSize * sizeof(float));
		float *prevColors = (float*)malloc(colorsSize * sizeof(float));
		int *prevIndices = (int*)malloc(indicesSize * sizeof(int));
		Image **prevTextures = (Image**)malloc(numberOfTextures * sizeof(Image));

		for(int point = 0; point < pointCloudSize; point++)
			prevPointCloud[point] = pointCloud[point];

		for(int point = 0; point < pointCloudSize; point++)
			prevNormalVector[point] = normalVector[point];

		for(int coord = 0; coord < prevTextureCoordsSize; coord++)
			prevTextureCoords[coord] = textureCoords[coord];

		for(int color = 0; color < colorsSize; color++)
			prevColors[color] = colors[color];

		for(int index = 0; index < indicesSize; index++)
			prevIndices[index] = indices[index];
	
		for(int tex = 0; tex < prevNumberOfTextures; tex++) {
			prevTextures[tex] = new Image(textures[tex]->getWidth(), textures[tex]->getHeight(), 3);
			memcpy(prevTextures[tex]->getData(), textures[tex]->getData(), textures[tex]->getWidth() * textures[tex]->getHeight() * 3 * sizeof(unsigned char));
		}

		delete [] pointCloud;
		delete [] normalVector;
		delete [] textureCoords;
		delete [] colors;
		delete [] indices;
		delete [] textures;

		pointCloudSize = prevPointCloudSize + mesh->getPointCloudSize();
		textureCoordsSize = prevTextureCoordsSize + mesh->getTextureCoordsSize();
		colorsSize = prevColorsSize + mesh->getColorsSize();
		indicesSize = prevIndicesSize + mesh->getIndicesSize();
		numberOfTextures = prevNumberOfTextures + mesh->getNumberOfTextures();

		pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
		normalVector = (float*)malloc(pointCloudSize * sizeof(float));
		textureCoords = (float*)malloc(textureCoordsSize * sizeof(float));
		colors = (float*)malloc(colorsSize * sizeof(float));
		indices = (int*)malloc(indicesSize * sizeof(int));
		textures = (Image**)malloc(numberOfTextures * sizeof(Image));

		for(int point = 0; point < prevPointCloudSize; point++)
			pointCloud[point] = prevPointCloud[point];

		for(int point = 0; point < prevPointCloudSize; point++)
			normalVector[point] = prevNormalVector[point];

		for(int coord = 0; coord < prevTextureCoordsSize; coord++)
			textureCoords[coord] = prevTextureCoords[coord];

		for(int color = 0; color < prevColorsSize; color++)
			colors[color] = prevColors[color];

		for(int index = 0; index < prevIndicesSize; index++)
			indices[index] = prevIndices[index];
	
		for(int tex = 0; tex < prevNumberOfTextures; tex++) {
			textures[tex] = new Image(prevTextures[tex]->getWidth(), prevTextures[tex]->getHeight(), 3);
			memcpy(textures[tex]->getData(), prevTextures[tex]->getData(), prevTextures[tex]->getWidth() * prevTextures[tex]->getHeight() * 3 * sizeof(unsigned char));
		}

		for(int point = prevPointCloudSize; point < pointCloudSize; point++)
			pointCloud[point] = mesh->getPointCloud()[point - prevPointCloudSize];

		for(int point = prevPointCloudSize; point < pointCloudSize; point++)
			normalVector[point] = mesh->getNormalVector()[point - prevPointCloudSize];

		for(int coord = prevTextureCoordsSize; coord < textureCoordsSize; coord++)
			textureCoords[coord] = mesh->getTextureCoords()[coord - prevTextureCoordsSize];
	
		for(int color = prevColorsSize; color < colorsSize; color++)
			colors[color] = mesh->getColors()[color - prevColorsSize];

		for(int index = prevIndicesSize; index < indicesSize; index++)
			indices[index] = mesh->getIndices()[index - prevIndicesSize] + prevPointCloudSize/3;
	
		for(int tex = prevNumberOfTextures; tex < numberOfTextures; tex++) {
			textures[tex] = new Image(mesh->getTexture()[tex]->getWidth(), mesh->getTexture()[tex]->getHeight(), 3);
			memcpy(textures[tex]->getData(), mesh->getTexture()[tex]->getData(), mesh->getTexture()[tex]->getWidth() * mesh->getTexture()[tex]->getHeight() * 3 * sizeof(unsigned char));
		}

		if(numberOfTextures > 0) isTextureFromImage = true;

		delete [] prevPointCloud;
		delete [] prevNormalVector;
		delete [] prevIndices;
		delete [] prevTextureCoords;
		delete [] prevColors;
		delete [] prevTextures;

	}
	
}

void Mesh::computeNormals()
{

	if(normalVector == NULL)
		normalVector = (float*)malloc(pointCloudSize * sizeof(float));

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

void Mesh::computeCentroid(float *centroid)
{

	
	for(int axis = 0; axis < 3; axis++)
		centroid[axis] = 0;

	for(int point = 0; point < pointCloudSize/3; point++) {
		for(int axis = 0; axis < 3; axis++)
			centroid[axis] += pointCloud[point * 3 + axis];
	}

	for(int axis = 0; axis < 3; axis++)
		centroid[axis] /= pointCloudSize/3;


}

void Mesh::loadOBJFile(char *filename)
{

	GLMmodel *model = glmReadOBJ(filename);

	pointCloudSize = model->numvertices * 3;
	indicesSize = model->numtriangles * 3;
	textureCoordsSize = model->numtexcoords * 2;

	pointCloud = (float*)malloc(pointCloudSize * sizeof(float));
	if(model->numnormals > 0) normalVector = (float*)malloc(pointCloudSize * sizeof(float));
	indices = (int*)malloc(indicesSize * sizeof(int));
	textureCoords = (float*)malloc(textureCoordsSize * sizeof(float));

	for(int point = 0; point < pointCloudSize/3; point++) {
		
		pointCloud[point * 3 + 0] = model->vertices[(point + 1) * 3 + 0];
		pointCloud[point * 3 + 1] = model->vertices[(point + 1) * 3 + 1];
		pointCloud[point * 3 + 2] = model->vertices[(point + 1) * 3 + 2];
	
	}
	
	if(model->numnormals > 0) {
		
		for(int normal = 0; normal < pointCloudSize/3; normal++) {
		
			normalVector[normal * 3 + 0] = model->normals[(normal + 1) * 3 + 0];
			normalVector[normal * 3 + 1] = model->normals[(normal + 1) * 3 + 1];
			normalVector[normal * 3 + 2] = model->normals[(normal + 1) * 3 + 2];
	
		}

	}

	for(int indice = 0; indice < indicesSize/3; indice++) {

		indices[indice * 3 + 0] = model->triangles[indice].vindices[0] - 1;
		indices[indice * 3 + 1] = model->triangles[indice].vindices[1] - 1;
		indices[indice * 3 + 2] = model->triangles[indice].vindices[2] - 1;
	
	}

	for(int coord = 0; coord < textureCoordsSize/2; coord++) {

		textureCoords[coord * 2 + 0] = model->texcoords[(coord + 1) * 2 + 0];
		textureCoords[coord * 2 + 1] = model->texcoords[(coord + 1) * 2 + 1];
		
	}
	
	delete model;

}

void Mesh::loadTexture(char *filename) {

	if(numberOfTextures == 0) {

		textures = (Image**)malloc(sizeof(Image));
		textures[numberOfTextures] = new Image(filename);
		numberOfTextures++;
		isTextureFromImage = true;
	
	} else {
		
		int prevNumberOfTextures = numberOfTextures;
		Image **prevTextures = (Image**)malloc(numberOfTextures * sizeof(Image));

		for(int tex = 0; tex < prevNumberOfTextures; tex++) {
			prevTextures[tex] = new Image(textures[tex]->getWidth(), textures[tex]->getHeight(), 3);
			memcpy(prevTextures[tex]->getData(), textures[tex]->getData(), textures[tex]->getWidth() * textures[tex]->getHeight() * 3 * sizeof(unsigned char));
		}

		delete [] textures;

		textures = (Image**)malloc((numberOfTextures + 1) * sizeof(Image));

		for(int tex = 0; tex < prevNumberOfTextures; tex++) {
			textures[tex] = new Image(prevTextures[tex]->getWidth(), prevTextures[tex]->getHeight(), 3);
			memcpy(textures[tex]->getData(), prevTextures[tex]->getData(), prevTextures[tex]->getWidth() * prevTextures[tex]->getHeight() * 3 * sizeof(unsigned char));
		}

		textures[numberOfTextures] = new Image(filename);
		numberOfTextures++;
		isTextureFromImage = true;

	}

}

void Mesh::setBaseColor(float r, float g, float b) {

	colorsSize = pointCloudSize;
	colors = (float*)malloc(colorsSize * sizeof(float));

	for(int color = 0; color < colorsSize/3; color++) {
		colors[color * 3 + 0] = r;
		colors[color * 3 + 1] = g;
		colors[color * 3 + 2] = b;
	}

}

void Mesh::translate(float x, float y, float z) {

	for(int point = 0; point < pointCloudSize/3; point++) {
		
		pointCloud[point * 3 + 0] += x;
		pointCloud[point * 3 + 1] += y;
		pointCloud[point * 3 + 2] += z;
	
	}

}

void Mesh::scale(float x, float y, float z) {

	for(int point = 0; point < pointCloudSize/3; point++) {
		
		pointCloud[point * 3 + 0] *= x;
		pointCloud[point * 3 + 1] *= y;
		pointCloud[point * 3 + 2] *= z;
	
	}

}

void Mesh::rotate(float x, float y, float z) {

	glm::mat4 rotationMatrix = glm::rotate(x, glm::vec3(1, 0, 0));
	rotationMatrix *= glm::rotate(y, glm::vec3(0, 1, 0));
	rotationMatrix *= glm::rotate(z, glm::vec3(0, 0, 1));
	rotationMatrix = glm::transpose(rotationMatrix);

	float rotX, rotY, rotZ;
	for(int point = 0; point < pointCloudSize/3; point++) {
		
		rotX = pointCloud[point * 3 + 0] * rotationMatrix[0][0] + pointCloud[point * 3 + 1] * rotationMatrix[0][1] + pointCloud[point * 3 + 2] * rotationMatrix[0][2];
		rotY = pointCloud[point * 3 + 0] * rotationMatrix[1][0] + pointCloud[point * 3 + 1] * rotationMatrix[1][1] + pointCloud[point * 3 + 2] * rotationMatrix[1][2];
		rotZ = pointCloud[point * 3 + 0] * rotationMatrix[2][0] + pointCloud[point * 3 + 1] * rotationMatrix[2][1] + pointCloud[point * 3 + 2] * rotationMatrix[2][2];
		
		pointCloud[point * 3 + 0] = rotX;
		pointCloud[point * 3 + 1] = rotY;
		pointCloud[point * 3 + 2] = rotZ;
		
		rotX = normalVector[point * 3 + 0] * rotationMatrix[0][0] + normalVector[point * 3 + 1] * rotationMatrix[0][1] + normalVector[point * 3 + 2] * rotationMatrix[0][2];
		rotY = normalVector[point * 3 + 0] * rotationMatrix[1][0] + normalVector[point * 3 + 1] * rotationMatrix[1][1] + normalVector[point * 3 + 2] * rotationMatrix[1][2];
		rotZ = normalVector[point * 3 + 0] * rotationMatrix[2][0] + normalVector[point * 3 + 1] * rotationMatrix[2][1] + normalVector[point * 3 + 2] * rotationMatrix[2][2];
		
		normalVector[point * 3 + 0] = rotX;
		normalVector[point * 3 + 1] = rotY;
		normalVector[point * 3 + 2] = rotZ;

	}

}