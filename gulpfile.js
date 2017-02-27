const gulp = require('gulp');
const babel = require('gulp-babel');
const stulus = require('gulp-stylus');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const uglify = require('gulp-uglify');

gulp.task('css', function() {
	return gulp.src('./source/css/style.styl')
		.pipe( stulus() )
		.pipe( autoprefixer() )
		.pipe( cssnano() )
		.pipe(gulp.dest('./public/css'))
});

gulp.task('js', function() {
		return gulp.src('./source/js/plugins/*.js')
			.pipe(babel({
				presets: ['es2015']
			}))
			.pipe( uglify() )
			.pipe(gulp.dest('./public/js'))
});

gulp.task('default', gulp.series('js', 'css') );

gulp.watch('./source/**/*.{js,styl}' ,gulp.series('default') );
