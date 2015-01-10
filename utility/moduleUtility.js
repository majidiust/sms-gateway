var path = require('path'),
    walk = require('walk');

function loadModules(opts,done){
    var walker  = walk.walk(opts.folder, { followLinks: false }),
        modules = [];

    walker.on('file', function(root, stat, next) {
        var current = path.join(root, stat.name),
            extname = path.extname(current);

        if(extname === '.js' && (opts.filter === undefined || opts.filter(current))){
            var tmpModule = require(current);
            modules.push(new tmpModule(function(){next();}));
        }
    });

    walker.on('end', function() {
        done(modules);
    });
}

module.exports.loadModules = loadModules;