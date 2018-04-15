"use strict";

const express =require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { BlogPost } = require("./models");

const app = express();
app.use(bodyParser.json());


// Why does the first one work but the 2nd one doesn't??
// blogPosts: posts.map((post)=>post.serialize())
// blogPosts: posts.map(function(post){post.serialize()})

app.get("/blog-posts", function(req, res) {
	BlogPost
		.find()
		.then(function(posts){
			res.json({
				blogPosts: posts.map((post)=>post.serialize())
			})
		})
		.catch(function(err){
			console.error(err);
			res.status(500).json({message: "Internal server error"});
		});
});


app.get("/blog-posts/:id", function(req,res){
	BlogPost
		.findById(req.params.id)
		.then(function(blogPost){
			res.json(blogPost.serialize())
		})
		.catch(function(err){
			res.status(500).json({message: "Internal server error"});
		});
});

app.post("/blog-posts", function(req,res){
	const requiredFields = ["title", "author", "content"];
	for (let i=0; i<requiredFields.length; i++){
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const missingMessage = `Missing ${field} in request body`;
			console.error(missingMessage);
			return res.status(400).send(missingMessage);
		}
	}

	BlogPost
		.create({
			title: req.body.title,
			author: {
				firstName: req.body.author.firstName,
				lastName: req.body.author.lastName
			},
			content: req.body.content
		})
		.then(function(blogPost){
			res.status(201).json(blogPost.serialize())
		})
		.catch(function(err){
			console.error(err);
			res.status(500).json({message: "Internal server error"});
		});
});

app.put("/blog-posts/:id", function(req,res){
	if (!(req.params.id && req.body.id && req.params.id === req.body.id)){
		const message = (`Request path id (${req.params.id}) and request body id (${req.body.id}) must match`);
		console.error(message);
		return res.status(400).json({message: message});
	}

	const toUpdate = {};
	const updateableFields = ["title", "author.firstName", "author.lastName", "content"];

	updateableFields.forEach(function(field){
		if (field in req.body){
			toUpdate[field] = req.body[field];
		}
	});

	BlogPost
		.findByIdAndUpdate(req.params.id, {$set: toUpdate})
		.then(function (blogPost){
			res.status(204).end();
		})
		.catch(function(err){
			res.status(500).json({message: "Internal server error"});
		});
} );

app.delete("/blog-posts/:id", function(req, res){
	BlogPost
	.findByIdAndRemove(req.params.id)
	.then(function(blogPost){
		res.status(204).end();
	})
	.catch(function(err){
		res.status(500).json({message: "Internal server error"});
	});
});

app.use("*", function(req, res){
	res.status(404).json({message: 'Not Found'});
});

let server;

function runServer(databaseUrl, port = PORT) {

	return new Promise((resolve, reject) => {
		mongoose.connect(databaseUrl, err => {
			if (err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`Your app is listening on port ${port}`);
				resolve();
			})
				.on('error', err => {
					mongoose.disconnect();
					reject(err);
				});
		});
	});
}

function closeServer(){
	return mongoose.disconnect().then(function (){
		return new Promise(function(resolve, reject){
			console.log("Closing server");
			server.close(function(err){
				if (err){
					return reject(err);
				}
				resolve();
			});
		});
	});
}

if (require.main === module){
	runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer }