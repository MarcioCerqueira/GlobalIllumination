#ifndef SHADOW_PARAMS_H
#define SHADOW_PARAMS_H

#include "glm/glm.hpp"

typedef struct ShadowParams
{
	glm::mat4 lightMVP;
	int shadowMapWidth;
	int shadowMapHeight;
	bool tricubicPCF;
	bool poissonPCF;
	bool bilinearPCF;
	bool edgePCF;
	bool VSM;
	bool ESM;
	bool EVSM;
	bool naive;
	GLuint shadowMap;
	GLuint edgeMap;
} ShadowParams;

#endif