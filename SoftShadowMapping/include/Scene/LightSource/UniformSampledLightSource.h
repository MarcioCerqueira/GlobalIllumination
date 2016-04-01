#ifndef UNIFORMSAMPLEDLIGHTSOURCE_H
#define UNIFORMSAMPLEDLIGHTSOURCE_H

#include "glm/glm.hpp"
#include "Scene/LightSource/LightSource.h"

class UniformSampledLightSource : public LightSource
{
public:
	
	UniformSampledLightSource(LightSource *lightSource, int numberOfPointLights);
	
	int getNumberOfPointLights() { return numberOfPointLights; }
	glm::vec3 getEye(int sampleIndex);
	glm::vec3 getAt(int sampleIndex);
	
private:

	glm::vec3 computeUniformSampling(glm::vec3 sample, int sampleIndex);
	int numberOfPointLights;
};

#endif