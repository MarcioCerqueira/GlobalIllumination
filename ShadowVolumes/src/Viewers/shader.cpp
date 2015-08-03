#include "Viewers\shader.h"

// ***********************************************************************
// ***********************************************************************
//
// Get the location of a uniform variable
//
static GLint getUniLoc(GLuint program, const GLchar *name) {
	
    GLint loc;

    loc = glGetUniformLocation(program, name);

    if (loc == -1)
        printf("No such uniform named \"%s\"\n", name);

    printOpenGLError();  // Check for OpenGL errors
    return loc;
}

// ***********************************************************************
// ***********************************************************************
//
// Print out the information log for a shader object
//
static void printShaderInfoLog(GLuint shader) {
	
    int infologLength = 0;
    int charsWritten  = 0;
    GLchar *infoLog;

    printOpenGLError();  // Check for OpenGL errors

    glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infologLength);

    printOpenGLError();  // Check for OpenGL errors

    if (infologLength > 0)
    {
        infoLog = (GLchar *)malloc(infologLength);
        if (infoLog == NULL)
        {
            printf("ERROR: Could not allocate InfoLog buffer\n");
            exit(1);
        }
        glGetShaderInfoLog(shader, infologLength, &charsWritten, infoLog);
        printf("Shader InfoLog:\n%s\n\n", infoLog);
        free(infoLog);
    }
    printOpenGLError();  // Check for OpenGL errors
}

// ***********************************************************************
// ***********************************************************************
//
// Print out the information log for a program object
//
static void printProgramInfoLog(GLuint program) {
	
    int infologLength = 0;
    int charsWritten  = 0;
    GLchar *infoLog;

    printOpenGLError();  // Check for OpenGL errors

    glGetProgramiv(program, GL_INFO_LOG_LENGTH, &infologLength);

    printOpenGLError();  // Check for OpenGL errors

    if (infologLength > 0)
    {
        infoLog = (GLchar *)malloc(infologLength);
        if (infoLog == NULL)
        {
            printf("ERROR: Could not allocate InfoLog buffer\n");
            exit(1);
        }
        glGetProgramInfoLog(program, infologLength, &charsWritten, infoLog);
        printf("Program InfoLog:\n%s\n\n", infoLog);
        free(infoLog);
    }
    printOpenGLError();  // Check for OpenGL errors
}

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

static int shaderSize(char *fileName, EShaderType shaderType) {

    int fd;
    char name[100];
    int count = -1;

    strcpy(name, fileName);
    
    switch (shaderType) {
        case EVertexShader:
            strcat(name, ".vert");
            break;
        case EFragmentShader:
            strcat(name, ".frag");
            break;
        default:
            printf("ERROR: unknown shader file type\n");
            exit(1);
            break;
    	}

    //
    // Open the file, seek to the end to find its length
    //
#ifdef WIN32 /*[*/
    fd = _open(name, _O_RDONLY);
    if (fd != -1)
    {
        count = _lseek(fd, 0, SEEK_END) + 1;
        _close(fd);
    }
#else /*][*/
    fd = open(name, O_RDONLY);
    if (fd != -1)
    {
        count = lseek(fd, 0, SEEK_END) + 1;
        close(fd);
    }
#endif /*]*/

    return count;
}

// ***********************************************************************
//
// Reads a shader from the supplied file and returns the shader in the
// arrays passed in. Returns 1 if successful, 0 if an error occurred.
// The parameter size is an upper limit of the amount of bytes to read.
// It is ok for it to be too big.
//
// ***********************************************************************
static int readShader(char *fileName, EShaderType shaderType, char *shaderText, int size) {
	
    FILE *fh;
    char name[100];
    int count;

    strcpy(name, fileName);

    switch (shaderType) {
        case EVertexShader:
            strcat(name, ".vert");
            break;
        case EFragmentShader:
            strcat(name, ".frag");
            break;
        default:
            printf("ERROR: unknown shader file type\n");
            exit(1);
            break;
    	}

    //
    // Open the file
    //
    fh = fopen(name, "r");
    if (!fh)
        return -1;

    //
    // Get the shader from a file.
    //
    fseek(fh, 0, SEEK_SET);
    count = (int) fread(shaderText, 1, size, fh);
    shaderText[count] = '\0';

    if (ferror(fh))
        count = 0;

    fclose(fh);
    return count;
}

// ***********************************************************************
// ***********************************************************************

int readShaderSource(char *fileName, GLchar **vertexShader, GLchar **fragmentShader) {
	
    int vSize, gSize, fSize;

    //
    // Allocate memory to hold the source of our shaders.
    //
    vSize = shaderSize(fileName, EVertexShader);
    fSize = shaderSize(fileName, EFragmentShader);

    if ((vSize == -1) || (fSize == -1))
    {
        printf("Cannot determine size of the shader %s\n", fileName);
        exit(0);
    }

    *vertexShader = (GLchar *) malloc(vSize);
    *fragmentShader = (GLchar *) malloc(fSize);

    //
    // Read the source code
    //
    if (!readShader(fileName, EVertexShader, *vertexShader, vSize))
    {
        printf("Cannot read the file %s.vert\n", fileName);
        return 0;
    }
    if (!readShader(fileName, EFragmentShader, *fragmentShader, fSize))
    {
        printf("Cannot read the file %s.frag\n", fileName);
        return 0;
    }

    return 1;
}

// ***********************************************************************
// ***********************************************************************
int installShaders(	const GLchar *shVertex,
					const GLchar *shFragment,
					const int id) {

    GLint  vertCompiled;
    GLint  fragCompiled;    // status values

    // Create a vertex shader object and a fragment shader object

    shaderVS = glCreateShader(GL_VERTEX_SHADER);
    shaderFS = glCreateShader(GL_FRAGMENT_SHADER);

    // Load source code strings into shaders

    glShaderSource(shaderVS, 1, &shVertex, NULL);
    glShaderSource(shaderFS, 1, &shFragment, NULL);

    // Compile the vertex shader, and print out
    // the compiler log file.

    glCompileShader(shaderVS);
    printOpenGLError();  // Check for OpenGL errors
    glGetShaderiv(shaderVS, GL_COMPILE_STATUS, &vertCompiled);
    printShaderInfoLog(shaderVS);

    // Compile the fragment shader, and print out
    // the compiler log file.

    glCompileShader(shaderFS);
    printOpenGLError();  // Check for OpenGL errors
    glGetShaderiv(shaderFS, GL_COMPILE_STATUS, &fragCompiled);
    printShaderInfoLog(shaderFS);

    if (!vertCompiled || !fragCompiled)
        return 0;

    // Create a program object and attach the two compiled shaders

    shaderProg[id] = glCreateProgram();
    glAttachShader(shaderProg[id], shaderVS);
    glAttachShader(shaderProg[id], shaderFS);

    // Link the program object and print out the info log

    glLinkProgram(shaderProg[id]);
    printOpenGLError();  // Check for OpenGL errors
    glGetProgramiv(shaderProg[id], GL_LINK_STATUS, &linked);
    printProgramInfoLog(shaderProg[id]);

    if (!linked)
        return 0;

    // Install program object as part of current state

    glUseProgram(shaderProg[id]);

    return 1;
}


/// ***********************************************************************
/// ** 
/// ***********************************************************************

int printOglError(char *file, int line) {
	
    //
    // Returns 1 if an OpenGL error occurred, 0 otherwise.
    //
    GLenum glErr;
    int    retCode = 0;

    glErr = glGetError();
    while (glErr != GL_NO_ERROR)
    {
        printf("glError in file %s @ line %d: %s\n", file, line, gluErrorString(glErr));
        retCode = 1;
        glErr = glGetError();
    }
    return retCode;
}

/// ***********************************************************************
/// ** 
/// ***********************************************************************

void getGlVersion( int *major, int *minor ) {
	
    const char* verstr = (const char*)glGetString( GL_VERSION );
    if( (verstr == NULL) || (sscanf( verstr, "%d.%d", major, minor ) != 2) ) {
        *major = *minor = 0;
        fprintf( stderr, "Invalid GL_VERSION format!!!\n" );
    	}
}

/// ***********************************************************************
/// ** 
/// ***********************************************************************

void initShader(char* shaderName, int id ) {
	
int success = 0;
int gl_major, gl_minor;
GLchar 	*VertexShaderSource, 
		*FragmentShaderSource;

    glewInit();

    // Make sure that OpenGL 2.0 is supported by the driver
    getGlVersion(&gl_major, &gl_minor);
    printf("GL_VERSION major=%d minor=%d\n", gl_major, gl_minor);

    if (gl_major < 2) {
        printf("GL_VERSION major=%d minor=%d\n", gl_major, gl_minor);
        printf("Support for OpenGL 2.0 is required for this demo...exiting\n");
        exit(1);
    	}

    readShaderSource(shaderName, &VertexShaderSource, &FragmentShaderSource);
    success = installShaders(VertexShaderSource, FragmentShaderSource, id);

    if (!success) {
    	printf("Fail to load Shaders!!\n");
    	exit(0);
    	}   	
}
