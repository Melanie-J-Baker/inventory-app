#! /usr/bin/env node

console.log(
  'This script populates some test products and categories to database. Specified database as argument - e.g.: node populatedb "mongodb+srv://cooluser:coolpassword@cluster0.lz91hw2.mongodb.net/local_library?retryWrites=true&w=majority"'
);

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const Product = require("./models/product");
const Category = require("./models/category");

const categories = [];
const products = [];

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");
  await createCategories();
  await createProducts();
  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

// We pass the index to the ...Create functions so that, for example,
// category[0] will always be the woodwind category, regardless of the order
// in which the elements of promise.all's argument complete.
async function categoryCreate(index, name, desc) {
  const category = new Category({ name: name, desc: desc });
  await category.save();
  categories[index] = category;
  console.log(`Added category: ${name}`);
}

async function productCreate(index, name, desc, category, price, noInStock) {
  const productdetail = {
    name: name,
    desc: desc,
    price: price,
    noInStock: noInStock,
  };
  if (category != false) productdetail.category = category;

  const product = new Product(productdetail);
  await product.save();
  products[index] = product;
  console.log(`Added product: ${name}`);
}

async function createCategories() {
  console.log("Adding categories");
  await Promise.all([
    categoryCreate(
      0,
      "Shrubs",
      "Evergreen and deciduous shrubs of all shapes, sizes and colours."
    ),
    categoryCreate(1, "Trees", "Deciduous, evergreen, and fruit trees."),
    categoryCreate(
      2,
      "Perennials",
      "Perennial plants to suit every garden. Colour and interest year after year."
    ),
  ]);
}

async function createProducts() {
  console.log("Adding Products");
  await Promise.all([
    productCreate(
      0,
      "Spirea Japonica",
      "Popular fast growing, easy to cultivate, prolific flowering shrub. Clusters of tiny pink flowers. Hardy. Deciduous",
      [categories[0]],
      10.99,
      5
    ),
    productCreate(
      1,
      "Heucera",
      "Small evergreen plant with beauiful bright purple leaves and dainty pink flowers. Hardy.",
      [categories[2]],
      4.99,
      25
    ),
    productCreate(
      2,
      "Corylus avellana",
      "Purple twisted hazel tree. Deciduous corkscrew hazel with distinctive dark purple leaves and curled branches and trunk.",
      [categories[1]],
      40.99,
      4
    ),
    productCreate(
      3,
      "Geum 'Mai Tai'",
      "Compact hardy perennial with a fruity cocktail blend of peach, pink and apricot flowers from late-spring to mid-summer.",
      [categories[2]],
      3.99,
      18
    ),
    productCreate(
      4,
      "Salvia officinalis (Sage)",
      "Common sage. Perennial evergreen subshrub herb, with fragrant greyish leaves. Fantastic for cooking.",
      [categories[2]],
      3.49,
      11
    ),
    productCreate(
      5,
      "Morus Alba",
      "White mulberry. Deciduous fruit tree with small white edible berries.",
      [categories[1]],
      25.99,
      3
    ),
    productCreate(
      6,
      "Buxus sempervirens",
      "Common box. Excellent evergreen hedging and topiary plant. ",
      [categories[0]],
      5.99,
      68
    ),
  ]);
}
