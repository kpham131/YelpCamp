const Joi = require('joi')
module.exports.campgroundSchema = Joi.object({
    // campground here is the name of the object in the body (aka req.body.campground)
    campground: Joi.object({
        title: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().required(),
        location: Joi.string().required(),
        description: Joi.string().required()
    }).required()
})

