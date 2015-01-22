#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#if defined (__APPLE__) || defined(MACOSX)
	#include <unistd.h>
#else
#include <io.h>
#endif
#include <GL/glew.h>

#if defined (__APPLE__) || defined(MACOSX)
	#include <GLUT/glut.h>
#else
	#include <GL/glut.h>
#endif

//
// Shader types
//
typedef enum {
    EVertexShader,
    EFragmentShader,
} EShaderType;


int printOglError(char *file, int line);

#define printOpenGLError() printOglError(__FILE__, __LINE__)

//
// Global handles for the currently active program object, with its two shader objects
//

extern GLuint ProgramObject;
extern GLuint VertexShaderObject;
extern GLuint FragmentShaderObject;

extern GLuint 	shaderVS; 
extern GLuint 	shaderFS; 
extern GLuint 	shaderProg[5];   // handles to objects
extern GLint  	linked;


// ***********************************************************************
// ***********************************************************************
//
// Get the location of a uniform variable
//
static GLint getUniLoc(GLuint program, const GLchar *name);

// ***********************************************************************
// ***********************************************************************
//
// Print out the information log for a shader object
//
static void printShaderInfoLog(GLuint shader);

// ***********************************************************************
// ***********************************************************************
//
// Print out the information log for a program object
//
static void printProgramInfoLog(GLuint program);

// ***********************************************************************
//
// Returns the size in bytes of the shader fileName.
// If an error occurred, it returns -1.
//
// File name convention:
//
// <fileName>.vert
// <fileName>.frag
//
// ***********************************************************************

static int shaderSize(char *fileName, EShaderType shaderType) ;

// ***********************************************************************
//
// Reads a shader from the supplied file and returns the shader in the
// arrays passed in. Returns 1 if successful, 0 if an error occurred.
// The parameter size is an upper limit of the amount of bytes to read.
// It is ok for it to be too big.
//
// ***********************************************************************
static int readShader(char *fileName, EShaderType shaderType, char *shaderText, int size) ;

// ***********************************************************************
// ***********************************************************************

int readShaderSource(char *fileName, GLchar **vertexShader, GLchar **fragmentShader) ;

// ***********************************************************************
// ***********************************************************************
int installShaders(	const GLchar *shVertex,
                   	const GLchar *shFragment, 
					const int id);


// ***********************************************************************
// ** 
// ***********************************************************************

int printOglError(char *file, int line);

// ***********************************************************************
// ** 
// ***********************************************************************

void getGlVersion( int *major, int *minor );

// ***********************************************************************
// ** 
// ***********************************************************************

void initShader(char* shaderName, int id );


