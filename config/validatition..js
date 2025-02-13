import Joi from "joi";

export const createBookingSchema = Joi.object({
  memberId: Joi.string().required().messages({
    "string.base": "Member ID must be a string.",
    "string.empty": "Member ID is required.",
  }),
  person: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().messages({
          "string.base": "Name must be a string.",
          "string.empty": "Name is required.",
        }),
        gender: Joi.string().valid("male", "female", "other").required().messages({
          "any.only": "Gender must be Male, Female, or Other.",
          "string.empty": "Gender is required.",
        }),
        age: Joi.string().required().messages({
          "string.base": "Age must be a string.",
          "string.empty": "Age is required.",
        }),
        _id:Joi.optional()
      })
    )
    .required()
    .messages({
      "array.base": "People details must be an array.",
      "array.empty": "People details are required.",
    }),
  facilityId: Joi.string().required().messages({
    "string.base": "Facility ID must be a string.",
    "string.empty": "Facility ID is required.",
  }),
//   facilityName: Joi.string().required().messages({
//     "string.base": "Facility Name must be a string.",
//     "string.empty": "Facility Name is required.",
//   }),
  bookingDate: Joi.date().required().messages({
    "date.base": "Booking Date must be a valid date.",
    "date.empty": "Booking Date is required.",
  }),
  startTime: Joi.string()
    .regex(/^\d{2}:\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Start Time must be in HH:mm format.",
      "string.empty": "Start Time is required.",
    }),
  endTime: Joi.string()
    .regex(/^\d{2}:\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "End Time must be in HH:mm format.",
      "string.empty": "End Time is required.",
    }),
  people: Joi.number().integer().min(1).required().messages({
    "number.base": "People must be a number.",
    "number.min": "At least one person must be specified.",
    "any.required": "Number of people is required.",
  }),
  specialRequests: Joi.string().allow("").messages({
    "string.base": "Special Requests must be a string.",
  }),
  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number.",
    "number.min": "Price cannot be negative.",
  }),
  discount: Joi.number().min(0).messages({
    "number.base": "Discount must be a number.",
    "number.min": "Discount cannot be negative.",
  }),
  tax: Joi.number().min(0).messages({
    "number.base": "Tax must be a number.",
    "number.min": "Tax cannot be negative.",
  }),
  paymentType: Joi.string().required().messages({
    "string.base": "Payment Type must be a string.",
    "string.empty": "Payment Type is required.",
  }),
  paymentsStatus: Joi.string().messages({
    "any.only": "Payment Status must be inprogress, completed, or failed.",
  }),
  status: Joi.string().messages({
    "any.only": "Status must be pending, approved, or cancelled.",
  }),
});
