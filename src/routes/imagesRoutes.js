import { Router } from 'express';
import { getImages, getImagesById } from '../controllers/imagesController.js';

import { celebrate } from 'celebrate';
import { imageIdParamSchema } from '../validations/imagesValidation.js';

const router = Router();

router.get('/', getImages);

router.get('/:imageId', celebrate(imageIdParamSchema), getImagesById);

export default router;
