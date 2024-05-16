const Product = require("../models/product");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

exports.index = asyncHandler(async (req, res) => {
  // Get details of products and category counts (in parallel)
  const [numProducts, numCategories] = await Promise.all([
    Product.countDocuments({}).exec(),
    Category.countDocuments({}).exec(),
  ]);

  res.render("index", {
    title: "Inventory App Home",
    product_count: numProducts,
    category_count: numCategories,
  });
});

// Display list of all products.
exports.product_list = asyncHandler(async (req, res) => {
  const allProducts = await Product.find({}, "name category")
    .sort({ name: 1 })
    .populate("category")
    .exec();

  res.render("product_list", {
    title: "Product List",
    product_list: allProducts,
  });
});

// Display detail page for a specific product.
exports.product_detail = asyncHandler(async (req, res, next) => {
  // Get details of product
  const product = await Product.findById(req.params.id)
    .populate("category")
    .exec();

  if (product === null) {
    // No results.
    const err = new Error("Product not found");
    err.status = 404;
    return next(err);
  }

  res.render("product_detail", {
    title: product.name,
    product: product,
  });
});

// Display product create form on GET.
exports.product_create_get = asyncHandler(async (req, res) => {
  // Get all categories, which we can use for adding to our product.
  const allCategories = await Category.find().sort({ name: 1 }).exec();
  res.render("product_form", {
    title: "Create Product",
    categories: allCategories,
  });
});

// Handle product create on POST.
exports.product_create_post = [
  // Validate and sanitize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("desc", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body(
    "price",
    "Price must not be zero and must have two decimal points"
  ).isDecimal({ min: 0.01 }),
  body("category.*").escape(),
  body("noInStock", "Must be at least one product in stock").isInt({ min: 1 }),
  // Process request after validation and sanitization.
  asyncHandler(async (req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Product object with escaped and trimmed data.
    const product = new Product({
      name: req.body.name,
      desc: req.body.desc,
      category: req.body.category,
      price: req.body.price,
      noInStock: req.body.noInStock,
      imagePath: "/images/" + req.file.filename,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all categories for form.
      const allCategories = await Category.find().sort({ name: 1 }).exec();

      // Mark our selected category as checked.
      for (const category of allCategories) {
        if (product.category === category._id) {
          category.checked = "true";
        }
      }
      res.render("product_form", {
        title: "Create Product",
        categories: allCategories,
        product: product,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Save product.
      await product.save();
      res.redirect(product.url);
    }
  }),
];

// Display Product delete form on GET.
exports.product_delete_get = asyncHandler(async (req, res) => {
  // Get details of product
  const product = await Product.findById(req.params.id)
    .populate("category")
    .exec();

  if (product === null) {
    // No results.
    res.redirect("/catalog/products");
  }

  res.render("product_delete", {
    title: "Delete Product",
    product: product,
  });
});

// Handle Product delete on POST.
exports.product_delete_post = asyncHandler(async (req, res) => {
  // Get details of product
  const product = await Product.findById(req.params.id)
    .populate("category")
    .exec();

  if (product === null) {
    // No results.
    res.redirect("/catalog/products");
  }
  //Delete object and redirect to the list of products.
  await Product.findByIdAndDelete(req.body.id);
  res.redirect("/catalog/products");
});

// Display product update form on GET.
exports.product_update_get = asyncHandler(async (req, res, next) => {
  // Get product and categories for form.
  const [product, allCategories] = await Promise.all([
    Product.findById(req.params.id).exec(),
    Category.find().sort({ name: 1 }).exec(),
  ]);

  if (product === null) {
    // No results.
    const err = new Error("Product not found");
    err.status = 404;
    return next(err);
  }

  // Mark our selected category as checked.
  allCategories.forEach((category) => {
    if (product.category === category._id) category.checked = "true";
  });

  res.render("product_form", {
    title: "Update Product",
    categories: allCategories,
    product: product,
  });
});

// Handle product update on POST.
exports.product_update_post = [
  // Validate and sanitize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("desc", "Description must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body(
    "price",
    "Price must not be zero and must have two decimal points"
  ).isDecimal({ min: 0.01 }),
  body("category.*").escape(),
  body("noInStock", "Must be at least one product in stock").isInt({ min: 1 }),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create path for uploaded image
    //const imagePath = "../public/images/" + req.file.originalname;

    // Create a Product object with escaped/trimmed data and old id.
    const product = new Product({
      name: req.body.name,
      desc: req.body.desc,
      price: req.body.price,
      noInStock: req.body.noInStock,
      category:
        typeof req.body.category === "undefined" ? "" : req.body.category,
      imagePath: "/images/" + req.file.filename,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all categories for form
      const allCategories = await Category.find().sort({ name: 1 }).exec();

      // Mark our selected category as checked.
      for (const category of allCategories) {
        if (product.category === category._id) {
          category.checked = "true";
        }
      }
      res.render("product_form", {
        title: "Update Product",
        categories: allCategories,
        product: product,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        product,
        {}
      );
      // Redirect to product detail page.
      res.redirect(updatedProduct.url);
    }
  }),
];
