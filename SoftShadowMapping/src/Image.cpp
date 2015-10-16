#include "Image.h"

Image::Image(int width, int height, int channels) {

	data = (unsigned char*)malloc(width * height * channels * sizeof(unsigned char));
	this->width = width;
	this->height = height;

	SMSRCases = (int*)malloc(14 * sizeof(int));
	RSMSSCases = (int*)malloc(33 * sizeof(int));

	for(int v = 0; v < 14; v++) SMSRCases[v] = 0;
	for(int v = 0; v < 33; v++) RSMSSCases[v] = 0;

}

Image::Image(char *filename) {
	
	cv::Mat img = cv::imread(filename);
	cv::cvtColor(img, img, CV_BGR2RGB);
	data = (unsigned char*)malloc(img.cols * img.rows * img.channels() * sizeof(unsigned char));
	this->width = img.cols;
	this->height = img.rows;
	
	for(int pixel = 0; pixel < this->width * this->height * 3; pixel++)
		data[pixel] = img.ptr<unsigned char>()[pixel];

}

Image::~Image() {

	delete [] data;
	delete [] SMSRCases;

}

void Image::computeBoundingBoxFromOpenGLImage() {

	int pixel;
	bool doBreak = false;
	for(int y = 0; !doBreak && y < height; y++) {
		for(int x = 0; x < width; x++) {
			pixel = (height - y) * width + (x);
			if((int)data[pixel * 3 + 0] == 255 && (int)data[pixel * 3 + 1] == 0 && (int)data[pixel * 3 + 2] == 0) {
				ymin = y;
				doBreak = true;
				break;
			}
		}
	}

	doBreak = false;
	for(int y = height - 1; !doBreak && y > 0; y--) {
		for(int x = 0; x < width; x++) {
			pixel = (height - y) * width + (x);
			if((int)data[pixel * 3 + 0] == 255 && (int)data[pixel * 3 + 1] == 0 && (int)data[pixel * 3 + 2] == 0) {
				ymax = y;
				doBreak = true;
				break;
			}
		}
	}

	doBreak = false;
	for(int x = 0; !doBreak && x < width; x++) {
		for(int y = 0; y < height; y++) {
			pixel = (height - y) * width + (x);
			if((int)data[pixel * 3 + 0] == 255 && (int)data[pixel * 3 + 1] == 0 && (int)data[pixel * 3 + 2] == 0) {
				xmin = x;
				doBreak = true;
				break;
			}
		}
	}

	doBreak = false;
	for(int x = width - 1; !doBreak && x > 0; x--) {
		for(int y = 0; y < height; y++) {
			pixel = (height - y) * width + (x);
			if((int)data[pixel * 3 + 0] == 255 && (int)data[pixel * 3 + 1] == 0 && (int)data[pixel * 3 + 2] == 0) {
				xmax = x;
				doBreak = true;
				break;
			}
		}
	}

}

void Image::save(char *filename) {
	
	cv::Mat img(height, width, CV_8UC3);
	
	for(int pixel = 0; pixel < this->width * this->height * 3; pixel++)
		img.ptr<unsigned char>()[pixel] = data[pixel];

	cv::flip(img, img, 0);
	cv::imwrite(filename, img);

}

void Image::splitSMSR() {

	cv::Mat img(height, width, CV_8UC3);
	
	for(int pixel = 0; pixel < this->width * this->height * 3; pixel++)
		img.ptr<unsigned char>()[pixel] = data[pixel];

	cv::flip(img, img, 0);

	for(int pixel = 0; pixel < this->width * this->height; pixel++)
		if(img.ptr<unsigned char>()[pixel * 3 + 0] != 255 && img.ptr<unsigned char>()[pixel * 3 + 0] != 161 && img.ptr<unsigned char>()[pixel * 3 + 0] != 0) {
			int index = ((float)img.ptr<unsigned char>()[pixel * 3 + 0]/255.0)/0.06 + 0.5;
			SMSRCases[index]++;
		}

}

void Image::printSMSR() {
	
	int total = 0;

	for(int v = 0; v < 14; v++)
		total += SMSRCases[v];

	for(int v = 1; v < 14; v++)
		std::cout << v << " " << (((float)SMSRCases[v]/(float)total) * 100) << std::endl;

}

void Image::splitRSMSS() {

	cv::Mat img(height, width, CV_8UC3);
	
	for(int pixel = 0; pixel < this->width * this->height * 3; pixel++)
		img.ptr<unsigned char>()[pixel] = data[pixel];

	cv::flip(img, img, 0);

	for(int pixel = 0; pixel < this->width * this->height; pixel++)
		if(img.ptr<unsigned char>()[pixel * 3 + 0] != 255 && img.ptr<unsigned char>()[pixel * 3 + 0] != 161 && img.ptr<unsigned char>()[pixel * 3 + 0] != 0) {
			int index = ((float)img.ptr<unsigned char>()[pixel * 3 + 0]/255.0)/0.03 + 0.5;
			RSMSSCases[index]++;
		}

}

void Image::printRSMSS() {
	
	int total = 0;

	for(int v = 0; v < 33; v++)
		total += RSMSSCases[v];

	std::fstream file("F:/result.txt");
	
	for(int v = 1; v < 32; v++) {
		std::cout << v << " " << (((float)RSMSSCases[v]/(float)total) * 100) << std::endl;
		file << (((float)RSMSSCases[v]/(float)total) * 100) << std::endl;
	}

}