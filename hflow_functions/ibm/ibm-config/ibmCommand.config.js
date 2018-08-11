const DEFAULT_URL = "url";
const DEFAULT_RESOURCE = "512";

const IBM_BUCKET = "asia-mgr";
const IBM_PATH = "";

exports.default_url = DEFAULT_URL;
exports.default_resource = DEFAULT_RESOURCE;

exports.resources = {
    "256": "url",
    "512": "url"
};

// Google cloud storage
exports.options = {
    "storage": "ibm",
    "bucket": IBM_BUCKET,
    "prefix": IBM_PATH,
};

