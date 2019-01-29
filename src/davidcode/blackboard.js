function Blackboard()
{
  if(this.constructor !== Blackboard)
	 throw("You must use new to create a Blackboard");
	this._ctor();
}

Blackboard.prototype._ctor = function()
{
    this.stress = 0;
    this.avg_age = 20;
    this.rain = 50;
    this.temperature = 20;
    this.light = 80;
    this.noise = 35;
    this.bbvariables = ["stress", "rain", "temperature", "light", "noise"];
    this.area = [-2500,-2500,2500,2500];
}

Blackboard.prototype.setArea = function(p1, p2, p3, p4)
{
    this.area = [p1, p2, p3, p4];
}
