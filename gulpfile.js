var gulp = require("gulp"),
	gls = require("gulp-live-server"),
	babelify = require('babelify'),
	browserify = require("browserify"),
	connect = require("gulp-connect"),
	source = require("vinyl-source-stream")
;

// Default task

gulp.task("default" , ["copyStaticFiles" , "build" , "startServer"]);

//Default task.

gulp.task("copyStaticFiles" , function(){
	return gulp.src("./src/html/*.*")
	.pipe(gulp.dest("./build"));
});

// convert Es6 

gulp.task("build" , function (){
	return browserify({
		entries: ["/index.js"]
	})
	.transform(babelify.configure({
		presets : ["es2015"]
	}))
	.bundle()
	.pipe(source("bundle.js"))
	.pipe(gulp.dest("./build"))
	;
});

// listening to 9001 

gulp.task('serve', function () {
  // Generic watch tasks for SASS and Browserify
  // gulp.watch(paths.css, [ 'css' ]);
  // gulp.watch(paths.js,  [ 'js'  ]);

  // Start the app server.
  var server = gls('index.js', { stdio : 'inherit' });
  server.start();

  // Reload server when backend files change.
  gulp.watch([ 'server/**/*.js' ], function() {
    server.start.bind(server)();
  });

  // Notify server when frontend files change.
  // gulp.watch([ 'app/static/**/*.{css,js,html}' ], function(file) {
  //   server.notify(file);
  // });
});

gulp.task("startServer" , function(){
	connect.server({
		root : "index.js",
		livereload : true,
		port : 8000

	});
});