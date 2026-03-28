// models/image.js
import { Schema, model } from 'mongoose';

const imgSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0, // 👈 нове поле
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Image = model('Image', imgSchema);
