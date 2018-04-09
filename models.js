'use strict';

const mongoose = require('mongoose');

const blogPostSchema = mongoose.Schema({
	title: {type: String},
	author: {
		firstName: String,
		lastName: String
	},
	content: {type: String}
});

blogPostSchema.virtual('authorFullName').get(function(){
	return `${this.author.firstName} ${this.author.lastName}`;
})

blogPostSchema.methods.serialize = function() {
	return {
		id: this._id,
		title: this.title,
		author: this.authorFullName,
		content: this.content
	}
}

const BlogPost = mongoose.model('posts', blogPostSchema);

module.exports = {BlogPost};
