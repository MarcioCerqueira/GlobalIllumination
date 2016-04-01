#include "Scene\LightSource\UniformSampledLightSource.h"

UniformSampledLightSource::UniformSampledLightSource(LightSource *lightSource, int numberOfPointLights) {
	
	LightSource::setEye(lightSource->getEye());
	LightSource::setAt(lightSource->getAt());
	LightSource::setUp(lightSource->getUp());
	LightSource::setSize(lightSource->getSize());
	this->numberOfPointLights = numberOfPointLights;

}

glm::vec3 UniformSampledLightSource::getEye(int sampleIndex) {

	glm::vec3 sampleEye = LightSource::getEye();
	return computeUniformSampling(sampleEye, sampleIndex);

}

glm::vec3 UniformSampledLightSource::getAt(int sampleIndex) {

	glm::vec3 sampleAt = LightSource::getAt();
	return computeUniformSampling(sampleAt, sampleIndex);

}

glm::vec3 UniformSampledLightSource::computeUniformSampling(glm::vec3 sample, int sampleIndex) {
	
	float halfSize = (float)LightSource::getSize()/2.0; //step
	float factor = sqrtf(numberOfPointLights); //17
	float sampleSize = (factor - 1)/2.0; //8

	sample[0] += (((sampleIndex % (int)factor) - sampleSize)/sampleSize) * halfSize;  
	sample[1] += (((int)(sampleIndex / factor) - sampleSize)/sampleSize) * halfSize;
	
	return sample;

}