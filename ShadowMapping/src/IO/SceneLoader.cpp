#include "IO\SceneLoader.h"

SceneLoader::SceneLoader(char *filename, Mesh *mesh) 
{

	this->file = std::fstream(filename);
	this->mesh = mesh;

}

void SceneLoader::load()
{

	std::string line, key, value;
	Mesh *temp;
	float scale[3];
	float translate[3];
	float rotate[3];
	float color[3];
	int numberOfTextures = 0;

	while(!file.eof()) 
	{

		std::getline(file, line);
		std::istringstream split(line);
		split >> key;

		if(key[0] == 'o') {
			split >> value;
			temp = new Mesh();
			temp->loadOBJFile((char*)value.c_str());
			temp->computeNormals();
		} else if(key[0] == 'm') {
			split >> value;
			numberOfTextures++;
			temp->loadTexture((char*)value.c_str(), numberOfTextures);
		} else if(key[0] == 's') {
			for(int axis = 0; axis < 3; axis++) {
				split >> value;
				scale[axis] = atof(value.c_str());
			}
			temp->scale(scale[0], scale[1], scale[2]);
		} else if(key[0] == 't') {
			for(int axis = 0; axis < 3; axis++) {
				split >> value;
				translate[axis] = atof(value.c_str());
			}
			temp->translate(translate[0], translate[1], translate[2]);
		} else if(key[0] == 'r') {
			for(int axis = 0; axis < 3; axis++) {
				split >> value;
				rotate[axis] = atof(value.c_str());
			}
			temp->rotate(rotate[0], rotate[1], rotate[2]);
		} else if(key[0] == '+') {
			mesh->addObject(temp);
			delete temp;
		} else if(key[0] == 'v') {
			for(int axis = 0; axis < 3; axis++) {
				split >> value;
				if(key[1] == 'e') cameraPosition[axis] = atof(value.c_str());
				else cameraAt[axis] = atof(value.c_str());
			}
		} else if(key[0] == 'l') {
			for(int axis = 0; axis < 3; axis++) {
				split >> value;
				if(key[1] == 'e') lightPosition[axis] = atof(value.c_str());
				else lightAt[axis] = atof(value.c_str());
			}
		} else if(key[0] == 'c') {

			if(key[1] == 'f') {
			
				split >> value;
				temp->loadColorFromOBJFile((char*)value.c_str());
			
			} else {
			
				for(int axis = 0; axis < 3; axis++) {
					split >> value;
					color[axis] = atof(value.c_str());
				}
				temp->setBaseColor(color[0], color[1], color[2]);
			
			}

		}

	}

}