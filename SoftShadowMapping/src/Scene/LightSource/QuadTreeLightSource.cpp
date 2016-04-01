#include "Scene/LightSource/QuadTreeLightSource.h"

QuadTreeLightSource::QuadTreeLightSource(QuadTreeLightSource *lightSource, glm::vec3 referenceSampleEye, glm::vec3 referenceSampleAt) {

	LightSource::setUp(((LightSource*)lightSource)->getUp());
	LightSource::setSize(((LightSource*)lightSource)->getSize());
	this->level = lightSource->getLevel() + 1;
	this->weight = 1.0/powf(powf(2, level) + 1, 2);
	this->referenceSampleEye = referenceSampleEye;
	this->referenceSampleAt = referenceSampleAt;
	configureLeafNodes();

}

QuadTreeLightSource::QuadTreeLightSource(LightSource *lightSource) {

	LightSource::setEye(lightSource->getEye());
	LightSource::setAt(lightSource->getAt());
	LightSource::setUp(lightSource->getUp());
	LightSource::setSize(lightSource->getSize());
	
}

QuadTreeLightSource::~QuadTreeLightSource() {
	
	if(hasChildren)
		for(int node = 0; node < 4; node++)
			delete nodes[node];

}

void QuadTreeLightSource::buildFirstLevel() {
	
	referenceSampleEye = LightSource::getEye();
	referenceSampleAt = LightSource::getAt();
	level = 0;
	weight = 0.25;
	configureLeafNodes();

}

void QuadTreeLightSource::configureLeafNodes() {

	hasChildren = false;
	for(int node = 0; node < 4; node++)
		nodes[node] = NULL;

}

void QuadTreeLightSource::subdivide() {

	glm::vec3 childNodeEye[4];
	glm::vec3 childNodeAt[4];

	for(int node = 0; node < 4; node++) {
		childNodeEye[node] = computeReferenceSamples(referenceSampleEye, node);
		childNodeAt[node] = computeReferenceSamples(referenceSampleAt, node);
		nodes[node] = new QuadTreeLightSource(this, childNodeEye[node], childNodeAt[node]);
	}
	
	hasChildren = true;

}

glm::vec3 QuadTreeLightSource::getEye(int sampleIndex) {

	glm::vec3 sampleEye = referenceSampleEye;
	return computeUniformSamples(sampleEye, sampleIndex);

}

glm::vec3 QuadTreeLightSource::getAt(int sampleIndex) {

	glm::vec3 sampleAt = referenceSampleAt;
	return computeUniformSamples(sampleAt, sampleIndex);

}

glm::vec3 QuadTreeLightSource::computeUniformSamples(glm::vec3 sample, int sampleIndex) {

	int div = powf(2, level + 1);
	float step = (float)LightSource::getSize()/div;
	
	sample[0] += -step + (2 * step * (sampleIndex % 2));
	sample[1] += -step + (2 * step * (int)(sampleIndex / 2));
	
	return sample;

}

glm::vec3 QuadTreeLightSource::computeReferenceSamples(glm::vec3 sample, int sampleIndex) {

	int div = powf(2, level + 2);
	float step = (float)LightSource::getSize()/div;
	
	sample[0] += -step + (2 * step * (sampleIndex % 2));
	sample[1] += -step + (2 * step * (int)(sampleIndex / 2));
	
	return sample;

}