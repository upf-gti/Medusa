function SkeletalAnimation(name, animation)
{
  if(this.constructor !== SkeletalAnimation)
	 throw("You must use new to create an SkeletalAnimation");
    this._ctor();
    if(name)
        this.name = name;
    if(animation)
        this.animation = animation;
}
SkeletalAnimation.animations = {};

SkeletalAnimation.prototype._ctor = function()
{
    this.name = null;
    this.animation = null;
    this.current_time = 0;
    this.weight = 1;
    this.target_weigth = 1;
    this.speed = 1;
    this.target_speed = 1;
}