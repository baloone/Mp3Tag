const gulp = require ('gulp');

const browserify = require ('browserify');
const babelify = require ('babelify');
const source = require ('vinyl-source-stream');
const buffer = require ('vinyl-buffer');
const uglify = require ('gulp-uglify');


gulp.task ('build', () => {
    // app.js is your main JS file with all your module inclusions
    return browserify ({entries: './src/FID3.js', debug: true})
        .transform ('babelify', { presets: ['latest'] })
        .bundle ()
        .pipe (source ('FID3.min.js'))
        .pipe (buffer ())
        .pipe (uglify ())
        .pipe (gulp.dest ('./docs'));
});

gulp.task ('watch', ['build'], () => {
    gulp.watch ('./src/*.js', ['build']);
});

gulp.task ('default', ['watch']);

