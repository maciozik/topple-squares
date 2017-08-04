// Load Gulp
var gulp = require('gulp');

// Load plugins
var $ = require('gulp-load-plugins')({
	scope: ['devDependencies']
});

// Paths

var dist = 'dist';

var paths = {

	less: {
		watchable: ['css/**/*.less'],
		files: ['css/*.less'],
		dest: 'css'
	},

	css: {
		min: 'app.min.css',
		files: ['css/**/*.css'],
		dest: dist + '/css'
	},

	js: {
		min: 'app.min.js',
		files: ['js/**/*.js'],
		dest: dist + '/js'
	},

	html: ['index.html']

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
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(paths.less.dest));
});

gulp.task('min:css', ['prefix:css'], function() {
	return gulp.src(paths.css.files)
		.pipe($.cleanCss({ compatibility: 'ie9' }))
		.pipe($.rename(paths.css.min))
		.pipe(gulp.dest(paths.css.dest));
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

gulp.task('build:html', function() {
	return gulp.src(paths.html)
		.pipe($.htmlReplace({
			css: 'css/' + paths.css.min,
			js: 'js/' + paths.js.min
		}))
		.pipe(gulp.dest(dist));
});


/** Watch **/

gulp.task('watch', function(){
	gulp.watch(paths.less.watchable, ['prefix:css']);
});

/** Global Tasks **/

gulp.task('deploy', ['min:css', 'min:js', 'build:html']);
gulp.task('default', ['deploy']);


module.exports = gulp;