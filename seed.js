if (process.env.MONGODB_URI) {
	process.env.NODE_ENV = "prod"
} else {
	process.env.NODE_ENV = "dev"
}

module.exports = {
	"dev": "localhost/petes-pets",
	"prod": "ds113855.mlab.com:13855/heroku_d1jkkzjb"
}
