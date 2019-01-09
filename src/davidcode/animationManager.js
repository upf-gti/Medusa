function AnimationManager()
{
    if(this.constructor !== AnimationManager)
	 throw("You must use new to create an AnimationManager");
    this._ctor();
}

AnimationManager.prototype._ctor = function()
{
    this.animations = {};
    // this.skeletal_animations = {};
}

AnimationManager.prototype.newAnimation = function(path)
{
    if(path)
        this.loadAnimation( path );
}

AnimationManager.prototype.loadAnimation = function(path)
{
    var that = this;
    Collada.load( path, function(file){
        var file = file
        var anim_name = path;
        that.onParsed(path, file, anim_name);
    } );
}

AnimationManager.prototype.onParsed = function(path, file, anim_name)
{
  for ( var i in file.resources )
  {
    var animation = new LS.Animation();
    animation.configure( file.resources[i] );

    var filename = path.substring(path.lastIndexOf('/')+1)
    var name = filename.substring(0,filename.lastIndexOf('.'));
    animation.name = name;
    animation.takes["default"].optimizeTracks();
    // var skeletal_animation = new SkeletalAnimation(name, animation);
    this.animations[name] = animation;
    //animator.animations.push(animation);
  }
}

AnimationManager.prototype
