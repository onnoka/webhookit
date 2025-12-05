module.exports = {

	// mongoDB access - supports MongoDB Atlas connection string or separate params
	database: {
		host: process.env.MONGODB_HOST || process.env.MONGO_HOST || 'localhost',
		port: parseInt(process.env.MONGODB_PORT || process.env.MONGO_PORT || '27017'),
		db: process.env.MONGODB_DB || process.env.MONGO_DB || 'webhookit',
		options: {
			auto_reconnect: true
		},
		// Support for MongoDB connection string (Railway, MongoDB Atlas, etc.)
		connectionString: process.env.MONGODB_URL || process.env.MONGO_URL || null
	},

	// Bind port/IP - use environment variables for cloud deployment
	server: {
		port: parseInt(process.env.PORT || '8124'),
		host: process.env.HOST || '0.0.0.0',
		ip: process.env.HOST || '0.0.0.0'
	},


	sessions: {
		key: process.env.SESSION_KEY || 'vinyl-collection-key',
		secret: process.env.SESSION_SECRET || 'change-this-secret-in-production!'
	},

	// Features
	cron: {
		enabled: process.env.CRON_ENABLED !== 'false'
	},

	users: {
		creation: {
			// Is the creation of new users public ?
			"public": process.env.PUBLIC_USER_CREATION === 'true' || false
		}
	}

};
