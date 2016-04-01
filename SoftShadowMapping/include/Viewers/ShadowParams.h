#ifndef SHADOW_PARAMS_H
#define SHADOW_PARAMS_H

#include "glm/glm.hpp"

typedef struct ShadowParams
{
	glm::mat4 lightMVP;
	glm::mat4 lightMVPs[289];
	glm::vec4 lightTrans[289];
	int shadowMapWidth;
	int shadowMapHeight;
	int windowWidth;
	int windowHeight;
	int blockerSearchSize;
	int kernelSize;
	int lightSourceRadius;
	int maxSearch; //RBSSM
	int numberOfSamples; //monteCarlo
	float shadowIntensity;
	float blockerThreshold; //SSSM
	float filterThreshold; //SSSM
	float depthThreshold; //RBSSM
	float HSMAlpha;
	float HSMBeta;
	float accFactor[289]; //adaptiveSampling
	bool monteCarlo;
	bool adaptiveSampling;
	bool adaptiveSamplingLowerAccuracy;
	bool quadTreeEvaluation;
	bool PCSS;
	bool SAVSM;
	bool VSSM;
	bool ESSM;
	bool MSSM;
	bool RBSSM;
	bool SSPCSS;
	bool SSABSS;
	bool SSSM;
	bool SSRBSSM;
	bool SAT; 
	bool useHardShadowMap;
	bool useSoftShadowMap;
	bool usePartialAverageBlockerDepthMap;
	bool useHierarchicalShadowMap;
	GLuint shadowMap;
	GLuint shadowMapArray;
	GLuint SATShadowMap;
	GLuint hierarchicalShadowMap;
	GLuint hardShadowMap;
	GLuint softShadowMap;
	GLuint partialAverageBlockerDepthMap;
	GLuint vertexMap;
	GLuint normalMap;
	GLuint shadowMaps[4]; //adaptiveSampling
} ShadowParams;

#endif