import { Image } from '../models/image.js';
import createHttpError from 'http-errors';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

export const getImages = async (req, res) => {
  const images = await Image.find().sort({ order: 1 }); // 👈 важливо
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

  const lastImage = await Image.findOne().sort({ order: -1 });

  let currentOrder = lastImage ? lastImage.order + 1 : 0;

  for (const file of req.files) {
    const result = await uploadToCloudinary(file.buffer);

    const image = await Image.create({
      url: result.secure_url,
      publicId: result.public_id,
      order: currentOrder++, // 👈 інкремент
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

// Ваш бекенд роутер з покращеним логуванням
// controllers/imagesController.js
export const reorderImages = async (req, res) => {
  console.log('\n=== REORDER IMAGES CONTROLLER ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('User:', req.user); // из middleware authenticate
  console.log('Request body type:', typeof req.body);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const { items } = req.body;

  // Проверка наличия items
  if (!items) {
    console.error('❌ ERROR: items is missing');
    return res.status(400).json({
      error: 'Invalid request',
      details: 'items field is required'
    });
  }

  // Проверка что items - массив
  if (!Array.isArray(items)) {
    console.error(`❌ ERROR: items is not an array, type: ${typeof items}`);
    return res.status(400).json({
      error: 'Invalid request',
      details: 'items must be an array'
    });
  }

  console.log(`📦 Processing ${items.length} items`);

  // Проверка каждого элемента
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n--- Item ${i} ---`);
    console.log('item:', item);

    // Проверка наличия _id
    if (!item._id) {
      console.error(`❌ Item ${i} missing _id`);
      return res.status(400).json({
        error: 'Invalid request',
        details: `Item at index ${i} missing _id`
      });
    }

    // Проверка формата _id
    const mongoose = await import('mongoose');
    const isValid = mongoose.default.Types.ObjectId.isValid(item._id);
    console.log(`_id "${item._id}" isValid: ${isValid}`);

    if (!isValid) {
      console.error(`❌ Invalid ObjectId format: ${item._id}`);
      return res.status(400).json({
        error: 'Invalid request',
        details: `Invalid _id format: "${item._id}" at index ${i}`
      });
    }

    // Проверка наличия order
    if (item.order === undefined || item.order === null) {
      console.error(`❌ Item ${i} missing order`);
      return res.status(400).json({
        error: 'Invalid request',
        details: `Item at index ${i} missing order`
      });
    }

    // Проверка типа order
    if (typeof item.order !== 'number') {
      console.error(`❌ Item ${i} order is not a number, type: ${typeof item.order}`);
      return res.status(400).json({
        error: 'Invalid request',
        details: `Order must be a number for item ${i}`
      });
    }
  }

  // Импортируем модель Image

  // Проверяем существование всех записей
  const ids = items.map(item => item._id);
  console.log('\n🔍 Checking existence in database...');
  console.log('IDs to check:', ids);

  try {
    const existingImages = await Image.find({ _id: { $in: ids } });
    console.log(`Found ${existingImages.length} images in database`);

    if (existingImages.length !== ids.length) {
      const existingIds = existingImages.map(img => img._id.toString());
      const missingIds = ids.filter(id => !existingIds.includes(id));
      console.error('❌ Missing images:', missingIds);
      return res.status(400).json({
        error: 'Invalid request',
        details: `Images not found: ${missingIds.join(', ')}`
      });
    }

    console.log('✅ All images exist in database');
  } catch (dbError) {
    console.error('❌ Database query error:', dbError);
    return res.status(500).json({
      error: 'Database error',
      details: dbError.message
    });
  }

  // Выполняем обновление
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: { order: item.order } },
    },
  }));

  console.log('\n📝 Executing bulkWrite...');
  console.log('Number of operations:', bulkOps.length);

  try {
    const result = await Image.bulkWrite(bulkOps);
    console.log('✅ Bulk write result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });

    res.status(200).json({
      message: 'Order updated successfully',
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (err) {
    console.error('❌ Bulk write failed:', err);
    res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }
};
