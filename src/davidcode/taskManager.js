function TaskManager()
{
  if(this.constructor !== TaskManager)
	 throw("You must use new to create a TaskManager");
	this._ctor();
}

TaskManager.prototype._ctor = function()
{
    this.param_tasks = [];
    this.anim_tasks = [];
}

TaskManager.prototype.paramModifyTask = function(name, params)
{
    
}
TaskManager.prototype.animationTask = function(name, animation, blend_time)
{

}
TaskManager.prototype.moveToTask = function(name, animation, blend_time)
{

}

TaskManager.prototype.animationMixTask = function(name, animation, weight_of_mix)
{

}


