/**
 * Vinyl Controller
 * Handles all vinyl collection routes
 */

var Vinyl = require('../vinyl');

exports.expressRoutes = function(app) {

	var vinylModel = new Vinyl(app);

	/**
	 * Display vinyl collection
	 */
	app.get('/vinyls', app.require_login, function(req, res) {
		vinylModel.findByUser(req.current_user._id, function(err, vinyls) {
			if(err) {
				console.error(err);
				return res.send(500, 'Error loading collection');
			}

			res.render('vinyls/index', {
				locals: {
					title: 'My Vinyl Collection',
					action: 'vinyls',
					vinyls: vinyls || []
				}
			});
		});
	});

	/**
	 * Show add vinyl page
	 */
	app.get('/vinyls/add', app.require_login, function(req, res) {
		res.render('vinyls/add', {
			locals: {
				title: 'Add Vinyl to Collection',
				action: 'vinyls'
			}
		});
	});

	/**
	 * API: Search vinyl by barcode
	 */
	app.get('/api/vinyls/search/:barcode', app.require_login, function(req, res) {
		var barcode = req.params.barcode;

		vinylModel.searchByBarcode(barcode, function(err, result) {
			if(err) {
				console.error(err);
				return res.json({error: 'Search failed'}, 500);
			}

			if(!result) {
				return res.json({error: 'No results found'}, 404);
			}

			res.json(result);
		});
	});

	/**
	 * API: Add vinyl to collection
	 */
	app.post('/api/vinyls', app.require_login, function(req, res) {
		var vinylData = {
			userId: req.current_user._id,
			title: req.body.title,
			artist: req.body.artist,
			year: req.body.year,
			label: req.body.label,
			format: req.body.format,
			coverUrl: req.body.coverUrl,
			barcode: req.body.barcode,
			discogsId: req.body.discogsId,
			notes: req.body.notes || ''
		};

		vinylModel.create(vinylData, function(err, vinyl) {
			if(err) {
				console.error(err);
				return res.json({error: 'Failed to add vinyl'}, 500);
			}

			res.json({success: true, vinyl: vinyl});
		});
	});

	/**
	 * API: Delete vinyl from collection
	 */
	app.delete('/api/vinyls/:id', app.require_login, function(req, res) {
		vinylModel.remove(req.params.id, req.current_user._id, function(err, result) {
			if(err) {
				console.error(err);
				return res.json({error: 'Failed to delete vinyl'}, 500);
			}

			res.json({success: true});
		});
	});

};
