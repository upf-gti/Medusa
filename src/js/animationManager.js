function AnimationManager()
{
    if(this.constructor !== AnimationManager)
	 throw("You must use new to create an AnimationManager");
    this._ctor();
}

AnimationManager.prototype._ctor = function()
{
    this.animations = {};
    this.animations_names = [];
    // this.skeletal_animations = {};
}

// AnimationManager.prototype.newAnimation = function(path)
// {
//     if(path)
//         this.loadAnimation( path );
// }

AnimationManager.prototype.loadAnimation = function(path)
{
	if(!path) return;

	var anim = new SkeletalAnimation();
	HttpRequest(path, null, function(data) {
		anim.fromData(data);
	});
	var filename = path.split("/")[2];
	filename = filename.split(".")[0];
	anim.name = filename;
	this.animations[filename] = anim;

}
AnimationManager.prototype.loadAnimations = function(animations)
{
    for(var i in animations)
    {
        var path = "assets/" + animations[i] + ".dae";
        this.loadAnimation(path);
    }
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
    this.animations_names.push(name);
  }
}

//function SkeletalAnimation(name, animation)
//{
//  if(this.constructor !== SkeletalAnimation)
//	 throw("You must use new to create an SkeletalAnimation");
//    this._ctor();
//    if(name)
//        this.name = name;
//    if(animation)
//        this.animation = animation;
//}
//SkeletalAnimation.animations = {};
//
//SkeletalAnimation.prototype._ctor = function()
//{
//    this.name = null;
//    this.animation = null;
//    this.current_time = 0;
//    this.weight = 1;
//    this.target_weigth = 1;
//    this.speed = 1;
//    this.target_speed = 1;
//}
