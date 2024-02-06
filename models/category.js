const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CategorySchema = new Schema({
  name: { type: String, required: true, minLength: 3, maxLength: 100 },
  desc: { type: String, required: true, maxLength: 100 },
  checked: { type: Boolean },
});

// Virtual for category's URL
CategorySchema.virtual("url").get(function () {
  // Don't use an arrow fn as we'll need the this obj
  return `/catalog/category/${this._id}`;
});

module.exports = mongoose.model("Category", CategorySchema);
