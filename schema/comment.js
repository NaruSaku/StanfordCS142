"use strict";

/*
 * Defined the Mongoose Schema and return a Model for a Photo
 */

/* jshint node: true */

var mongoose = require('mongoose');

/*
 * Photo can have comments and we stored them in the Photo object itself using
 * this Schema:
 */
var commentSchema = new mongoose.Schema({
    comment: String,     // The text of the comment.
    date_time: {type: String, default: new Date().toLocaleString()}, // The date and time when the comment was created.
    user_id: mongoose.Schema.Types.ObjectId    // 	The ID of the user who created the comment.
});

var Comment = mongoose.model('Comment', commentSchema);

// make this available to our comments in our Node applications
module.exports = Comment;
