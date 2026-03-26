import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';

const objectIdValidator = (value, helpers) => {
  return !isValidObjectId(value) ? helpers.message('Invalid id format') : value;
};

export const imageIdParamSchema = {
  [Segments.PARAMS]: Joi.object({
    imageId: Joi.string().custom(objectIdValidator).required(),
  }),
};

export const updateImageSchema = {
  [Segments.PARAMS]: Joi.object({
    imageId: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.BODY]: Joi.object({
    url: Joi.string().uri().required(),
  }).min(1),
};

export const postImageSchema = {
  [Segments.BODY]: Joi.object({}).unknown(true),
};
