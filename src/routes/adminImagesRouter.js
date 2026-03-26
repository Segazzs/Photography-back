import { Router } from 'express';
import {
  createImage,
  deleteImage,
  updateImage,
} from '../controllers/imagesController.js';

import { celebrate } from 'celebrate';
import {
  updateImageSchema,
  postImageSchema,
  imageIdParamSchema,
} from '../validations/imagesValidation.js';

import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.use('/', authenticate, requireAdmin);

router.post(
  '/',
  upload.array('images', 20),
  celebrate(postImageSchema),
  createImage,
);

router.delete(
  '/:imageId',
  upload.array('images', 20),
  celebrate(imageIdParamSchema),
  deleteImage,
);

router.patch(
  '/:imageId',
  upload.array('images', 20),
  celebrate(updateImageSchema),
  updateImage,
);

export default router;
