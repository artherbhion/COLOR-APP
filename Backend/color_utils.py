import numpy as np
import cv2
from colormath.color_objects import LabColor, sRGBColor
from colormath.color_conversions import convert_color
from colormath.color_diff import delta_e_cie2000

def rgb_to_lab(pixel):
    srgb = sRGBColor(pixel[0]/255.0, pixel[1]/255.0, pixel[2]/255.0)
    return convert_color(srgb, LabColor)

def calculate_average_deltaE(reference_rgb, image_rgb):
    height, width, _ = image_rgb.shape
    delta_e_list = []
    reference_lab = rgb_to_lab(reference_rgb)
    for y in range(0, height, 10):
        for x in range(0, width, 10):
            lab2 = rgb_to_lab(image_rgb[y, x])
            delta_e = delta_e_cie2000(reference_lab, lab2)
            delta_e_list.append(delta_e)
    return np.mean(delta_e_list)

def calculate_avg_hsb(image):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    return np.mean(h), np.mean(s), np.mean(v)
