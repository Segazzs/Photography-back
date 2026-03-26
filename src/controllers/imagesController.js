import { Image } from '../models/image.js';
import createHttpError from 'http-errors';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

export const getImages = async (req, res) => {
  const images = await Image.find();
  res.status(200).json(images);
};

export const getImagesById = async (req, res) => {
  const { imageId } = req.params;

  const img = await Image.findById(imageId);

  if (!img) {
    throw createHttpError(404, 'Image not found');
  }

  res.status(200).json(img);
};

export const createImage = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw createHttpError(400, 'No files');
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const result = await uploadToCloudinary(file.buffer);

    const image = await Image.create({
      url: result.secure_url,
      publicId: result.public_id,
    });

    uploadedImages.push(image);
  }

  res.status(201).json(uploadedImages);
};

//==================================================== DELETE

export const deleteImage = async (req, res) => {
  const { imageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return res.status(400).json({ error: 'Invalid imageId' });
  }

  const image = await Image.findById(imageId);

  if (!image) {
    throw createHttpError(404, 'Image not found');
  }

  if (image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (err) {
      console.error('Cloudinary delete failed:', err);
      // не кидаємо 500, просто лог
    }
  }

  await Image.deleteOne({ _id: imageId });

  res.status(200).json({ message: 'Deleted' });
};

//==================================================== DELETE

export const updateImage = async (req, res) => {
  const { imageId } = req.params;

  const image = await Image.findById(imageId);

  if (!image) {
    throw createHttpError(404, 'Image not found');
  }

  let updateData = {};

  if (req.file) {
    // 🧹 видаляємо стару
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    // ☁️ нова
    const result = await uploadToCloudinary(req.file.buffer);

    updateData.url = result.secure_url;
    updateData.publicId = result.public_id;
  }

  const updatedImage = await Image.findByIdAndUpdate(imageId, updateData, {
    new: true,
  });

  res.status(200).json(updatedImage);
};
