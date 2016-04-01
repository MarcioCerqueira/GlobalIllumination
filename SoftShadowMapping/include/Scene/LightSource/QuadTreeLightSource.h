#ifndef QUADTREELIGHTSOURCE_H
#define QUADTREELIGHTSOURCE_H

#include "glm/glm.hpp"
#include <GL/glut.h>
#include "Scene/LightSource/LightSource.h"

class QuadTreeLightSource : public LightSource
{
public:
	
	QuadTreeLightSource(QuadTreeLightSource *lightSource, glm::vec3 referenceSampleEye, glm::vec3 referenceSampleAt);
	QuadTreeLightSource(LightSource *lightSource);
	~QuadTreeLightSource();
	void buildFirstLevel();
	void configureLeafNodes();
	glm::vec3 getEye(int sampleIndex);
	glm::vec3 getAt(int sampleIndex);
	QuadTreeLightSource* getChildNode(int index) { return nodes[index]; }
	int getLevel() { return level; }
	float getWeight() { return weight; }
	bool hasAnyChildren() { return hasChildren; }
	void subdivide();

private:

	glm::vec3 computeUniformSamples(glm::vec3 sample, int sampleIndex);
	glm::vec3 computeReferenceSamples(glm::vec3 sample, int sampleIndex);
	glm::vec3 referenceSampleEye;
	glm::vec3 referenceSampleAt;
	int level;
	float weight;
	bool hasChildren;
	QuadTreeLightSource* nodes[4];
};

#endif