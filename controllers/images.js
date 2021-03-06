// Import models
const Image = require('../models/image');
const Gallery = require('../models/gallery');

// Import services
const S3 = require('../services/s3');
const form = require('../services/formParser');
const response = require('../services/response');

// Import actions from galleriesController
const { addImage, deleteImage } = require('./galleries');

const imagesController = {
  upload: async (req, res) => {
    try {
      const parsedImage = await form.parseImage(req);
      const imageObject = await S3.upload(parsedImage);
      const image = await Image.create(imageObject);
      const gallery = await addImage(imageObject.gallery_id, image._id);
      res.json(
        response.create( 201,
          `Successfully uploaded image and added to ${gallery.name}`,
          image
        )
      );
    } catch (e) {
      res.json(response.buildError(e));
    }
  },
  delete: async (req, res) => {
    try {
      const gallery = await Gallery.findOne({
        images: req.params.id,
      });
      const image = await Image.findById(req.params.id);
      S3.delete([image.image_url]);
      await Image.deleteOne({ _id: image._id });
      await deleteImage(gallery._id, image._id);
      res.json(response.create(204, 'Image successfully deleted'));
    } catch (e) {
      res.json(response.buildError(e));
    }
  },
  getOne: async (req, res) => {
    const { id } = req.params;
    try {
      const image = await Image.findById(id);
      if(image) {
        res.json(response.create(200, "Found image successfuly", image))
      } else {
        throw { code: 404, message: "Image not found" }
      }
    } catch (e) {
      res.json(response.buildError(e))
    }
  }
};

module.exports = imagesController;
