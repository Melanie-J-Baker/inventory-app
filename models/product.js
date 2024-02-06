const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ProductSchema = new Schema({
  name: { type: String, required: true, maxLength: 100 },
  desc: { type: String, required: true, maxLength: 500 },
  category: { type: Schema.Types.ObjectId, ref: "Category" },
  price: { type: Number, required: true },
  noInStock: { type: Number, required: true, min: 0 },
  imagePath: { type: String },
});

// Virtual for product's URL
ProductSchema.virtual("url").get(function () {
  // Don't use an arrow fn as we'll need the this obj
  return `/catalog/product/${this._id}`;
});

module.exports = mongoose.model("Product", ProductSchema);
