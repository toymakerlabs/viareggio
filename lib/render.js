var extend = require('util')._extend;
var fm = require('front-matter');
var path = require('path');
var through = require('through2');
var processRoot = require('./processRoot');

module.exports = function(file, enc, cb) {
  // Get the HTML for the current page and layout
  var page = fm(file.contents.toString());
  var layout = page.attributes.layout || 'default';

  // Now create Handlebars templates out of them
  var pageTemplate = this.Handlebars.compile(page.body + '\n');
  var layoutTemplate = this.layouts[layout];

  // Next, extend the existing data object to include this page's metadata
  pageData = page.attributes;
  pageData = extend(pageData, {
    page: path.basename(file.path, '.html'),
    root: processRoot(file.path, this.options.root)
  });

  // Add special ad-hoc partials for #ifpage and #unlesspage
  this.Handlebars.registerHelper('ifpage', require('../helpers/ifPage')(pageData.page));
  this.Handlebars.registerHelper('unlesspage', require('../helpers/unlessPage')(pageData.page));

  // Finally, add the page as a partial called "body", and render the layout template
  this.Handlebars.registerPartial('body', pageTemplate);
  file.contents = new Buffer(layoutTemplate(pageData));

  // This sends the modified file back into the stream
  cb(null, file);
}