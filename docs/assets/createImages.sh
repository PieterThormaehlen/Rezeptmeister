#!/bin/bash
thumbnailResolutions=( 1280x720 960x540 640x360 480x270 320x180 )
titleimageResolutions=( 2560x1440 1920x1080 1600x900 1360x768 )

function createThumbnails {
	if [ -d "$1thumbnails" ]
	then
    	echo "$1thumbnails already exists"
	else
    	echo "creating $1thumbnails"
		mkdir -p "$1"thumbnails
		for i in "${thumbnailResolutions[@]}"; do
			createImage "$1" "$i" "thumbnails"&
		done
	fi
	wait
}

function createTitleimages {
	if [ -d "$1titleimage" ]
	then
    	echo "$1titleimage already exists"
	else
    	echo "creating $1titleimage"
		mkdir -p "$1"titleimage
		for i in "${titleimageResolutions[@]}"; do
			createImage "$1" "$i" "titleimage"&
		done
	fi
	wait
}

function createImage {
	IFS='x'
	read -a width <<< "$i"
	convert "$1"titleimage.jpg -geometry "$2"^ -gravity center -crop "$2"+0+0 "$1""$3"/"$width".jpeg
	convert "$1""$3"/"$width".jpeg "$1""$3"/"$width".webp
	heif-enc "$1""$3"/"$width".jpeg -q 35 -A -o "$1""$3"/"$width".avif
	jpegoptim -m75 -q "$1""$3"/"$width".jpeg
}

for d in recipes/*/ ; do
	echo "creating images for $d"
	createThumbnails "$d"
	createTitleimages "$d"
	echo "created all images for $d"
done

echo "creating placeholder images"
createThumbnails ""
createTitleimages ""
echo "created all placeholder images";