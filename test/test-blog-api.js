'use strict';

const chai=require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const{app, runServer, closeServer} = require('../server');
const {TEST_DATBASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogApiData() {
	console.info('seeding restaurant data');
	const seedData=[];

	for (let i=1; i<=10; i++){
		seedData.push(generateBlogPostData());
	}

	return BlogPost.insertMany(seedData);
}

function generateBlogPostData(){
	return{
		title: faker.company.catchPhrase(),
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		}
		content: faker.lorem.paragraph()
	}
}

function tearDownDb(){
	console.warn('Deleting seeded test database');
	return mongoose.connection.dropDatabase();
}

describe('Blog API hooks', function(){
	before(function(){
		return runServer(TEST_DATBASE_URL);
	});

	beforeEach(function(){
		return seedBlogApiData();
	});

	afterEach(function(){
		return tearDownDb();
	});

	after(function(){
		return closeServer();
	});
});

describe('GET endpoint', function(){
	it('should return all existing blog posts', function(){
		let res;
		return chai.request(app)
			.get('/blog-posts')
			.then(function(_res){
				res = _res;
				expect(res).to.have.status(200);
				expect(res.body.blogPosts).to.have.length.of.at.least(1);
				return BlogPost.count();
			})
			.then(function(count){
				expect(res.body.blogPosts).to.have.length.of(count);
			});
	});

	it('should return the posts with the right fields', function(){
		let resBlogPost;
		return chai.request(app)
			.get('/blog-posts')
			.then(function(res){
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res).to.be.a('array');
				expect(res).to.have.length.of.at.least(1);

				res.body.blogPosts.forEach(function(blogPost){
					expect(blogPost).to.be.a('object');
					expect(blogPost).to.include.keys('id','title','author','content');
				});

				resBlogPost = res.body.blogPosts[0];
				return BlogPost.findbyId(resBlogPost.id);
			})
			.then(function(blogPost){
				expect(resBlogPost.id).to.equal(blogPost.id);
				expect(resBlogPost.title).to.equal(blogPost.title);
				expect(resBlogPost.author).to.equal(blogPost.author.firstName + ' ' + blogPost.author.lastName);
				expect(resBlogPost.content).to.equal(blogPost.content);
			});
	});
});

describe('POST endpoint', function(){
	it('should add a new blog post', function(){
		const newBlogPost = generateBlogPostData();
		let mostRecentPost;

		return chai.request(app)
			.post('/blog-posts')
			.send(newBlogPost)
			.then(function(res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.a('object');
				expect(res.body).to.include.keys('id','title','author','content');
				expect(res.body.id).to.not.be.null;
				expect(res.body.title).to.equal(newBlogPost.title);
				expect(res.body.author).to.equal(newBlogPost.author.firstName + ' ' + newBlogPost.author.lastName);
				expect(res.body.content).to.equal(newBlogPost.content);
			});
	});
});

describe('PUT endpoint', function(){
	const updateData={
		title: 'Testing PUT endpoint title',
		author: {
			firstName: 'New First Name',
			lastName: 'New Last Name'
		},
		content: 'This is the new content'
	}

	return BlogPost
		.findOne()
		.then(function(singleBlogPost){
			updateData.id = singleBlogPost.id;
			return chai.request(app)
				.put(`/blog-posts/${singleBlogPost.id}`)
				.send(updateData);
		})
		.then(function(res){
			expect(res).to.have.status(204);

			return BlogPost.findbyId(updateData.id);
		})
		.then(function(newBlogPost){
			expect(newBlogPost.title).to.equal(updateData.title);
			expect(newBlogPost.author).to.equal(updateData.author.firstName + ' ' + updateData.author.lastName);
			expect(newBlogPost.content).to.equal(updateData.content);
		});
});

describe('DELETE endpoint', function(){
	it('deletes a blog post by id', function(){
		let deleteblogPost;

		return BlogPost
			.findOne()
			.then(function(_deleteblogPost){
				deleteblogPost=_deleteblogPost;
				return chai.request(app)
					.delete(`/blog-posts/${deleteblogPost.id}`);
			})
			.then(function(_deleteblogPost){
				expect(_deleteblogPost).to.be.null;
			});
	});
});

