# def crop_image(url):
# 	image = save_image(url)
# 	print(image)
# 	img = cv2.imread(image)
# 	print(img.shape) # Print image shape

# 	# resize image
# 	resized_img = cv2.resize(img,(382, 200), interpolation = cv2.INTER_AREA)
# 	# Cropping an image
# 	cropped_image = resized_img[0:200,91:291]

# 	# Save the cropped image
# 	cv2.imwrite("cropped-"+str(image), cropped_image)

# 	cv2.waitKey(0)
# 	cv2.destroyAllWindows()

# 	delete_image(image)

# 	return "cropped-"+str(image)
