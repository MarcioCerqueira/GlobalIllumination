#ifndef SHADOW_VOLUME_H
#define SHADOW_VOLUME_H

#include "Mesh.h"

class ShadowVolume
{
public:
	ShadowVolume(int infinity);
	~ShadowVolume();
	void build(Mesh *scene, glm::vec3 lightPosition);
	void update(Mesh *scene, glm::vec3 lightPosition);
	Mesh* getData() { return quads; }
private:
	Mesh *quads;
	int infinity;
};

#endif