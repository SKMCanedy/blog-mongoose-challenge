"use strict";

exports.DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost/blog-posts";
exports.TEST_DATBASE_URL = process.env.TEST_DATBASE_URL || "mongodb://localhost/test-blog-posts";
exports.PORT = process.env.PORT || 8080;