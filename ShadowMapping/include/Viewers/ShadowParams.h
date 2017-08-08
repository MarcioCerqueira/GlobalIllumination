#ifndef SHADOW_PARAMS_H
#define SHADOW_PARAMS_H

#include "glm/glm.hpp"

typedef struct ShadowParams
{
	glm::mat4 lightMVP;
	glm::mat4 lightMV;
	glm::mat4 lightP;
	int shadowMapWidth;
	int shadowMapHeight;
	int maxSearch; //SMSR
	int kernelOrder;
	int penumbraSize;
	float depthThreshold; //SMSR
	float shadowIntensity;
	bool tricubicPCF;
	bool bilinearPCF;
	bool VSM;
	bool ESM;
	bool EVSM;
	bool MSM; //Hamburger
	bool naive;
	bool SMSR;
	bool RPCFPlusSMSR; //SMSR
	bool RSMSS; //SMSR
	bool RPCFPlusRSMSS; //SMSR
	bool EDTSM;
	bool useHardShadowMap;
	bool useSeparableFilter;
	GLuint shadowMap;
	GLuint vertexMap;
	GLuint normalMap;
	GLuint colorMap;
	GLuint hardShadowMap;
} ShadowParams;

#endif