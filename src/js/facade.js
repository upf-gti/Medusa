/*
* David Moreno - UPF
*/

function Facade ()
{
	
}

/* 
* Receives as a parmaeter a game/system entity, a scene node which is being evaluated
* Returns a vec3 with the position
*/
Facade.prototype.getEntityPosition = function( entity )
{
	console.warn("getEntityPosition() Must be implemented to use HBTree system");
}

//For the HBTProperty Node
/*
* Search in all the properties (scene and entity) one with the name passed as a parameter
* Returns the value of the property (int, float or vec3) 
*/
Facade.prototype.getEntityPropertyValue = function( property_name )
{	
	console.warn("getEntityPropertyValue() Must be implemented to use HBTree system");
	//Search for the value of the property "property_name" in the system
}

/*
* Returns an Array of the existing entities in the scene
* The type of the entity is irrelevant
*/
Facade.prototype.getListOfAgents = function(  )
{
	console.warn("getListOfAgents() Must be implemented to use HBTree system");

}
/*
* Check if a concrete entity is in a certain position
* The entity must have a global position (or the possibility to access to it)
* The target can be a vec3 directly or an object containing the position of the target
*/
Facade.prototype.entityInTarget = function( enitity, target, threshold)
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

//For the Patrol Node
/*
* Check and find the next control point of a path (to patrol)
* If not path, return false
*/
Facade.prototype.checkNextTarget = function( enitity )
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

//For the EQSNearestInterestPoint Node
/*
* Return the existing types of interest points
*/
Facade.prototype.entityHasProperty = function(  )
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

//For the EQSNearestInterestPoint Node
/*
* Return all the existing interest points
*/
Facade.prototype.getInterestPoints = function(  )
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}
/*
* @entity: the virtual entity evaluated. The type you are using as an entity 
* @look_at_pos: vec3 with the target position to check if it's seen or not 
* @limit_angle: a number in degrees (field of view)
*/
Facade.prototype.canSeeElement = function( entity, look_at_pos, limit_angle)
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

Facade.prototype.setEntityProperty = function( entity, property, value )
{
	console.warn("entityInTarget() Must be implemented to use HBTree system");
}

