#include "ShadowVolume.h"

ShadowVolume::ShadowVolume(int infinity) {

	this->infinity = infinity;

}

ShadowVolume::~ShadowVolume() {
	
	delete quads;

}

void ShadowVolume::build(Mesh *scene, glm::vec3 lightPosition) {
	
	//number of points = 16 (quad coordinates)
	quads = new Mesh(scene->getNumberOfTriangles() * 6, scene->getNumberOfTriangles() * 6);
	int v0, v1, v2;

	for(int triangle = 0; triangle < scene->getNumberOfTriangles(); triangle++) {
	
		v0 = scene->getIndices()[triangle * 3 + 0];
		v1 = scene->getIndices()[triangle * 3 + 1];
		v2 = scene->getIndices()[triangle * 3 + 2];

		//define default color for every vertex
		for(int vertex = 0; vertex < 6; vertex++) {
			quads->getColors()[triangle * 6 * 3 + vertex * 3 + 0] = 1.0;
			quads->getColors()[triangle * 6 * 3 + vertex * 3 + 1] = 0.0;
			quads->getColors()[triangle * 6 * 3 + vertex * 3 + 2] = 0.0;
		}

		//define edges
		for(int axis = 0; axis < 3; axis++) {
			quads->getPointCloud()[triangle * 6 * 3 + 0 * 3 + axis] = scene->getPointCloud()[v0 * 3 + axis];
			quads->getPointCloud()[triangle * 6 * 3 + 1 * 3 + axis] = scene->getPointCloud()[v1 * 3 + axis];
			quads->getPointCloud()[triangle * 6 * 3 + 2 * 3 + axis] = scene->getPointCloud()[v2 * 3 + axis];
			quads->getPointCloud()[triangle * 6 * 3 + 3 * 3 + axis] = (scene->getPointCloud()[v0 * 3 + axis] - lightPosition[axis]) * infinity;
			quads->getPointCloud()[triangle * 6 * 3 + 4 * 3 + axis] = (scene->getPointCloud()[v1 * 3 + axis] - lightPosition[axis]) * infinity;
			quads->getPointCloud()[triangle * 6 * 3 + 5 * 3 + axis] = (scene->getPointCloud()[v2 * 3 + axis] - lightPosition[axis]) * infinity;
		}

		//normal per point
		for(int axis = 0; axis < 3; axis++) {
			quads->getNormalVector()[triangle * 6 * 3 + 0 * 3 + axis] = quads->getPointCloud()[triangle * 6 * 3 + 0 * 3 + axis];
			quads->getNormalVector()[triangle * 6 * 3 + 1 * 3 + axis] = quads->getPointCloud()[triangle * 6 * 3 + 1 * 3 + axis];
			quads->getNormalVector()[triangle * 6 * 3 + 2 * 3 + axis] = quads->getPointCloud()[triangle * 6 * 3 + 2 * 3 + axis];
			quads->getNormalVector()[triangle * 6 * 3 + 3 * 3 + axis] = quads->getPointCloud()[triangle * 6 * 3 + 3 * 3 + axis];
			quads->getNormalVector()[triangle * 6 * 3 + 4 * 3 + axis] = quads->getPointCloud()[triangle * 6 * 3 + 4 * 3 + axis];
			quads->getNormalVector()[triangle * 6 * 3 + 5 * 3 + axis] = quads->getPointCloud()[triangle * 6 * 3 + 5 * 3 + axis];
		}

		///check order
		glm::vec3 nx0(scene->getNormalVector()[v0 * 3 + 0], scene->getNormalVector()[v0 * 3 + 1], scene->getNormalVector()[v0 * 3 + 2]);
		glm::vec3 nx1(scene->getNormalVector()[v1 * 3 + 0], scene->getNormalVector()[v1 * 3 + 1], scene->getNormalVector()[v1 * 3 + 2]);
		glm::vec3 nx2(scene->getNormalVector()[v2 * 3 + 0], scene->getNormalVector()[v2 * 3 + 1], scene->getNormalVector()[v2 * 3 + 2]);
		glm::vec3 n(nx0[0] + nx1[0] + nx2[0], nx0[1] + nx1[1] + nx2[1], nx0[2] + nx1[2] + nx2[2]);
		n /= 3;

		if(glm::dot(n, lightPosition) >= 0) {

			//build quad as two triangles
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 0] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 1] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 2] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 0] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 1] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 2] = triangle * 6 + 4;

			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 0] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 1] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 2] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 0] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 1] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 2] = triangle * 6 + 5;

			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 0] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 1] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 2] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 0] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 1] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 2] = triangle * 6 + 3;

		} else {

			//build quad as two triangles

			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 0] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 1] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 2] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 0] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 1] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 2] = triangle * 6 + 1;

			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 0] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 1] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 2] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 0] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 1] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 2] = triangle * 6 + 2;
			
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 0] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 1] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 2] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 0] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 1] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 2] = triangle * 6 + 0;

		}
		
	}

}

void ShadowVolume::update(Mesh *scene, glm::vec3 lightPosition) {

	int v0, v1, v2;

	for(int triangle = 0; triangle < scene->getNumberOfTriangles(); triangle++) {
	
		v0 = scene->getIndices()[triangle * 3 + 0];
		v1 = scene->getIndices()[triangle * 3 + 1];
		v2 = scene->getIndices()[triangle * 3 + 2];

		//define edges
		for(int axis = 0; axis < 3; axis++) {

			quads->getPointCloud()[triangle * 6 * 3 + 3 * 3 + axis] = (scene->getPointCloud()[v0 * 3 + axis] - lightPosition[axis]) * infinity;
			quads->getPointCloud()[triangle * 6 * 3 + 4 * 3 + axis] = (scene->getPointCloud()[v1 * 3 + axis] - lightPosition[axis]) * infinity;
			quads->getPointCloud()[triangle * 6 * 3 + 5 * 3 + axis] = (scene->getPointCloud()[v2 * 3 + axis] - lightPosition[axis]) * infinity;
		
		}

		///check order
		glm::vec3 nx0(scene->getNormalVector()[v0 * 3 + 0], scene->getNormalVector()[v0 * 3 + 1], scene->getNormalVector()[v0 * 3 + 2]);
		glm::vec3 nx1(scene->getNormalVector()[v1 * 3 + 0], scene->getNormalVector()[v1 * 3 + 1], scene->getNormalVector()[v1 * 3 + 2]);
		glm::vec3 nx2(scene->getNormalVector()[v2 * 3 + 0], scene->getNormalVector()[v2 * 3 + 1], scene->getNormalVector()[v2 * 3 + 2]);
		glm::vec3 n(nx0[0] + nx1[0] + nx2[0], nx0[1] + nx1[1] + nx2[1], nx0[2] + nx1[2] + nx2[2]);
		n /= 3;

		if(glm::dot(n, lightPosition) >= 0) {

			//build quad as two triangles
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 0] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 1] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 2] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 0] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 1] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 2] = triangle * 6 + 4;

			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 0] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 1] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 2] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 0] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 1] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 2] = triangle * 6 + 5;

			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 0] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 1] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 2] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 0] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 1] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 2] = triangle * 6 + 3;

		} else {

			//build quad as two triangles

			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 0] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 1] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 0 * 3 + 2] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 0] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 1] = triangle * 6 + 0;
			quads->getIndices()[triangle * 6 * 3 + 1 * 3 + 2] = triangle * 6 + 1;

			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 0] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 1] = triangle * 6 + 4;
			quads->getIndices()[triangle * 6 * 3 + 2 * 3 + 2] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 0] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 1] = triangle * 6 + 1;
			quads->getIndices()[triangle * 6 * 3 + 3 * 3 + 2] = triangle * 6 + 2;
			
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 0] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 1] = triangle * 6 + 5;
			quads->getIndices()[triangle * 6 * 3 + 4 * 3 + 2] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 0] = triangle * 6 + 3;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 1] = triangle * 6 + 2;
			quads->getIndices()[triangle * 6 * 3 + 5 * 3 + 2] = triangle * 6 + 0;

		}

	}

}