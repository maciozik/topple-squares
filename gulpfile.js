// Load Gulp
var gulp = require('gulp');

// Load plugins
var $ = require('gulp-load-plugins')({
	scope: ['devDependencies']
});

// Paths

var dist = 'dist';
var vendor = 'vendor';

var paths = {

	less: {
		watchable: ['css/**/*.less'],
		files: ['css/*.less'],
		dest: 'css'
	},

	css: {
		files: ['css/*.css'],
		vendor: ['css/' + vendor + '/*.css'],
		dest: dist + '/css',
		theme: {
			light: 'css/app-light.css',
			dark: 'css/app-dark.css'
		}
	},

	js: {
		files: ['js/jquery-*.js', 'js/**/*.js'],
		min: 'app.min.js',
		dest: dist + '/js'
	},

	html: 'index.html'

};

/** CSS Tasks **/

gulp.task('compile:less', function(){
	return gulp.src(paths.less.files)
		.pipe($.plumber())
		.pipe($.less())
		.pipe(gulp.dest(paths.less.dest));
});

gulp.task('prefix:css', ['compile:less'], function () {
	return gulp.src(paths.css.files)
		.pipe($.autoprefixer({
			cascade: false
		}))
		.pipe(gulp.dest(paths.less.dest));
});

gulp.task('min:css:dark', ['prefix:css'], function() {
	return gulp.src(paths.css.theme.dark)
		.pipe($.cleanCss({ compatibility: 'ie9' }))
		.pipe(gulp.dest(paths.css.dest));
});

gulp.task('min:css:light', ['min:css:dark'], function() {
	return gulp.src(paths.css.theme.light)
		.pipe($.cleanCss({ compatibility: 'ie9' }))
		.pipe(gulp.dest(paths.css.dest));
});

gulp.task('build:css', ['min:css:light'], function() {
	return gulp.src(paths.css.vendor)
		.pipe($.cleanCss({ compatibility: 'ie9' }))
		.pipe(gulp.dest(paths.css.dest + '/' + vendor));
});

/** JS Tasks **/

gulp.task('min:js', function(){
	return gulp.src(paths.js.files)
		.pipe($.concat(paths.js.min))
		.pipe($.plumber())
		.pipe($.uglify())
		.pipe(gulp.dest(paths.js.dest));
});

/** HTML Tasks **/

gulp.task('replace:html', function() {
	return gulp.src(paths.html)
		.pipe($.htmlReplace({
			js: 'js/' + paths.js.min
		}))
		.pipe(gulp.dest(dist));
});


/** Watch **/

gulp.task('watch', function(){
	gulp.watch(paths.less.watchable, ['prefix:css']);
});

/** Global Tasks **/

gulp.task('build:app', ['build:css', 'min:js', 'replace:html']);
gulp.task('default', ['build:app']);


module.exports = gulp;