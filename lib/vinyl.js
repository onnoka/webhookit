/**
 * Vinyl Model
 * Manages vinyl records in the collection
 */

var ObjectID = require('mongodb').ObjectID;

/**
 * Constructor
 */
var Vinyl = function(app) {
	this.app = app;
	this.collection = 'vinyls';
};

/**
 * Find all vinyls for a user
 */
Vinyl.prototype.findByUser = function(userId, callback) {
	var self = this;
	this.app.db.collection(this.collection, function(err, collection) {
		if(err) return callback(err);

		collection.find({userId: userId}).sort({addedAt: -1}).toArray(function(err, results) {
			callback(err, results);
		});
	});
};

/**
 * Find vinyl by ID
 */
Vinyl.prototype.findById = function(vinylId, callback) {
	var self = this;
	this.app.db.collection(this.collection, function(err, collection) {
		if(err) return callback(err);

		collection.findOne({_id: new ObjectID(vinylId)}, function(err, result) {
			callback(err, result);
		});
	});
};

/**
 * Create a new vinyl record
 */
Vinyl.prototype.create = function(vinylData, callback) {
	var self = this;

	// Add timestamp
	vinylData.addedAt = new Date();

	this.app.db.collection(this.collection, function(err, collection) {
		if(err) return callback(err);

		collection.insert(vinylData, {safe: true}, function(err, result) {
			callback(err, result && result[0]);
		});
	});
};

/**
 * Delete a vinyl record
 */
Vinyl.prototype.remove = function(vinylId, userId, callback) {
	var self = this;
	this.app.db.collection(this.collection, function(err, collection) {
		if(err) return callback(err);

		collection.remove({_id: new ObjectID(vinylId), userId: userId}, {safe: true}, function(err, result) {
			callback(err, result);
		});
	});
};

/**
 * Search for vinyl by barcode in external API
 */
Vinyl.prototype.searchByBarcode = function(barcode, callback) {
	var https = require('https');

	// Using Discogs API
	var options = {
		hostname: 'api.discogs.com',
		path: '/database/search?barcode=' + encodeURIComponent(barcode) + '&type=release',
		method: 'GET',
		headers: {
			'User-Agent': 'VinylCollector/1.0'
		}
	};

	var req = https.request(options, function(res) {
		var data = '';

		res.on('data', function(chunk) {
			data += chunk;
		});

		res.on('end', function() {
			try {
				var json = JSON.parse(data);
				if(json.results && json.results.length > 0) {
					var result = json.results[0];
					callback(null, {
						title: result.title,
						artist: result.title.split(' - ')[0] || 'Unknown',
						year: result.year,
						label: result.label ? result.label[0] : '',
						format: result.format ? result.format.join(', ') : 'Vinyl',
						coverUrl: result.cover_image || result.thumb,
						barcode: barcode,
						discogsId: result.id
					});
				} else {
					callback(null, null);
				}
			} catch(e) {
				callback(e);
			}
		});
	});

	req.on('error', function(e) {
		callback(e);
	});

	req.end();
};

module.exports = Vinyl;
