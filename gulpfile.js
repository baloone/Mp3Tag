const gulp = require ('gulp');

const browserify = require ('browserify');
const source = require ('vinyl-source-stream');
const buffer = require ('vinyl-buffer');
const minify = require('gulp-minify');


gulp.task ('build', () => {
    // app.js is your main JS file with all your module inclusions
    return browserify ({entries: './src/web.js', debug: false})
        .bundle ()
        .pipe (source ('FID3.min.js'))
        .pipe (buffer ())
        .pipe(minify({
            ext:{
                src:'-debug.js',
                min:'.js'
            },
            exclude: ['tasks'],
            ignoreFiles: ['.combo.js', '-min.js']
        }))
        .pipe (gulp.dest ('./docs'));
});

gulp.task ('watch', ['build'], () => {
    gulp.watch ('./src/*.js', ['build']);
});

gulp.task ('default', ['build']);

